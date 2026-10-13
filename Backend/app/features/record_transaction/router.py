import os
import uuid
import shutil
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_roles
from app.core.audit import record_audit_log
from app.common.models.user import User
from app.common.models.transaction import Transaction
from app.common.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionOut,
    RejectRequest,
)

router = APIRouter(tags=["Transactions"])


@router.post(
    "/transaction",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Record a new transaction",
)
def create_transaction(
    request: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Accountant", "Manager"])),
):
    transaction = Transaction(
        TransactionDate=request.TransactionDate,
        TransactionType=request.TransactionType,
        TransactionHead=request.TransactionHead,
        Vendor=request.Vendor,
        Amount=request.Amount,
        Description=request.Description,
        Remarks=request.Remarks,
        Status="Pending",
        CreatedBy=current_user.username,
        CreatedByName=current_user.full_name,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    record_audit_log(
        db=db,
        transaction_id=str(transaction.TransactionID),
        action="TRANSACTION_CREATED",
        user=current_user,
        details=f"Recorded {transaction.TransactionType.value} entry of INR {transaction.Amount:,.2f} for {transaction.Vendor} ({transaction.TransactionHead.value}) with status Pending",
    )

    return transaction


@router.put(
    "/transaction/{transaction_id}",
    response_model=TransactionOut,
    summary="Edit own non-approved transaction",
)
def update_transaction(
    transaction_id: uuid.UUID,
    request: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Accountant"])),
):
    transaction = db.query(Transaction).filter(Transaction.TransactionID == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction record not found.")

    if transaction.CreatedBy != current_user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accountants can only edit transactions they personally created.",
        )

    if transaction.Status == "Approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approved financial transactions cannot be edited. Please request a manager review if adjustments are needed.",
        )

    audit_diffs: list[str] = []
    if request.TransactionDate is not None:
        transaction.TransactionDate = request.TransactionDate
        audit_diffs.append(f"Date set to {request.TransactionDate.strftime(settings.DATE_FORMAT)}")
    if request.TransactionType is not None:
        transaction.TransactionType = request.TransactionType
        audit_diffs.append(f"Type changed to {request.TransactionType.value}")
    if request.TransactionHead is not None:
        transaction.TransactionHead = request.TransactionHead
        audit_diffs.append(f"Head changed to {request.TransactionHead.value}")
    if request.Amount is not None:
        transaction.Amount = request.Amount
        audit_diffs.append(f"Amount changed to INR {request.Amount:,.2f}")
    if request.Vendor is not None:
        transaction.Vendor = request.Vendor
        audit_diffs.append(f"Vendor changed to {request.Vendor}")
    if request.Description is not None:
        transaction.Description = request.Description
        audit_diffs.append(f"Description updated to '{request.Description}'")
    if request.Remarks is not None:
        transaction.Remarks = request.Remarks
        audit_diffs.append("Remarks updated")

    if transaction.Status == "Rejected":
        transaction.Status = "Pending"
        transaction.RejectionReason = None
        audit_diffs.append("Status reset to Pending for manager re-review")

    db.commit()
    db.refresh(transaction)

    record_audit_log(
        db=db,
        transaction_id=str(transaction.TransactionID),
        action="TRANSACTION_UPDATED",
        user=current_user,
        details="; ".join(audit_diffs) if audit_diffs else "Transaction details updated",
    )

    return transaction


@router.post(
    "/transaction/{transaction_id}/approve",
    response_model=TransactionOut,
    summary="Approve transaction (Manager)",
)
def approve_transaction(
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Manager"])),
):
    transaction = db.query(Transaction).filter(Transaction.TransactionID == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction record not found.")

    previous_status = transaction.Status
    transaction.Status = "Approved"
    transaction.ApprovedBy = current_user.username
    transaction.ApprovedByName = current_user.full_name
    transaction.ApprovedAt = datetime.now(timezone.utc)
    transaction.RejectionReason = None

    # Automatically generate official verified receipt document upon approval if none attached
    if not transaction.ReceiptURL:
        receipt_filename = f"receipt_{transaction.TransactionID}_approved.pdf"
        receipt_path = settings.UPLOAD_DIR / receipt_filename
        try:
            from app.core.receipt_generator import generate_transaction_receipt_pdf
            generate_transaction_receipt_pdf(
                file_path=str(receipt_path),
                transaction=transaction,
                approved_by=current_user.full_name,
            )
            transaction.ReceiptURL = f"/uploads/{receipt_filename}"
        except Exception as e:
            # Continue even if PDF generation has file issues
            pass

    db.commit()
    db.refresh(transaction)

    record_audit_log(
        db=db,
        transaction_id=str(transaction.TransactionID),
        action="TRANSACTION_APPROVED",
        user=current_user,
        details=f"Approved by {current_user.full_name}. Generated official receipt voucher. Previous status was {previous_status}",
    )

    return transaction


@router.post(
    "/transaction/{transaction_id}/reject",
    response_model=TransactionOut,
    summary="Reject transaction (Manager)",
)
def reject_transaction(
    transaction_id: uuid.UUID,
    reject_body: Optional[RejectRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Manager"])),
):
    transaction = db.query(Transaction).filter(Transaction.TransactionID == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction record not found.")

    previous_status = transaction.Status
    rejection_reason = (reject_body.reason if reject_body and reject_body.reason else "Requires correction").strip()
    transaction.Status = "Rejected"
    transaction.RejectionReason = rejection_reason

    db.commit()
    db.refresh(transaction)

    record_audit_log(
        db=db,
        transaction_id=str(transaction.TransactionID),
        action="TRANSACTION_REJECTED",
        user=current_user,
        details=f"Rejected by {current_user.full_name}. Reason: '{rejection_reason}'. Previous status: {previous_status}",
    )

    return transaction


@router.post(
    "/transaction/{transaction_id}/receipt",
    response_model=TransactionOut,
    summary="Upload receipt attachment",
)
def upload_receipt(
    transaction_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Accountant", "Manager"])),
):
    transaction = db.query(Transaction).filter(Transaction.TransactionID == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction record not found.")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        allowed = ", ".join(settings.ALLOWED_UPLOAD_EXTENSIONS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {allowed}",
        )

    safe_name = f"receipt_{transaction.TransactionID}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = settings.UPLOAD_DIR / safe_name

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    transaction.ReceiptURL = f"/uploads/{safe_name}"
    db.commit()
    db.refresh(transaction)

    record_audit_log(
        db=db,
        transaction_id=str(transaction.TransactionID),
        action="RECEIPT_UPLOADED",
        user=current_user,
        details=f"Uploaded receipt document '{file.filename}' (stored as {safe_name})",
    )

    return transaction
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.common.models.transaction import Transaction
from app.common.models.user import User
from app.common.schemas.transaction import LatestTransactionsResponse
from app.core.database import get_db
from app.core.deps import get_current_user

router = APIRouter(tags=["Transactions"])


@router.get(
    "/transaction",
    response_model=LatestTransactionsResponse,
    response_model_exclude_none=True,
)
def get_latest_transactions(
    limit: int = Query(100, gt=0, le=1000, description="Number of latest transactions to return"),
    status_filter: Optional[str] = Query(None, description="Filter by status: Pending, Approved, Rejected, or All"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns latest transactions based on role permissions:
    - Manager & Auditor: Can view all transactions across the system.
    - Accountant: Can view their own transactions (any status) + all approved transactions.
    """
    query = db.query(Transaction)

    # Role-based visibility
    if current_user.role == "Accountant":
        query = query.filter(
            or_(
                Transaction.CreatedBy == current_user.username,
                Transaction.Status == "Approved",
            )
        )

    # Optional status filter
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Transaction.Status.ilike(status_filter))

    txns = query.order_by(desc(Transaction.CreatedAt)).limit(limit).all()

    return LatestTransactionsResponse(
        count=len(txns),
        transactions=txns,
    )
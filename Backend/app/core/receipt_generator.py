import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.common.models.transaction import Transaction


def generate_transaction_receipt_pdf(
    file_path: str,
    transaction: Transaction,
    approved_by: str,
) -> None:
    """Generates an official verified transaction receipt PDF upon approval."""
    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#451a03"),
        fontName="Helvetica-Bold",
    )
    sub_style = ParagraphStyle(
        "DocSub",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748b"),
    )
    sec_style = ParagraphStyle(
        "SecHead",
        parent=styles["Heading3"],
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        fontName="Helvetica-Bold",
    )

    story.append(Paragraph("KRISSACO ENTERPRISE FINANCIAL RECEIPT", title_style))
    story.append(
        Paragraph(
            f"Official Transaction Voucher &bull; ID: <b>{str(transaction.TransactionID)[:12]}...</b> &bull; "
            f"Generated: {datetime.now().strftime('%d-%m-%Y %H:%M')}",
            sub_style,
        )
    )
    story.append(Spacer(1, 14))

    # Party Information Table
    party_info = [
        [
            Paragraph(
                f"<b>ISSUED TO / PARTY:</b><br/>"
                f"<b>{transaction.Vendor}</b><br/>"
                f"Category: {transaction.TransactionHead.value}<br/>"
                f"Accountant: {transaction.CreatedByName}",
                styles["Normal"],
            ),
            Paragraph(
                f"<b>VERIFICATION STATUS:</b><br/>"
                f"<font color='#059669'><b>OFFICIALLY APPROVED</b></font><br/>"
                f"Approved by: <b>{approved_by}</b> (Manager)<br/>"
                f"Date of Record: {transaction.TransactionDate.strftime('%d-%m-%Y')}",
                styles["Normal"],
            ),
        ]
    ]
    party_table = Table(party_info, colWidths=[270, 270])
    party_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    story.append(party_table)
    story.append(Spacer(1, 16))

    # Line Item Breakdown
    txn_type = transaction.TransactionType.value
    amount_val = float(transaction.Amount)
    desc_text = transaction.Description or "Coffee business operational transaction"

    items_data = [
        ["Line Description", "Classification", "Nature", "Total Amount (INR)"],
        [desc_text, transaction.TransactionHead.value, txn_type, f"INR {amount_val:,.2f}"],
        ["TOTAL APPROVED VALUE", "", "", f"INR {amount_val:,.2f}"],
    ]
    items_table = Table(items_data, colWidths=[240, 110, 80, 110])
    items_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#451a03")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, 1), [colors.white]),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f1f5f9")),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ])
    )
    story.append(items_table)
    story.append(Spacer(1, 16))

    # Audit & Compliance Seal
    story.append(
        Paragraph(
            "<font color='#059669'><b>[VERIFIED & RECORDED IN AUDIT LEDGER]</b></font><br/>"
            "This document is an authenticated digital voucher verified under Krissaco Financial Control Standards. "
            "All associated actions are permanently recorded in the immutable audit log.",
            ParagraphStyle("CertNote", parent=styles["Normal"], fontSize=8, leading=11, textColor=colors.HexColor("#475569")),
        )
    )

    doc.build(story)

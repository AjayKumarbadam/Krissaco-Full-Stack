import io
from datetime import datetime
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.exceptions import KrissacoException
from app.common.models.transaction import Transaction, TransactionType
from app.common.models.user import User
from app.features.statement.schema import StatementResponse

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter(tags=["Statements"])


def parse_date(value: str, field_name: str):
    try:
        return datetime.strptime(value, settings.DATE_FORMAT).date()
    except ValueError:
        raise KrissacoException(f"'{field_name}' must match format DD-MM-YYYY (e.g. 09-10-2026)")


@router.get(
    "/statement",
    response_model=StatementResponse,
    summary="Generate financial statement (Approved transactions only)",
)
def get_statement(
    start_date: str = Query(..., description="Start date (DD-MM-YYYY)"),
    end_date: str = Query(..., description="End date (DD-MM-YYYY)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = parse_date(start_date, "start_date")
    end = parse_date(end_date, "end_date")

    if end <= start:
        raise KrissacoException("Statement end_date must be strictly after start_date.")

    txns = (
        db.query(Transaction)
        .filter(
            Transaction.TransactionDate >= start,
            Transaction.TransactionDate <= end,
            Transaction.Status == "Approved",
        )
        .order_by(desc(Transaction.TransactionDate), desc(Transaction.CreatedAt))
        .all()
    )

    total_revenue = sum(
        (t.Amount for t in txns if t.TransactionType == TransactionType.REVENUE),
        Decimal("0.00"),
    )
    total_expense = sum(
        (t.Amount for t in txns if t.TransactionType == TransactionType.EXPENSE),
        Decimal("0.00"),
    )

    return StatementResponse(
        count=len(txns),
        total_revenue=total_revenue,
        total_expense=total_expense,
        net=total_revenue - total_expense,
        transactions=txns,
    )


@router.get(
    "/statement/pdf",
    summary="Download PDF financial statement report",
)
def export_statement_pdf(
    start_date: str = Query(..., description="Start date (DD-MM-YYYY)"),
    end_date: str = Query(..., description="End date (DD-MM-YYYY)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = parse_date(start_date, "start_date")
    end = parse_date(end_date, "end_date")

    if end <= start:
        raise KrissacoException("Statement end_date must be strictly after start_date.")

    txns: List[Transaction] = (
        db.query(Transaction)
        .filter(
            Transaction.TransactionDate >= start,
            Transaction.TransactionDate <= end,
            Transaction.Status == "Approved",
        )
        .order_by(desc(Transaction.TransactionDate), desc(Transaction.CreatedAt))
        .all()
    )

    total_revenue = sum(
        (t.Amount for t in txns if t.TransactionType == TransactionType.REVENUE),
        Decimal("0.00"),
    )
    total_expense = sum(
        (t.Amount for t in txns if t.TransactionType == TransactionType.EXPENSE),
        Decimal("0.00"),
    )
    net_profit = total_revenue - total_expense

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
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
    cell_head = ParagraphStyle(
        "CellHead",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#475569"),
        fontName="Helvetica-Bold",
    )
    cell_val = ParagraphStyle(
        "CellVal",
        parent=styles["Normal"],
        fontSize=12,
        leading=15,
        fontName="Helvetica-Bold",
    )

    story.append(Paragraph("KRISSACO FINANCIAL STATEMENT", title_style))
    story.append(
        Paragraph(
            f"Reporting Period: <b>{start_date}</b> to <b>{end_date}</b> &nbsp;|&nbsp; "
            f"Generated: {datetime.now().strftime('%d-%m-%Y %H:%M')} &nbsp;|&nbsp; "
            f"Officer: {current_user.full_name} ({current_user.role})",
            sub_style,
        )
    )
    story.append(Spacer(1, 14))

    # Metric summary card table
    summary_cells = [
        [
            Paragraph("TOTAL APPROVED REVENUE", cell_head),
            Paragraph("TOTAL APPROVED EXPENSE", cell_head),
            Paragraph("NET SURPLUS / (DEFICIT)", cell_head),
        ],
        [
            Paragraph(f"<font color='#059669'>INR {total_revenue:,.2f}</font>", cell_val),
            Paragraph(f"<font color='#dc2626'>INR {total_expense:,.2f}</font>", cell_val),
            Paragraph(
                f"<font color=\"{'#059669' if net_profit >= 0 else '#dc2626'}\">INR {net_profit:,.2f}</font>",
                cell_val,
            ),
        ],
    ]
    summary_table = Table(summary_cells, colWidths=[180, 180, 180])
    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(summary_table)
    story.append(Spacer(1, 16))

    story.append(
        Paragraph(
            f"Approved Line Items ({len(txns)} records)",
            ParagraphStyle("SecHead", parent=styles["Heading3"], fontSize=11, textColor=colors.HexColor("#1e293b")),
        )
    )
    story.append(Spacer(1, 6))

    # Items table
    table_rows = [["Date", "Type", "Category Head", "Vendor / Party", "Amount", "Status"]]
    for t in txns:
        table_rows.append([
            t.TransactionDate.strftime(settings.DATE_FORMAT),
            t.TransactionType.value,
            t.TransactionHead.value,
            t.Vendor[:26] + ("..." if len(t.Vendor) > 26 else ""),
            f"INR {t.Amount:,.2f}",
            t.Status,
        ])

    if not txns:
        table_rows.append(["No approved transactions found for this date range.", "", "", "", "", ""])

    items_table = Table(table_rows, colWidths=[65, 60, 125, 155, 85, 50])
    items_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#451a03")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ])
    )
    story.append(items_table)
    story.append(Spacer(1, 14))

    story.append(
        Paragraph(
            "Official statement generated according to Krissaco SRS v2.0 standards. Excludes unapproved or rejected entries.",
            ParagraphStyle("Footer", parent=styles["Normal"], fontSize=7, textColor=colors.HexColor("#94a3b8")),
        )
    )

    doc.build(story)
    buffer.seek(0)

    download_name = f"Krissaco_Statement_{start_date}_to_{end_date}.pdf"
    return Response(
        content=buffer.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
    )
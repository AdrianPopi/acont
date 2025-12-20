from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.invoice import Invoice, InvoiceItem, InvoiceSequence, DocType


def compute_totals(inv: Invoice) -> None:
    net = 0
    vat_total = 0
    breakdown: dict = {}

    for it in inv.items:
        line_net = it.unit_net_cents * it.quantity
        line_vat = (line_net * it.vat_rate_bp) // 10000

        net += line_net
        vat_total += line_vat

        k = str(it.vat_rate_bp)
        if k not in breakdown:
            breakdown[k] = {"base_cents": 0, "vat_cents": 0}
        breakdown[k]["base_cents"] += line_net
        breakdown[k]["vat_cents"] += line_vat

    inv.net_total_cents = net
    inv.vat_total_cents = vat_total
    inv.gross_total_cents = net + vat_total
    inv.vat_breakdown = breakdown


def next_invoice_number(db: Session, merchant_id: int, year: int, series: str = "INV") -> tuple[int, str]:
    # Row-level lock so no duplicates (Postgres)
    stmt = (
        select(InvoiceSequence)
        .where(
            InvoiceSequence.merchant_id == merchant_id,
            InvoiceSequence.doc_type == DocType.invoice,
            InvoiceSequence.year == year,
        )
        .with_for_update()
    )
    seq_row = db.execute(stmt).scalar_one_or_none()

    if not seq_row:
        seq_row = InvoiceSequence(merchant_id=merchant_id, doc_type=DocType.invoice, year=year, next_number=1)
        db.add(seq_row)
        db.flush()

    n = seq_row.next_number
    seq_row.next_number = n + 1

    number = f"{series}-{year}-{n:06d}"
    return n, number

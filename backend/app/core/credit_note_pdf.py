from __future__ import annotations

from io import BytesIO
from pathlib import Path
from collections import defaultdict

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import requests

from app.models.credit_note import CreditNote


LABELS = {
    "EN": {
        "credit_note": "Credit note",
        "issue_date": "Issue date",
        "bill_to": "Bill to",
        "code": "Code",
        "description": "Description",
        "net": "Net",
        "vat": "VAT",
        "gross": "Gross",
        "subtotal": "Subtotal",
        "vat_total": "VAT total",
        "total": "Total",
        "draft": "DRAFT",
        "communication": "Communication",
    },
    "FR": {
        "credit_note": "Note de crédit",
        "issue_date": "Date d’émission",
        "bill_to": "Facturer à",
        "code": "Code",
        "description": "Description",
        "net": "HT",
        "vat": "TVA",
        "gross": "TTC",
        "subtotal": "Sous-total",
        "vat_total": "Total TVA",
        "total": "Total",
        "draft": "BROUILLON",
        "communication": "Communication",
    },
    "NL": {
        "credit_note": "Creditnota",
        "issue_date": "Datum",
        "bill_to": "Factureren aan",
        "code": "Code",
        "description": "Omschrijving",
        "net": "Netto",
        "vat": "BTW",
        "gross": "Bruto",
        "subtotal": "Subtotaal",
        "vat_total": "BTW totaal",
        "total": "Totaal",
        "draft": "CONCEPT",
        "communication": "Communicatie",
    },
}


def tr(lang: str | None, key: str) -> str:
    lang2 = (lang or "FR").strip().upper()
    return LABELS.get(lang2, LABELS["FR"]).get(key, key)


def draw_logo(c: canvas.Canvas, merchant_logo_url: str | None, *, x=40, y=790, w=110, h=35) -> bool:
    if not merchant_logo_url:
        return False

    try:
        # URL direct
        if merchant_logo_url.startswith("http://") or merchant_logo_url.startswith("https://"):
            r = requests.get(merchant_logo_url, timeout=3)
            r.raise_for_status()
            img = ImageReader(BytesIO(r.content))
            c.drawImage(img, x=x, y=y, width=w, height=h, mask="auto", preserveAspectRatio=True)
            return True

        # path local /static/...
        if merchant_logo_url.startswith("/static/"):
            local_path = Path(merchant_logo_url.lstrip("/"))
            if local_path.exists():
                c.drawImage(ImageReader(str(local_path)), x=x, y=y, width=w, height=h, mask="auto", preserveAspectRatio=True)
                return True
    except Exception:
        pass

    return False


def _vat_breakdown(cn: CreditNote):
    b = defaultdict(lambda: {"vat": 0.0})
    for it in cn.items:
        k = f"{float(it.vat_rate):.2f}".rstrip("0").rstrip(".")
        b[k]["vat"] += float(it.line_vat)
    return dict(b)


def _draw_header(c: canvas.Canvas, *, tpl: str, w: float, h: float, merchant_logo_url: str | None) -> float:
    """
    Desenează headerul identic ca la invoice și returnează y start pentru conținut.
    """
    tpl = (tpl or "classic").strip().lower()

    if tpl == "modern":
        # bară neagră sus
        c.setFillColor(colors.black)
        c.rect(0, h - 72, w, 72, fill=1, stroke=0)
        c.setFillColor(colors.white)

        # logo pe bară (ușor mai jos ca să nu atingă marginea)
        draw_logo(c, merchant_logo_url, x=30, y=h - 55, w=110, h=35)

        c.setFont("Helvetica-Bold", 18)
        c.drawRightString(w - 30, h - 45, "ACONT")
        c.setFillColor(colors.black)
        return h - 95

    if tpl == "minimal":
        logo_drawn = draw_logo(c, merchant_logo_url, x=40, y=h - 60, w=110, h=35)
        c.setFont("Helvetica-Bold", 14)
        title_x = 160 if logo_drawn else 50
        c.drawString(title_x, h - 50, "ACONT")
        return h - 80

    # classic
    logo_drawn = draw_logo(c, merchant_logo_url, x=40, y=h - 60, w=110, h=35)
    c.setFont("Helvetica-Bold", 16)
    title_x = 160 if logo_drawn else 50
    c.drawString(title_x, h - 50, "ACONT")
    return h - 85


def build_credit_note_pdf(cn: CreditNote, merchant_logo_url: str | None = None) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4

    lang = (cn.language or "FR").strip().upper()
    tpl = (getattr(cn, "template", "classic") or "classic").strip().lower()

    y = _draw_header(c, tpl=tpl, w=w, h=h, merchant_logo_url=merchant_logo_url)

    # Title
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, f"{tr(lang,'credit_note')}: {cn.credit_note_no or tr(lang,'draft')}")
    y -= 18

    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"{tr(lang,'issue_date')}: {cn.issue_date.isoformat()}")
    y -= 14

    y -= 10
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, f"{tr(lang,'bill_to')}:")
    y -= 14
    c.setFont("Helvetica", 10)
    c.drawString(50, y, cn.client_name or "-")
    y -= 12
    if cn.client_address:
        c.drawString(50, y, cn.client_address[:90])
        y -= 12
    if cn.client_email:
        c.drawString(50, y, cn.client_email)
        y -= 12

    y -= 18

    # Table header
    def draw_table_header(ypos: float) -> float:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, ypos, tr(lang, "code"))
        c.drawString(140, ypos, tr(lang, "description"))
        c.drawRightString(420, ypos, tr(lang, "net"))
        c.drawRightString(480, ypos, tr(lang, "vat"))
        c.drawRightString(545, ypos, tr(lang, "gross"))
        ypos -= 8
        c.line(50, ypos, 545, ypos)
        return ypos - 14

    y = draw_table_header(y)

    # Lines
    c.setFont("Helvetica", 9)
    for it in cn.items:
        if y < 120:
            c.showPage()
            y = _draw_header(c, tpl=tpl, w=w, h=h, merchant_logo_url=merchant_logo_url)
            y = draw_table_header(y)
            c.setFont("Helvetica", 9)

        c.drawString(50, y, (it.item_code or "")[:12])
        c.drawString(140, y, (it.description or "")[:45])
        c.drawRightString(420, y, f"{float(it.line_net):.2f}")
        c.drawRightString(480, y, f"{float(it.line_vat):.2f}")
        c.drawRightString(545, y, f"{float(it.line_gross):.2f}")
        y -= 14

    # Totals separator
    y -= 10
    c.line(350, y, 545, y)
    y -= 16

    # Totals block (aliniat ca la invoice)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(545 - 65, y, f"{tr(lang,'subtotal')}:")
    c.drawRightString(545, y, f"{float(cn.subtotal_net):.2f} {cn.currency}")
    y -= 14

    breakdown = _vat_breakdown(cn)
    c.setFont("Helvetica", 9)
    for rate, row in sorted(breakdown.items(), key=lambda kv: float(kv[0])):
        # FR preferă "TVA", EN/NL preferă VAT/BTW (dar ok să rămână VAT peste tot)
        label_prefix = "TVA" if lang == "FR" else ("BTW" if lang == "NL" else "VAT")
        c.drawRightString(545 - 65, y, f"{label_prefix} {rate}%:")
        c.drawRightString(545, y, f"{float(row['vat']):.2f} {cn.currency}")
        y -= 12

    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(545 - 65, y, f"{tr(lang,'vat_total')}:")
    c.drawRightString(545, y, f"{float(cn.vat_total):.2f} {cn.currency}")
    y -= 14

    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(545 - 65, y, f"{tr(lang,'total')}:")
    c.drawRightString(545, y, f"{float(cn.total_gross):.2f} {cn.currency}")
    y -= 14

    # structured communication
    if getattr(cn, "communication_mode", "simple") == "structured" and getattr(cn, "communication_reference", ""):
        c.setFont("Helvetica", 9)
        c.drawRightString(545 - 65, y, f"{tr(lang,'communication')}:")
        c.drawRightString(545, y, cn.communication_reference)
        y -= 12

    c.showPage()
    c.save()
    return buf.getvalue()

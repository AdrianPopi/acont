from __future__ import annotations

from io import BytesIO
from pathlib import Path
from collections import defaultdict

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import requests
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path as _Path

from app.models.invoice import Invoice


LABELS = {
    "EN": {
        "invoice": "Invoice",
        "issue_date": "Issue date",
        "due_date": "Due date",
        "bill_to": "Bill to",
        "code": "Code",
        "description": "Description",
        "net": "Net",
        "vat": "VAT",
        "gross": "Gross",
        "subtotal": "Subtotal",
        "vat_total": "VAT total",
        "total": "Total",
        "advance_paid": "Advance paid",
        "due": "Due",
        "draft": "DRAFT",
    },
    "FR": {
        "invoice": "Facture",
        "issue_date": "Date d’émission",
        "due_date": "Échéance",
        "bill_to": "Facturer à",
        "code": "Code",
        "description": "Description",
        "net": "HT",
        "vat": "TVA",
        "gross": "TTC",
        "subtotal": "Sous-total",
        "vat_total": "Total TVA",
        "total": "Total",
        "advance_paid": "Acompte versé",
        "due": "Reste à payer",
        "draft": "BROUILLON",
    },
    "NL": {
        "invoice": "Factuur",
        "issue_date": "Factuurdatum",
        "due_date": "Vervaldatum",
        "bill_to": "Factureren aan",
        "code": "Code",
        "description": "Omschrijving",
        "net": "Netto",
        "vat": "BTW",
        "gross": "Bruto",
        "subtotal": "Subtotaal",
        "vat_total": "BTW totaal",
        "total": "Totaal",
        "advance_paid": "Voorschot betaald",
        "due": "Te betalen",
        "draft": "CONCEPT",
    },
    "RO": {
        "invoice": "Factură",
        "issue_date": "Data emiterii",
        "due_date": "Termen limită",
        "bill_to": "Facturat către",
        "code": "Cod",
        "description": "Denumire",
        "net": "Fără TVA",
        "vat": "TVA",
        "gross": "Cu TVA",
        "subtotal": "Subtotal",
        "vat_total": "Total TVA",
        "total": "Total",
        "advance_paid": "Plătit în avans",
        "due": "De plată",
        "draft": "CIOARNĂ",
    },
}


def tr(lang: str | None, key: str) -> str:
    lang2 = (lang or "FR").strip().upper()
    return LABELS.get(lang2, LABELS["FR"]).get(key, key)


def draw_logo(c, merchant_logo_url: str | None, *, x=40, y=790, w=110, h=35) -> bool:
    if not merchant_logo_url:
        return False

    try:
        # 1) URL direct (ex: https://.../logo.png) -> DO Spaces, etc.
        if merchant_logo_url.startswith("http://") or merchant_logo_url.startswith("https://"):
            r = requests.get(merchant_logo_url, timeout=3)
            r.raise_for_status()
            img = ImageReader(BytesIO(r.content))
            c.drawImage(
                img, x=x, y=y, width=w, height=h,
                mask="auto", preserveAspectRatio=True
            )
            return True

        # 2) path local /static/...
        if merchant_logo_url.startswith("/static/"):
            local_path = Path(merchant_logo_url.lstrip("/"))  # static/logos/...
            if local_path.exists():
                c.drawImage(
                    ImageReader(str(local_path)), x=x, y=y, width=w, height=h,
                    mask="auto", preserveAspectRatio=True
                )
                return True
    except Exception:
        pass

    return False


def _vat_breakdown_from_invoice(inv: Invoice):
    # group by vat_rate (as stored on items)
    b = defaultdict(lambda: {"base": 0.0, "vat": 0.0})
    for it in inv.items:
        k = f"{float(it.vat_rate):.2f}".rstrip("0").rstrip(".")
        b[k]["base"] += float(it.line_net)
        b[k]["vat"] += float(it.line_vat)
    return dict(b)


def _draw_totals_block(c: canvas.Canvas, inv: Invoice, lang: str, x_right: int, y: int):
    breakdown = _vat_breakdown_from_invoice(inv)

    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(x_right - 65, y, f"{tr(lang,'subtotal')}:")
    c.drawRightString(x_right, y, f"{float(inv.subtotal_net):.2f} {inv.currency}")
    y -= 14

    # TVA pe cote
    c.setFont("Helvetica", 9)
    for rate, row in sorted(breakdown.items(), key=lambda kv: float(kv[0])):
        c.drawRightString(x_right - 65, y, f"TVA {rate}%:")
        c.drawRightString(x_right, y, f"{float(row['vat']):.2f} {inv.currency}")
        y -= 12

    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(x_right - 65, y, f"{tr(lang,'vat_total')}:")
    c.drawRightString(x_right, y, f"{float(inv.vat_total):.2f} {inv.currency}")
    y -= 14

    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(x_right - 65, y, f"{tr(lang,'total')}:")
    c.drawRightString(x_right, y, f"{float(inv.total_gross):.2f} {inv.currency}")
    y -= 16

    if float(inv.advance_paid) > 0:
        c.setFont("Helvetica", 10)
        c.drawRightString(x_right - 65, y, f"{tr(lang,'advance_paid')}:")
        c.drawRightString(x_right, y, f"{float(inv.advance_paid):.2f} {inv.currency}")
        y -= 14

        due = float(inv.total_gross) - float(inv.advance_paid)
        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(x_right - 65, y, f"{tr(lang,'due')}:")
        c.drawRightString(x_right, y, f"{due:.2f} {inv.currency}")
        y -= 14

    # structured communication
    if getattr(inv, "communication_mode", "simple") == "structured" and getattr(inv, "communication_reference", ""):
        c.setFont("Helvetica", 9)
        c.drawRightString(x_right - 65, y, "Communication:")
        c.drawRightString(x_right, y, inv.communication_reference)
        y -= 12

    return y


def build_invoice_pdf(inv: Invoice, merchant_logo_url: str | None = None) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4

    # Register a Unicode TrueType font when available (DejaVu Sans common on Linux)
    # Fallback to built-in Helvetica if not present.
    _deja_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    _deja_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    FONT_REGULAR = "Helvetica"
    FONT_BOLD = "Helvetica-Bold"
    try:
        if _Path(_deja_path).exists():
            pdfmetrics.registerFont(TTFont("DejaVuSans", _deja_path))
            FONT_REGULAR = "DejaVuSans"
        if _Path(_deja_bold).exists():
            pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", _deja_bold))
            FONT_BOLD = "DejaVuSans-Bold"
    except Exception:
        # keep Helvetica if registration fails
        FONT_REGULAR = "Helvetica"
        FONT_BOLD = "Helvetica-Bold"

    lang = (inv.language or "FR").strip().upper()
    tpl = (getattr(inv, "template", "classic") or "classic").strip().lower()

    # Header layout differences (3 templates)
    if tpl == "modern":
        # modern: top bar
        c.setFillColor(colors.black)
        c.rect(0, h - 72, w, 72, fill=1, stroke=0)
        c.setFillColor(colors.white)

        draw_logo(c, merchant_logo_url, x=30, y=h - 55, w=110, h=35)
        c.setFont(FONT_BOLD, 18)
        c.drawRightString(w - 30, h - 45, "ACONT")
        c.setFillColor(colors.black)

        y = h - 95

    elif tpl == "minimal":
        # minimal: very clean
        logo_drawn = draw_logo(c, merchant_logo_url, x=40, y=h - 60, w=110, h=35)
        c.setFont(FONT_BOLD, 14)
        title_x = 160 if logo_drawn else 50
        c.drawString(title_x, h - 50, "ACONT")
        y = h - 80

    else:
        # classic (existing style)
        logo_drawn = draw_logo(c, merchant_logo_url, x=40, y=h - 60, w=110, h=35)
        c.setFont(FONT_BOLD, 16)
        title_x = 160 if logo_drawn else 50
        c.drawString(title_x, h - 50, "ACONT")
        y = h - 85

    # Title
    c.setFont(FONT_BOLD, 12)
    c.drawString(50, y, f"{tr(lang,'invoice')}: {inv.invoice_no or tr(lang,'draft')}")
    y -= 18

    c.setFont(FONT_REGULAR, 10)
    c.drawString(50, y, f"{tr(lang,'issue_date')}: {inv.issue_date.isoformat()}")
    y -= 14
    if inv.due_date:
        c.drawString(50, y, f"{tr(lang,'due_date')}: {inv.due_date.isoformat()}")
        y -= 14

    y -= 10
    c.setFont(FONT_BOLD, 11)
    c.drawString(50, y, f"{tr(lang,'bill_to')}:")
    y -= 14
    c.setFont(FONT_REGULAR, 10)
    c.drawString(50, y, inv.client_name or "-")
    y -= 12
    if inv.client_address:
        c.drawString(50, y, inv.client_address[:90])
        y -= 12
    if inv.client_email:
        c.drawString(50, y, inv.client_email)
        y -= 12

    y -= 18

    # Table header
    c.setFont(FONT_BOLD, 10)
    c.drawString(50, y, tr(lang, "code"))
    c.drawString(140, y, tr(lang, "description"))
    c.drawRightString(420, y, tr(lang, "net"))
    c.drawRightString(480, y, tr(lang, "vat"))
    c.drawRightString(545, y, tr(lang, "gross"))
    y -= 8
    c.line(50, y, 545, y)
    y -= 14

    c.setFont(FONT_REGULAR, 9)
    for it in inv.items:
        if y < 120:
            c.showPage()
            y = h - 80
            c.setFont(FONT_REGULAR, 9)

        c.drawString(50, y, (it.item_code or "")[:12])
        c.drawString(140, y, (it.description or "")[:45])
        c.drawRightString(420, y, f"{float(it.line_net):.2f}")
        c.drawRightString(480, y, f"{float(it.line_vat):.2f}")
        c.drawRightString(545, y, f"{float(it.line_gross):.2f}")
        y -= 14

    y -= 10
    c.line(350, y, 545, y)
    y -= 16

    _draw_totals_block(c, inv, lang, 545, y)

    c.showPage()
    c.save()
    return buf.getvalue()

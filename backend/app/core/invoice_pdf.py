from io import BytesIO
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import requests


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
    except:
        pass

    return False



def build_invoice_pdf(inv: Invoice, merchant_logo_url: str | None = None) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4

    lang = (inv.language or "FR").strip().upper()

    # ✅ logo sus-stânga + titlu la dreapta dacă există logo
    logo_drawn = draw_logo(c, merchant_logo_url, x=40, y=h - 60, w=110, h=35)

    y = h - 50
    c.setFont("Helvetica-Bold", 16)

    title_x = 160 if logo_drawn else 50   # 40 + 110 + ~10 padding
    c.drawString(title_x, y, "ACONT")
    y -= 24


    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, f"{tr(lang,'invoice')}: {inv.invoice_no or tr(lang,'draft')}")
    y -= 18

    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"{tr(lang,'issue_date')}: {inv.issue_date.isoformat()}")
    y -= 14
    if inv.due_date:
        c.drawString(50, y, f"{tr(lang,'due_date')}: {inv.due_date.isoformat()}")
        y -= 14

    y -= 10
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, f"{tr(lang,'bill_to')}:")
    y -= 14
    c.setFont("Helvetica", 10)
    c.drawString(50, y, inv.client_name or "-")
    y -= 12
    if inv.client_address:
        c.drawString(50, y, inv.client_address[:90])
        y -= 12
    if inv.client_email:
        c.drawString(50, y, inv.client_email)
        y -= 12

    y -= 18
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y, tr(lang, "code"))
    c.drawString(140, y, tr(lang, "description"))
    c.drawRightString(420, y, tr(lang, "net"))
    c.drawRightString(480, y, tr(lang, "vat"))
    c.drawRightString(545, y, tr(lang, "gross"))
    y -= 8
    c.line(50, y, 545, y)
    y -= 14

    c.setFont("Helvetica", 9)
    for it in inv.items:
        if y < 120:
            c.showPage()
            y = h - 60
            c.setFont("Helvetica", 9)

        c.drawString(50, y, (it.item_code or "")[:12])
        c.drawString(140, y, (it.description or "")[:45])
        c.drawRightString(420, y, f"{float(it.line_net):.2f}")
        c.drawRightString(480, y, f"{float(it.line_vat):.2f}")
        c.drawRightString(545, y, f"{float(it.line_gross):.2f}")
        y -= 14

    y -= 10
    c.line(350, y, 545, y)
    y -= 16

    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(480, y, f"{tr(lang,'subtotal')}:")
    c.drawRightString(545, y, f"{float(inv.subtotal_net):.2f} {inv.currency}")
    y -= 14

    c.drawRightString(480, y, f"{tr(lang,'vat_total')}:")
    c.drawRightString(545, y, f"{float(inv.vat_total):.2f} {inv.currency}")
    y -= 14

    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(480, y, f"{tr(lang,'total')}:")
    c.drawRightString(545, y, f"{float(inv.total_gross):.2f} {inv.currency}")
    y -= 16

    if float(inv.advance_paid) > 0:
        c.setFont("Helvetica", 10)
        c.drawRightString(480, y, f"{tr(lang,'advance_paid')}:")
        c.drawRightString(545, y, f"{float(inv.advance_paid):.2f} {inv.currency}")
        y -= 14

        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(480, y, f"{tr(lang,'due')}:")
        due = float(inv.total_gross) - float(inv.advance_paid)
        c.drawRightString(545, y, f"{due:.2f} {inv.currency}")

    c.showPage()
    c.save()
    return buf.getvalue()

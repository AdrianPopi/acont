"""
Email service for ACONT.
Handles sending transactional emails with multi-language support.
"""
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, List
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)

# Logo URL for emails
LOGO_URL = "https://acont.be/logo.png"  # Update with actual logo URL

def get_email_html_template(content: str, lang: str = "en") -> str:
    """Wrap email content in a styled HTML template with logo."""
    return f"""
<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ACONT</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; border-bottom: 1px solid #eee;">
                            <img src="{LOGO_URL}" alt="ACONT" style="height: 50px; width: auto;" />
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px; color: #333333; font-size: 16px; line-height: 1.6;">
                            {content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 16px 16px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 14px; color: #666;">
                                <strong>Acont.be</strong><br/>
                                <a href="mailto:info@acont.be" style="color: #007bff; text-decoration: none;">info@acont.be</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


# Email templates with multi-language support
EMAIL_TEMPLATES = {
    "welcome": {
        "subject": {
            "en": "Welcome to ACONT! 🎉",
            "fr": "Bienvenue chez ACONT ! 🎉",
            "nl": "Welkom bij ACONT! 🎉",
            "ro": "Bine ai venit la ACONT! 🎉",
        },
        "body": {
            "en": """
<h2 style="margin: 0 0 20px 0; color: #222;">Welcome to ACONT! 🎉</h2>

<p>Hello {first_name},</p>

<p>Thank you for choosing <strong>ACONT</strong> for <strong>{company_name}</strong>!</p>

<p>This is an excellent choice! Our invoicing platform will help you automate many administrative processes. Save time and money! 👌</p>

<p>During your <strong>1-month free trial</strong>, you can:</p>
<ul style="padding-left: 20px;">
    <li>✅ Create and manage purchase & sales invoices</li>
    <li>✅ Export to PDF and structured formats</li>
    <li>✅ Benefit from Peppol integration (Pro/Enterprise)</li>
</ul>

<p>Ready to start? Click the button below:</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{dashboard_url}" style="display: inline-block; background: linear-gradient(135deg, #4ade80, #22d3ee); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">ACTIVATE MY ACCOUNT</a>
</p>

<p>Good luck!</p>

<p style="margin-top: 30px;">With digital greetings,</p>
""",
            "fr": """
<h2 style="margin: 0 0 20px 0; color: #222;">Bienvenue chez ACONT ! 🎉</h2>

<p>Bonjour {first_name},</p>

<p>Merci d'utiliser <strong>ACONT</strong> pour <strong>{company_name}</strong> !</p>

<p>C'est un excellent choix, car notre plateforme de facturation vous permettra d'automatiser de nombreux processus administratifs. De quoi vous faire gagner du temps et de l'argent ! 👌</p>

<p>Pendant votre <strong>période d'essai gratuite d'1 mois</strong>, vous pouvez :</p>
<ul style="padding-left: 20px;">
    <li>✅ Créer et gérer vos factures d'achat et de vente</li>
    <li>✅ Exporter en PDF et formats structurés</li>
    <li>✅ Bénéficier de l'intégration Peppol (Pro/Enterprise)</li>
</ul>

<p>Intéressé(e) ? Alors commencez tout de suite !</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{dashboard_url}" style="display: inline-block; background: linear-gradient(135deg, #4ade80, #22d3ee); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">ACTIVATION</a>
</p>

<p>Bonne chance !</p>

<p style="margin-top: 30px;">Avec nos salutations numériques,</p>
""",
            "nl": """
<h2 style="margin: 0 0 20px 0; color: #222;">Welkom bij ACONT! 🎉</h2>

<p>Hallo {first_name},</p>

<p>Bedankt dat je <strong>ACONT</strong> gebruikt voor <strong>{company_name}</strong>!</p>

<p>Dit is een uitstekende keuze! Ons facturatieplatform helpt je bij het automatiseren van veel administratieve processen. Bespaar tijd en geld! 👌</p>

<p>Tijdens je <strong>gratis proefperiode van 1 maand</strong> kun je:</p>
<ul style="padding-left: 20px;">
    <li>✅ Aankoop- en verkoopfacturen aanmaken en beheren</li>
    <li>✅ Exporteren naar PDF en gestructureerde formaten</li>
    <li>✅ Profiteren van Peppol-integratie (Pro/Enterprise)</li>
</ul>

<p>Klaar om te beginnen? Klik op de knop hieronder:</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{dashboard_url}" style="display: inline-block; background: linear-gradient(135deg, #4ade80, #22d3ee); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">ACTIVEREN</a>
</p>

<p>Veel succes!</p>

<p style="margin-top: 30px;">Met digitale groeten,</p>
""",
            "ro": """
<h2 style="margin: 0 0 20px 0; color: #222;">Bine ai venit la ACONT! 🎉</h2>

<p>Bună {first_name},</p>

<p>Îți mulțumim că ai ales <strong>ACONT</strong> pentru <strong>{company_name}</strong>!</p>

<p>Este o alegere excelentă! Platforma noastră de facturare te va ajuta să automatizezi multe procese administrative. Economisești timp și bani! 👌</p>

<p>În timpul <strong>perioadei de probă gratuite de 1 lună</strong>, poți:</p>
<ul style="padding-left: 20px;">
    <li>✅ Crea și gestiona facturi de achiziție și vânzare</li>
    <li>✅ Exporta în PDF și formate structurate</li>
    <li>✅ Beneficia de integrarea Peppol (Pro/Enterprise)</li>
</ul>

<p>Pregătit să începi? Apasă butonul de mai jos:</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{dashboard_url}" style="display: inline-block; background: linear-gradient(135deg, #4ade80, #22d3ee); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">ACTIVARE</a>
</p>

<p>Mult succes!</p>

<p style="margin-top: 30px;">Cu salutări digitale,</p>
""",
        },
    },
    "forgot_password": {
        "subject": {
            "en": "ACONT - Reset Your Password",
            "fr": "ACONT - Réinitialisez votre mot de passe",
            "nl": "ACONT - Reset je wachtwoord",
            "ro": "ACONT - Resetează-ți parola",
        },
        "body": {
            "en": """
<h2 style="margin: 0 0 20px 0; color: #222;">Reset Your Password</h2>

<p>Hello {first_name},</p>

<p>We received a request to reset the password for your ACONT account.</p>

<p>Click the button below to create a new password:</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #4ade80, #22d3ee); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">RESET PASSWORD</a>
</p>

<p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>

<p>If you didn't request this, you can safely ignore this email.</p>

<p style="margin-top: 30px;">With digital greetings,</p>
""",
            "fr": """
<h2 style="margin: 0 0 20px 0; color: #222;">Réinitialisez votre mot de passe</h2>

<p>Bonjour {first_name},</p>

<p>Nous avons reçu une demande de réinitialisation du mot de passe de votre compte ACONT.</p>

<p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #4ade80, #22d3ee); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">RÉINITIALISER</a>
</p>

<p style="font-size: 14px; color: #666;">Ce lien expirera dans 1 heure.</p>

<p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet e-mail.</p>

<p style="margin-top: 30px;">Avec nos salutations numériques,</p>
""",
            "nl": """
<h2 style="margin: 0 0 20px 0; color: #222;">Reset je wachtwoord</h2>

<p>Hallo {first_name},</p>

<p>We hebben een verzoek ontvangen om het wachtwoord voor je ACONT-account te resetten.</p>

<p>Klik op de knop hieronder om een nieuw wachtwoord aan te maken:</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #4ade80, #22d3ee); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">WACHTWOORD RESETTEN</a>
</p>

<p style="font-size: 14px; color: #666;">Deze link verloopt over 1 uur.</p>

<p>Als je dit niet hebt aangevraagd, kun je deze e-mail veilig negeren.</p>

<p style="margin-top: 30px;">Met digitale groeten,</p>
""",
            "ro": """
<h2 style="margin: 0 0 20px 0; color: #222;">Resetează-ți parola</h2>

<p>Bună {first_name},</p>

<p>Am primit o cerere de resetare a parolei pentru contul tău ACONT.</p>

<p>Apasă butonul de mai jos pentru a crea o parolă nouă:</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #4ade80, #22d3ee); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">RESETARE PAROLĂ</a>
</p>

<p style="font-size: 14px; color: #666;">Acest link va expira în 1 oră.</p>

<p>Dacă nu ai solicitat acest lucru, poți ignora acest email.</p>

<p style="margin-top: 30px;">Cu salutări digitale,</p>
""",
        },
    },
    "invoice_sent": {
        "subject": {
            "en": "Invoice {invoice_no} from {company_name}",
            "fr": "Facture {invoice_no} de {company_name}",
            "nl": "Factuur {invoice_no} van {company_name}",
            "ro": "Factură {invoice_no} de la {company_name}",
        },
        "body": {
            "en": """
Dear {client_name},

Please find attached invoice {invoice_no} from {company_name}.

Invoice details:
- Invoice number: {invoice_no}
- Issue date: {issue_date}
- Due date: {due_date}
- Total amount: €{total_amount}

Payment reference: {payment_reference}

If you have any questions about this invoice, please contact us.

Best regards,
{company_name}
""",
            "fr": """
Cher/Chère {client_name},

Veuillez trouver ci-joint la facture {invoice_no} de {company_name}.

Détails de la facture :
- Numéro de facture : {invoice_no}
- Date d'émission : {issue_date}
- Date d'échéance : {due_date}
- Montant total : €{total_amount}

Référence de paiement : {payment_reference}

Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,
{company_name}
""",
            "nl": """
Beste {client_name},

Bijgevoegd vindt u factuur {invoice_no} van {company_name}.

Factuurgegevens:
- Factuurnummer: {invoice_no}
- Uitgiftedatum: {issue_date}
- Vervaldatum: {due_date}
- Totaalbedrag: €{total_amount}

Betalingsreferentie: {payment_reference}

Als u vragen heeft over deze factuur, neem dan contact met ons op.

Met vriendelijke groet,
{company_name}
""",
            "ro": """
Stimate {client_name},

Vă transmitem atașat factura {invoice_no} de la {company_name}.

Detalii factură:
- Număr factură: {invoice_no}
- Data emiterii: {issue_date}
- Data scadenței: {due_date}
- Total: €{total_amount}

Referință plată: {payment_reference}

Dacă aveți întrebări despre această factură, vă rugăm să ne contactați.

Cu respect,
{company_name}
""",
        },
    },
    "usage_warning": {
        "subject": {
            "en": "ACONT: You're approaching your invoice limit",
            "fr": "ACONT: Vous approchez de votre limite de factures",
            "nl": "ACONT: Je nadert je factuurlimiet",
            "ro": "ACONT: Te apropii de limita de facturi",
        },
        "body": {
            "en": """
Hello {first_name},

You have used {used} of your {limit} monthly invoices for {company_name}.

Your current plan: {plan_name}
Documents remaining: {remaining}

Additional documents will be charged at €{extra_price}/document.

Consider upgrading your plan for more documents and additional features:
{upgrade_url}

Best regards,
The ACONT Team
""",
            "fr": """
Bonjour {first_name},

Vous avez utilisé {used} de vos {limit} factures mensuelles pour {company_name}.

Votre plan actuel : {plan_name}
Documents restants : {remaining}

Les documents supplémentaires seront facturés à €{extra_price}/document.

Envisagez de passer à un plan supérieur pour plus de documents et de fonctionnalités :
{upgrade_url}

Cordialement,
L'équipe ACONT
""",
            "nl": """
Hallo {first_name},

Je hebt {used} van je {limit} maandelijkse facturen gebruikt voor {company_name}.

Je huidige plan: {plan_name}
Resterende documenten: {remaining}

Extra documenten worden in rekening gebracht tegen €{extra_price}/document.

Overweeg je plan te upgraden voor meer documenten en extra functies:
{upgrade_url}

Met vriendelijke groet,
Het ACONT Team
""",
            "ro": """
Bună {first_name},

Ai utilizat {used} din cele {limit} facturi lunare pentru {company_name}.

Planul tău actual: {plan_name}
Documente rămase: {remaining}

Documentele suplimentare vor fi taxate cu €{extra_price}/document.

Consideră upgrade-ul planului pentru mai multe documente și funcționalități:
{upgrade_url}

Cu respect,
Echipa ACONT
""",
        },
    },
    "payment_success": {
        "subject": {
            "en": "ACONT: Payment received - Thank you!",
            "fr": "ACONT: Paiement reçu - Merci !",
            "nl": "ACONT: Betaling ontvangen - Bedankt!",
            "ro": "ACONT: Plată primită - Mulțumim!",
        },
        "body": {
            "en": """
Hello {first_name},

We've received your payment for {company_name}.

Plan: {plan_name}
Amount: €{amount}
Next billing date: {next_billing_date}

Thank you for your continued trust in ACONT!

Best regards,
The ACONT Team
""",
            "fr": """
Bonjour {first_name},

Nous avons reçu votre paiement pour {company_name}.

Plan : {plan_name}
Montant : €{amount}
Prochaine date de facturation : {next_billing_date}

Merci pour votre confiance continue envers ACONT !

Cordialement,
L'équipe ACONT
""",
            "nl": """
Hallo {first_name},

We hebben je betaling ontvangen voor {company_name}.

Plan: {plan_name}
Bedrag: €{amount}
Volgende factuurdatum: {next_billing_date}

Bedankt voor je voortdurende vertrouwen in ACONT!

Met vriendelijke groet,
Het ACONT Team
""",
            "ro": """
Bună {first_name},

Am primit plata ta pentru {company_name}.

Plan: {plan_name}
Sumă: €{amount}
Următoarea dată de facturare: {next_billing_date}

Îți mulțumim pentru încrederea continuă în ACONT!

Cu respect,
Echipa ACONT
""",
        },
    },
}


def is_email_configured() -> bool:
    """Check if email is properly configured."""
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASS)


def send_email(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
    from_email: Optional[str] = None,
    attachments: Optional[List[tuple]] = None,  # List of (filename, content, mime_type)
) -> bool:
    """
    Send an email using SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body_text: Plain text body
        body_html: Optional HTML body
        from_email: Sender email (defaults to EMAIL_FROM)
        attachments: Optional list of (filename, content_bytes, mime_type)
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not is_email_configured():
        logger.warning(f"Email not configured. Would send to {to_email}: {subject}")
        # Log to console for development
        print(f"\n{'='*60}")
        print(f"EMAIL (not sent - SMTP not configured)")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body_text}")
        print(f"{'='*60}\n")
        return False
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email or settings.EMAIL_FROM
        msg["To"] = to_email
        
        # Add text body
        msg.attach(MIMEText(body_text, "plain", "utf-8"))
        
        # Add HTML body if provided
        if body_html:
            msg.attach(MIMEText(body_html, "html", "utf-8"))
        
        # Add attachments
        if attachments:
            for filename, content, mime_type in attachments:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(content)
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename={filename}",
                )
                msg.attach(part)
        
        # Send via SMTP
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(msg["From"], [to_email], msg.as_string())
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_template_email(
    to_email: str,
    template_name: str,
    language: str,
    context: dict,
    from_email: Optional[str] = None,
    attachments: Optional[List[tuple]] = None,
) -> bool:
    """
    Send an email using a predefined template.
    
    Args:
        to_email: Recipient email address
        template_name: Name of the template (e.g., "welcome", "invoice_sent")
        language: Language code (en, fr, nl, ro)
        context: Dictionary with template variables
        from_email: Optional sender email
        attachments: Optional attachments
    
    Returns:
        True if sent successfully
    """
    template = EMAIL_TEMPLATES.get(template_name)
    if not template:
        logger.error(f"Email template not found: {template_name}")
        return False
    
    # Normalize language
    lang = language.lower()[:2] if language else "en"
    if lang not in ["en", "fr", "nl", "ro"]:
        lang = "en"
    
    # Get subject and body for language
    subject = template["subject"].get(lang, template["subject"]["en"])
    body = template["body"].get(lang, template["body"]["en"])
    
    # Format with context
    try:
        subject = subject.format(**context)
        body = body.format(**context)
    except KeyError as e:
        logger.error(f"Missing template variable: {e}")
        return False
    
    return send_email(
        to_email=to_email,
        subject=subject,
        body_text=body,
        from_email=from_email,
        attachments=attachments,
    )


def send_welcome_email(
    to_email: str,
    first_name: str,
    company_name: str,
    language: str = "en",
) -> bool:
    """Send welcome email to new user."""
    dashboard_url = f"{settings.APP_BASE_URL}/dashboard"
    
    return send_template_email(
        to_email=to_email,
        template_name="welcome",
        language=language,
        context={
            "first_name": first_name,
            "company_name": company_name,
            "dashboard_url": dashboard_url,
        },
    )


def send_invoice_email(
    to_email: str,
    client_name: str,
    company_name: str,
    invoice_no: str,
    issue_date: str,
    due_date: str,
    total_amount: str,
    payment_reference: str,
    language: str = "en",
    from_email: Optional[str] = None,
    pdf_attachment: Optional[bytes] = None,
) -> bool:
    """Send invoice email with PDF attachment."""
    attachments = None
    if pdf_attachment:
        attachments = [(f"invoice_{invoice_no}.pdf", pdf_attachment, "application/pdf")]
    
    return send_template_email(
        to_email=to_email,
        template_name="invoice_sent",
        language=language,
        context={
            "client_name": client_name,
            "company_name": company_name,
            "invoice_no": invoice_no,
            "issue_date": issue_date,
            "due_date": due_date,
            "total_amount": total_amount,
            "payment_reference": payment_reference,
        },
        from_email=from_email,
        attachments=attachments,
    )


def send_usage_warning_email(
    to_email: str,
    first_name: str,
    company_name: str,
    plan_name: str,
    used: int,
    limit: int,
    remaining: int,
    extra_price: str,
    language: str = "en",
) -> bool:
    """Send usage warning email when approaching limit."""
    upgrade_url = f"{settings.APP_BASE_URL}/dashboard/subscription"
    
    return send_template_email(
        to_email=to_email,
        template_name="usage_warning",
        language=language,
        context={
            "first_name": first_name,
            "company_name": company_name,
            "plan_name": plan_name,
            "used": used,
            "limit": limit,
            "remaining": remaining,
            "extra_price": extra_price,
            "upgrade_url": upgrade_url,
        },
    )


def send_payment_success_email(
    to_email: str,
    first_name: str,
    company_name: str,
    plan_name: str,
    amount: str,
    next_billing_date: str,
    language: str = "en",
) -> bool:
    """Send payment confirmation email."""
    return send_template_email(
        to_email=to_email,
        template_name="payment_success",
        language=language,
        context={
            "first_name": first_name,
            "company_name": company_name,
            "plan_name": plan_name,
            "amount": amount,
            "next_billing_date": next_billing_date,
        },
    )


def send_forgot_password_email(
    to_email: str,
    first_name: str,
    reset_token: str,
    language: str = "en",
) -> bool:
    """Send password reset email."""
    reset_url = f"{settings.APP_BASE_URL}/{language}/auth/reset-password?token={reset_token}"
    
    return send_template_email(
        to_email=to_email,
        template_name="forgot_password",
        language=language,
        context={
            "first_name": first_name,
            "reset_url": reset_url,
        },
    )

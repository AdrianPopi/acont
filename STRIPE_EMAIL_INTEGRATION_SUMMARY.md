# ACONT - Rezumat Integrare Stripe & Email

## ✅ STATUS: IMPLEMENTAT COMPLET

---

## 1. STRIPE - Configurare Completă

### Cheile integrate în backend/.env:

```env
STRIPE_SECRET_KEY=sk_test_51...YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_51...YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX  # Se va completa după deploy

# Price IDs din Stripe Dashboard-ul clientului:
STRIPE_PRICE_STARTER_MONTHLY=price_1SqKSr1Mlh2ECpkVsRFhzQKF   # 15€/lună
STRIPE_PRICE_STARTER_YEARLY=price_1SqKTd1Mlh2ECpkVWhLOwUPv    # 150€/an
STRIPE_PRICE_PRO_MONTHLY=price_1SqKUs1Mlh2ECpkVZigbSQuR       # 30€/lună
STRIPE_PRICE_PRO_YEARLY=price_1SqKVH1Mlh2ECpkV8gru9k1P        # 320€/an
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1SqKVe1Mlh2ECpkVOLAzWp0h # 120€/lună
STRIPE_PRICE_ENTERPRISE_YEARLY=price_1SqKVu1Mlh2ECpkVsHBfpS9J  # 1400€/an
```

### Funcționalități implementate:

- ✅ Checkout session pentru abonamente noi
- ✅ Customer Portal pentru gestionare abonament
- ✅ Webhook handler pentru evenimente Stripe
- ✅ Trial period 30 zile pentru toate planurile

---

## 2. LIMITE DOCUMENTE & TAXARE SUPLIMENTARĂ

### Configurație per plan:

| Plan       | Limite/lună | Preț doc suplimentar |
| ---------- | ----------- | -------------------- |
| Starter    | 25          | €0.50                |
| Pro        | 500         | €0.25                |
| Enterprise | 1000        | €0.15                |

### Fișiere implementate:

- **backend/app/core/usage_tracking.py** - Logică tracking și verificare limite
- **backend/app/api/routes/invoices.py** - Endpoint `/usage-check` + tracking la emitere
- **backend/app/api/routes/credit_notes.py** - Tracking la emitere credit notes

### Comportament:

1. La 80% utilizare → Warning "approaching"
2. La 100% utilizare → Warning "at_limit"
3. Peste 100% → Warning "over_limit" + se afișează costul suplimentar
4. **Documentele NU sunt blocate** - doar se taxează în plus pe factura lunară

---

## 3. SISTEM EMAIL

### Configurare în backend/.env:

```env
SMTP_HOST=mail.acont.be
SMTP_PORT=587
SMTP_USER=no-reply@acont.be
SMTP_PASS=[parola]
EMAIL_FROM=no-reply@acont.be
```

### Fișiere implementate:

- **backend/app/core/email.py** - Serviciu complet cu template-uri multilingve

### Tipuri de email-uri:

| Template          | Când se trimite           | Limbi          |
| ----------------- | ------------------------- | -------------- |
| `welcome`         | La înregistrare           | EN, FR, NL, RO |
| `invoice_sent`    | Când se trimite factură   | EN, FR, NL, RO |
| `usage_warning`   | Când se apropie de limită | EN, FR, NL, RO |
| `payment_success` | După plată reușită        | EN, FR, NL, RO |

### Integrare în cod:

- ✅ **auth.py** - Email welcome la signup
- ✅ **invoices.py** - Email cu PDF la trimitere factură
- ✅ **subscriptions.py** - Email la plată reușită (webhook)

---

## 4. TRADUCERI ADĂUGATE

### Fișiere modificate:

- `frontend/src/messages/en.json`
- `frontend/src/messages/fr.json`
- `frontend/src/messages/nl.json`
- `frontend/src/messages/ro.json`

### Chei noi pentru usage warnings:

```json
"usage": {
  "warnings": {
    "approaching": "...",
    "atLimit": "...",
    "overLimit": "..."
  },
  "confirmExtra": "...",
  "upgradeHint": "..."
}
```

---

## 5. PAȘI RĂMAȘI PENTRU PRODUCȚIE

### 5.1 De la Bogdan (server email):

- [ ] Parola pentru `no-reply@acont.be`
- [ ] Confirmare că port 587 funcționează
- [ ] SPF/DKIM/DMARC configurate

### 5.2 De la client (Stripe):

- [ ] Webhook URL setat: `https://api.acont.be/api/subscriptions/webhook`
- [ ] Webhook Signing Secret (`whsec_...`)

### 5.3 Pentru deploy:

```env
# Production .env
ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/acont
API_BASE_URL=https://api.acont.be
APP_BASE_URL=https://acont.be
CORS_ORIGINS=https://acont.be,https://www.acont.be
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
```

---

## 6. STRUCTURA FIȘIERE MODIFICATE/CREATE

```
backend/
├── .env                          # ✅ Actualizat cu chei Stripe
├── app/
│   ├── core/
│   │   ├── config.py             # ✅ Adăugat SMTP settings
│   │   ├── email.py              # ✅ NOU - Serviciu email complet
│   │   └── usage_tracking.py     # ✅ NOU - Tracking documente
│   └── api/routes/
│       ├── auth.py               # ✅ Adăugat welcome email
│       ├── invoices.py           # ✅ Adăugat usage tracking + email
│       ├── credit_notes.py       # ✅ Adăugat usage tracking
│       └── subscriptions.py      # (existent, funcțional)

frontend/
└── src/messages/
    ├── en.json                   # ✅ Adăugat warnings
    ├── fr.json                   # ✅ Adăugat warnings
    ├── nl.json                   # ✅ Adăugat warnings
    └── ro.json                   # ✅ Adăugat warnings
```

---

## 7. API ENDPOINTS

### Subscriptions:

- `GET /api/subscriptions/current` - Abonament curent
- `GET /api/subscriptions/plans` - Toate planurile disponibile
- `GET /api/subscriptions/usage` - Statistici utilizare
- `POST /api/subscriptions/checkout` - Creare checkout session
- `POST /api/subscriptions/portal` - Creare portal session
- `POST /api/subscriptions/webhook` - Stripe webhook handler

### Invoices (nou):

- `GET /api/invoices/usage-check` - Verificare limită înainte de creare
- `POST /api/invoices/{id}/send-email` - Trimitere factură pe email

---

## 8. FLUX COMPLET

```
1. User se înregistrează → Email welcome
2. User creează factură:
   a. Frontend apelează GET /invoices/usage-check
   b. Dacă aproape de limită → afișează warning
   c. User confirmă → factura se creează
   d. Usage incrementat automat
3. User trimite factură → Email cu PDF atașat
4. La plată Stripe → Usage reset + Email confirmare
5. La depășire limită → Email warning
```

---

**Data implementării:** 17 ianuarie 2026
**Status:** Gata pentru deploy după primirea credențialelor email și webhook secret.

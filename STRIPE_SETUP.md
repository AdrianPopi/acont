# Configurarea Stripe pentru ACONT

## Pași pentru a configura Stripe

### 1. Creează un cont Stripe

- Accesează [stripe.com](https://stripe.com)
- Click "Start now" sau "Create account"
- Completează datele companiei

### 2. Obține cheile API (Test Mode)

După ce te-ai logat în Dashboard-ul Stripe:

1. Asigură-te că ești în **Test mode** (toggle în stânga sus)
2. Click pe **Developers** → **API keys**
3. Copiază:
   - **Publishable key** (pk*test*...)
   - **Secret key** (sk*test*...) - click "Reveal test key"

### 3. Creează Produsele și Prețurile în Stripe

#### În Dashboard Stripe:

1. Accesează **Products** → **Add product**

#### Produs: Starter

- **Name**: Starter
- Click **Add product**, apoi adaugă 2 prețuri:
  - **Price 1**: €15.00, Recurring → Monthly, ID: `price_starter_monthly`
  - **Price 2**: €150.00, Recurring → Yearly, ID: `price_starter_yearly`

#### Produs: Pro

- **Name**: Pro
- Adaugă 2 prețuri:
  - **Price 1**: €30.00, Recurring → Monthly, ID: `price_pro_monthly`
  - **Price 2**: €320.00, Recurring → Yearly, ID: `price_pro_yearly`

#### Produs: Enterprise

- **Name**: Enterprise
- Adaugă 2 prețuri:
  - **Price 1**: €120.00, Recurring → Monthly, ID: `price_enterprise_monthly`
  - **Price 2**: €1400.00, Recurring → Yearly, ID: `price_enterprise_yearly`

**Notă**: După ce creezi fiecare preț, Stripe îi va atribui .un ID unic (ex: `price_1abc123...`). Copiază aceste ID-uri.

### 4. Configurează Trial Period (1 lună gratuită)

Pentru fiecare preț creat:

1. Click pe preț → **Edit**
2. În secțiunea **Free trial**: setează **30 days**
3. Save

### 5. Setează Webhook-ul

1. În Dashboard Stripe: **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-domain.com/api/subscriptions/webhook`

   - Pentru testare locală, folosește [ngrok](https://ngrok.com):
     ```bash
     ngrok http 8000
     ```
     Apoi folosește URL-ul ngrok: `https://xxxxx.ngrok.io/api/subscriptions/webhook`

4. **Select events to listen to**:

   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click **Add endpoint**
6. Copiază **Signing secret** (whsec\_...)

### 6. Actualizează fișierul .env

Deschide `backend/.env` și actualizează cu valorile reale:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXX

# Price IDs (copiază din Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_1XXXXXXXXXXXXXXXX
STRIPE_PRICE_STARTER_YEARLY=price_1XXXXXXXXXXXXXXXX
STRIPE_PRICE_PRO_MONTHLY=price_1XXXXXXXXXXXXXXXX
STRIPE_PRICE_PRO_YEARLY=price_1XXXXXXXXXXXXXXXX
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1XXXXXXXXXXXXXXXX
STRIPE_PRICE_ENTERPRISE_YEARLY=price_1XXXXXXXXXXXXXXXX
```

### 7. Configurează Customer Portal

1. În Stripe Dashboard: **Settings** → **Billing** → **Customer portal**
2. Activează:
   - ✅ Update payment method
   - ✅ Update billing information
   - ✅ View invoice history
   - ✅ Cancel subscription
   - ✅ Switch plans
3. În **Products**: Selectează planurile (Starter, Pro, Enterprise)
4. **Save changes**

### 8. Testează integrarea

1. Pornește backend-ul:

   ```bash
   cd backend
   .\.venv\Scripts\activate
   python -m uvicorn main:app --reload --port 8000
   ```

2. Pornește frontend-ul:

   ```bash
   cd frontend
   npm run dev
   ```

3. Accesează pagina de subscriptions în dashboard
4. Folosește carduri de test Stripe:
   - **Success**: `4242 4242 4242 4242`
   - **Requires Auth**: `4000 0025 0000 3155`
   - **Declined**: `4000 0000 0000 9995`
   - **Expiry**: Orice dată viitoare
   - **CVC**: Orice 3 cifre
   - **ZIP**: Orice 5 cifre

### 9. Trecerea în Production

Când ești gata pentru producție:

1. Dezactivează Test mode în Stripe Dashboard
2. Creează produsele/prețurile din nou în Live mode
3. Actualizează `.env` cu cheile Live (sk*live*..., pk*live*...)
4. Actualizează webhook-ul pentru domeniul de producție
5. Verifică că totul funcționează cu un card real

---

## Structura prețurilor

| Plan       | Lunar | Anual | Facturi/lună | Extra/factură |
| ---------- | ----- | ----- | ------------ | ------------- |
| Starter    | €15   | €150  | 25           | €0.50         |
| Pro        | €30   | €320  | 500          | €0.25         |
| Enterprise | €120  | €1400 | 1000         | €0.15         |

**Trial**: 1 lună gratuită pentru toate planurile

---

## Troubleshooting

### Webhook nu funcționează

- Verifică că URL-ul este accesibil din internet
- Verifică signatura în Stripe Dashboard → Webhooks → Events
- Asigură-te că `STRIPE_WEBHOOK_SECRET` este corect

### Checkout nu se deschide

- Verifică că `STRIPE_SECRET_KEY` este corect
- Verifică că Price ID-urile există și sunt active
- Verifică consola browser pentru erori

### Portal nu funcționează

- Configurează Customer Portal în Stripe Dashboard
- Asigură-te că clientul are un `stripe_customer_id` valid

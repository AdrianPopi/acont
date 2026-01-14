# ✅ CHECKLIST PRODUCȚIE - ACONT Invoicing Platform

## 📋 SUMAR GENERAL

Acest document conține lista completă a tuturor pașilor necesari pentru lansarea în producție a platformei ACONT. Verifică fiecare element înainte de deployment.

---

## 🔐 1. SECURITATE & AUTENTIFICARE

### Backend Security

- [ ] **JWT Configuration**

  - ✅ Secret Key generat securizat (min 32 caractere)
  - ✅ Algoritm HS256 configurat
  - ✅ Issuer validation activat
  - ✅ Token expiry: 15 minute (access), 5 zile (refresh)
  - [ ] Verificat că JWT_SECRET este diferit în producție față de dezvoltare

- [ ] **Password Security**

  - ✅ Bcrypt hashing implementat
  - ✅ Salt rounds >= 12
  - [ ] Validare minim 8 caractere
  - [ ] Validare complexitate parolă (majusculă, număr, simbol special)

- [ ] **CORS Configuration**

  - ✅ CORS activat pentru frontend domain
  - [ ] CORS origin setat exact la domeniul producție (nu wildcard \*)
  - [ ] Credentials: true activat
  - [ ] Allowed methods: GET, POST, PUT, DELETE, OPTIONS

- [ ] **Cookie Security**
  - ✅ httpOnly=True
  - ✅ secure=True (HTTPS only în producție)
  - ✅ samesite='lax'
  - [ ] Domain setat corect pentru producție
  - [ ] Max age configurat (7 zile)

### Database Security

- [ ] **PostgreSQL**
  - [ ] User dedicat cu privilegii minime (nu postgres)
  - [ ] Password complex generat (min 16 caractere)
  - [ ] SSL connection obligatorie
  - [ ] Port schimbat de la default 5432
  - [ ] Firewall rules: acces doar de la backend

---

## 🌍 2. VARIABILE DE MEDIU

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require

# JWT
JWT_SECRET=<generat securizat - min 32 caractere>
JWT_ALGORITHM=HS256
JWT_ISSUER=acont-invoicing
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=5

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Server
HOST=0.0.0.0
PORT=8000
RELOAD=false
WORKERS=4

# Email (pentru notificări)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=<app password>
SMTP_FROM=noreply@yourdomain.com

# Storage (pentru logo-uri)
STORAGE_PATH=/app/static
STATIC_URL=https://cdn.yourdomain.com/static
```

### Frontend (.env.local)

```env
# API
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Internationalization
NEXT_PUBLIC_DEFAULT_LOCALE=ro
NEXT_PUBLIC_LOCALES=en,fr,nl,ro

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Checklist Variabile:**

- [ ] Toate variabilele setate în producție
- [ ] Nicio parolă hardcodată în cod
- [ ] .env.example creat fără valori sensibile
- [ ] .env adăugat în .gitignore
- [ ] Backup secret keys în password manager

---

## 🗄️ 3. BAZĂ DE DATE

### Migrații Alembic

- [ ] **Pre-deployment**

  - ✅ Toate migrațiile create și testate local
  - [ ] Verificat că toate migrațiile rulează fără erori
  - [ ] Backup complet bază de date înainte de deployment
  - [ ] Plan rollback pregătit pentru fiecare migrație

- [ ] **Migrații existente verificate:**
  - ✅ `5a0674d39f26` - Init tables (users, merchants, audit_logs)
  - ✅ `413a6c322a75` - Create clients table
  - ✅ `63d4430f5b7d` - Recreate clients and products tables
  - ✅ `48793fb4d4f6` - Add products table
  - ✅ `8bd125f848fd` - Add invoices
  - ✅ `586d5f6b1601` - Add credit notes
  - ✅ `4f073b4fdf14` - Add preferences tables (bank, tax_rates, templates)
  - ✅ `ac8f928d8c91` - Add legal documents
  - ✅ `10de051f9eac` - Add legal acceptances
  - ✅ `7d64a2fa3111` - Invoice client comm template
  - ✅ `993cd5b3df93` - Add merchant logo URL

### Indexuri necesare (verifica cu DBA)

- [ ] **Performance indexes:**

  ```sql
  -- Users
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_role ON users(role);

  -- Tokens
  CREATE INDEX idx_tokens_user_id ON tokens(user_id);
  CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);

  -- Invoices
  CREATE INDEX idx_invoices_merchant_id ON invoices(merchant_id);
  CREATE INDEX idx_invoices_client_id ON invoices(client_id);
  CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
  CREATE INDEX idx_invoices_status ON invoices(status);

  -- Credit Notes
  CREATE INDEX idx_credit_notes_merchant_id ON credit_notes(merchant_id);
  CREATE INDEX idx_credit_notes_invoice_id ON credit_notes(invoice_id);

  -- Clients
  CREATE INDEX idx_clients_merchant_id ON clients(merchant_id);
  CREATE INDEX idx_clients_tax_id ON clients(tax_id);

  -- Products
  CREATE INDEX idx_products_merchant_id ON products(merchant_id);

  -- Legal Acceptances
  CREATE INDEX idx_legal_acceptances_user_id ON legal_acceptances(user_id);
  CREATE INDEX idx_legal_acceptances_document_id ON legal_acceptances(legal_document_id);
  ```

### Backup Strategy

- [ ] **Automated backups configured:**
  - [ ] Daily full backup (retention: 30 days)
  - [ ] Hourly incremental backup (retention: 7 days)
  - [ ] Backup storage: off-site location
  - [ ] Restore procedure tested
  - [ ] RTO (Recovery Time Objective): < 1 oră
  - [ ] RPO (Recovery Point Objective): < 1 oră

### Seed Data

- [ ] **Platform Admin User**

  - [ ] Rulat script: `python scripts/seed_platform_admin.py`
  - [ ] Verificat login funcționează
  - [ ] Parolă temporară schimbată

- [ ] **Legal Documents**
  - [ ] Rulat script: `python app/scripts/seed_legal_docs.py`
  - [ ] Verificat în UI că apar ToS și Privacy Policy
  - [ ] Conținut legal reviewat de avocat

---

## 🔌 4. API ENDPOINTS - VERIFICARE FUNCȚIONALITATE

### Authentication (`/auth/*`)

- [ ] `POST /auth/register` - Înregistrare user nou
- [ ] `POST /auth/login` - Login cu email/password
- [ ] `POST /auth/refresh` - Refresh access token
- [ ] `POST /auth/logout` - Logout și invalidare token
- [ ] `GET /auth/me` - Get user info curent
- [ ] `PUT /auth/me/password` - Schimbare parolă
- [ ] `DELETE /auth/me` - Ștergere cont utilizator
- [ ] `GET /auth/me/data` - Export date personale (GDPR)

### Legal (`/legal/*`)

- [ ] `GET /legal/documents` - Lista documente legale (ToS, Privacy)
- [ ] `POST /legal/accept` - Acceptare documente legale
- [ ] `GET /legal/acceptances` - Istoric acceptări user

### Clients (`/clients/*`)

- [ ] `GET /clients` - Lista clienți merchant
- [ ] `POST /clients` - Creare client nou
- [ ] `GET /clients/{id}` - Detalii client
- [ ] `PUT /clients/{id}` - Editare client
- [ ] `DELETE /clients/{id}` - Ștergere client
- [ ] `POST /clients/import` - Import CSV clienți

### Products (`/products/*`)

- [ ] `GET /products` - Lista produse/servicii
- [ ] `POST /products` - Creare produs nou
- [ ] `GET /products/{id}` - Detalii produs
- [ ] `PUT /products/{id}` - Editare produs
- [ ] `DELETE /products/{id}` - Ștergere produs
- [ ] `POST /products/import` - Import CSV produse

### Invoices (`/invoices/*`)

- [ ] `GET /invoices` - Lista facturi cu paginare
- [ ] `POST /invoices` - Creare factură nouă
- [ ] `GET /invoices/{id}` - Detalii factură
- [ ] `PUT /invoices/{id}` - Editare factură
- [ ] `DELETE /invoices/{id}` - Anulare factură
- [ ] `GET /invoices/{id}/pdf` - Download PDF factură
- [ ] `POST /invoices/{id}/send` - Trimitere email factură
- [ ] `GET /invoices/stats` - Statistici facturi

### Credit Notes (`/credit-notes/*`)

- [ ] `GET /credit-notes` - Lista note de credit
- [ ] `POST /credit-notes` - Creare notă de credit
- [ ] `GET /credit-notes/{id}` - Detalii notă credit
- [ ] `GET /credit-notes/{id}/pdf` - Download PDF notă credit

### Preferences (`/preferences/*`)

- [ ] `GET /preferences/bank` - Detalii bancare merchant
- [ ] `PUT /preferences/bank` - Update detalii bancare
- [ ] `GET /preferences/tax-rates` - Lista cote TVA
- [ ] `POST /preferences/tax-rates` - Adăugare cotă TVA
- [ ] `DELETE /preferences/tax-rates/{id}` - Ștergere cotă TVA
- [ ] `GET /preferences/template` - Setări template factură
- [ ] `PUT /preferences/template` - Update template factură
- [ ] `GET /preferences/email-expenses` - Lista conturi email
- [ ] `POST /preferences/email-expenses` - Adăugare cont email
- [ ] `DELETE /preferences/email-expenses/{id}` - Ștergere cont email
- [ ] `GET /preferences/peppol` - Setări PEPPOL
- [ ] `PUT /preferences/peppol` - Update setări PEPPOL

### Merchant Settings (Admin only)

- [ ] `GET /merchants` - Lista merchants (platform admin)
- [ ] `POST /merchants` - Creare merchant nou
- [ ] `GET /merchants/{id}` - Detalii merchant
- [ ] `PUT /merchants/{id}` - Editare merchant
- [ ] `PUT /merchants/{id}/logo` - Upload logo merchant

---

## 🎨 5. FRONTEND - VERIFICARE PAGINI

### Public Pages

- [ ] **Landing Page** (`/`)

  - ✅ Hero section cu 3 stat cards traduse
  - ✅ Features section
  - ✅ CTA buttons funcționale
  - [ ] SEO meta tags complete
  - [ ] Open Graph tags pentru social sharing

- [ ] **Legal Pages**
  - [ ] `/legal/terms` - Terms of Service
  - [ ] `/legal/privacy` - Privacy Policy
  - [ ] Conținut legal actualizat

### Authentication Pages

- [ ] **Login** (`/[locale]/login`)

  - [ ] Formular funcțional
  - [ ] Erori afișate corect
  - [ ] Link către register
  - [ ] "Remember me" checkbox
  - [ ] "Forgot password" link (dacă implementat)

- [ ] **Register** (`/[locale]/register`)

  - [ ] Formular validare client-side
  - [ ] Verificare email duplicate
  - [ ] Accept ToS checkbox
  - [ ] Redirect după succes

- [ ] **Legal Accept** (`/[locale]/legal/accept`)
  - ✅ Token refresh retry implementat
  - ✅ Erori de datetime fixate
  - [ ] Verificat pe dispozitive mobile

### Dashboard Pages

- [ ] **Dashboard Overview** (`/[locale]/dashboard`)

  - [ ] Stats cards: total invoices, revenue, clients
  - [ ] Recent invoices list
  - [ ] Quick actions buttons

- [ ] **Clients** (`/[locale]/dashboard/merchant/clients`)

  - [ ] Lista clienți cu search/filter
  - [ ] Adăugare client nou
  - [ ] Editare client
  - [ ] Ștergere client cu confirmare
  - [ ] Import CSV

- [ ] **Products** (`/[locale]/dashboard/merchant/products`)

  - [ ] Lista produse cu search
  - [ ] CRUD operations funcționale
  - [ ] Import CSV
  - [ ] Export CSV

- [ ] **Invoices** (`/[locale]/dashboard/merchant/invoices`)

  - [ ] Lista facturi cu paginare
  - [ ] Filtre: status, date range, client
  - [ ] Creare factură nouă
  - [ ] Preview PDF
  - [ ] Download PDF
  - [ ] Send email
  - [ ] Stats dashboard

- [ ] **Credit Notes** (`/[locale]/dashboard/merchant/credit-notes`)

  - [ ] Lista note de credit
  - [ ] Creare notă nouă
  - [ ] Link către factură originală
  - [ ] Download PDF

- [ ] **Settings** (`/[locale]/dashboard/merchant/settings`)

  - ✅ Tax rates tab - CRUD funcțional
  - ✅ Email accounts tab - CRUD funcțional
  - ✅ PEPPOL tab - funcțional
  - [ ] Logo upload tab - testat
  - [ ] Template customization - testat
  - [ ] Archive/export tab - testat

- [ ] **Preferences** (`/[locale]/preferences`)
  - ✅ Bank details tab - API integration completă
  - ✅ Tax rates tab - CRUD operations
  - ✅ Password change tab - validare funcțională
  - ✅ Data download/delete tab - GDPR compliant
  - [ ] Template tab - (opțional, implementat parțial)

### Admin Pages (Platform Admin only)

- [ ] **Admin Dashboard** (`/[locale]/dashboard/admin`)
  - [ ] Lista merchants
  - [ ] User management
  - [ ] System stats

---

## 🌐 6. INTERNATIONALIZARE (i18n)

### Locale Support

- [x] **English (en)** - ✅ Complet
- [x] **French (fr)** - ✅ Complet
- [x] **Dutch (nl)** - ✅ Complet
- [x] **Romanian (ro)** - ✅ Complet

### Translation Keys Verificate

- ✅ `hero.stats.*` - Hero section stats
- ✅ `hero.badge` - Hero badge text
- [ ] Toate celelalte key-uri verificate că au traduceri în toate limbile
- [ ] Placeholder text pentru inputs tradus
- [ ] Mesaje de eroare traduse
- [ ] Toast notifications traduse
- [ ] Email templates traduse

### Language Switcher

- [ ] Language selector funcționează pe toate paginile
- [ ] Limba selectată se păstrează în session/cookie
- [ ] URL reflect limba curentă (`/en/`, `/fr/`, `/nl/`, `/ro/`)
- [ ] SEO: hreflang tags pentru fiecare limbă

---

## 📄 7. PDF GENERATION

### Invoice PDF

- [ ] **Layout & Design**

  - [ ] Logo merchant afișat corect
  - [ ] Detalii merchant (nume, adresă, CUI, IBAN)
  - [ ] Detalii client complet
  - [ ] Număr factură și serie
  - [ ] Data emiterii și scadență
  - [ ] Tabel items cu: descriere, cantitate, preț unitar, TVA, total
  - [ ] Subtotal, total TVA, total general
  - [ ] Footer cu informații legale

- [ ] **Fonts & Character Support**

  - [ ] Font suportă caractere speciale (ă, â, î, ș, ț)
  - [ ] Font suportă EUR, RON, $ symbols
  - [ ] PDF generated UTF-8 encoding

- [ ] **Performance**
  - [ ] Generare PDF < 2 secunde pentru factură standard
  - [ ] Cache-uire logo merchant
  - [ ] Compresie imagini în PDF

### Credit Note PDF

- [ ] Similar cu invoice PDF
- [ ] Referință clară către factura originală
- [ ] Watermark "CREDIT NOTE" / "NOTĂ DE CREDIT"

---

## 📧 8. EMAIL NOTIFICATIONS

### Templates Email

- [ ] **Welcome Email**

  - [ ] Subiect: "Welcome to ACONT"
  - [ ] Link către dashboard
  - [ ] Logo și branding

- [ ] **Invoice Email**

  - [ ] Subiect: "Invoice #XXX from [Merchant Name]"
  - [ ] Mesaj personalizat merchant
  - [ ] PDF attachment
  - [ ] Link vizualizare online
  - [ ] Detalii plată (IBAN, referință)

- [ ] **Password Reset** (dacă implementat)
  - [ ] Link cu token expiry (30 min)
  - [ ] Instrucțiuni clare

### SMTP Configuration

- [ ] Provider configurat (Gmail, SendGrid, AWS SES, etc.)
- [ ] SPF record adăugat în DNS
- [ ] DKIM configured
- [ ] DMARC policy setată
- [ ] From address verified
- [ ] Rate limits verificate (ex: Gmail = 500/day)

---

## 🚀 9. DEPLOYMENT

### Backend Deployment

- [ ] **Docker Container**

  - [ ] Dockerfile optimizat (multi-stage build)
  - [ ] Image size < 500MB
  - [ ] Non-root user în container
  - [ ] Health check endpoint: `GET /health`

- [ ] **Server Requirements**

  - [ ] Python 3.11+
  - [ ] RAM: min 2GB (recomandat 4GB)
  - [ ] CPU: min 2 cores
  - [ ] Storage: min 20GB (+ space pentru logs și backups)

- [ ] **Reverse Proxy (Nginx)**

  ```nginx
  server {
      listen 80;
      server_name api.yourdomain.com;
      return 301 https://$server_name$request_uri;
  }

  server {
      listen 443 ssl http2;
      server_name api.yourdomain.com;

      ssl_certificate /path/to/cert.pem;
      ssl_certificate_key /path/to/key.pem;

      location / {
          proxy_pass http://localhost:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }

      location /static/ {
          alias /var/www/acont/static/;
          expires 30d;
          add_header Cache-Control "public, immutable";
      }
  }
  ```

- [ ] **SSL/TLS Certificate**

  - [ ] Let's Encrypt certificate instalat
  - [ ] Auto-renewal configurat (certbot)
  - [ ] Verificat cu SSL Labs (grade A)
  - [ ] HSTS header activat

- [ ] **Logging**
  - [ ] Logs rotatie configurată (logrotate)
  - [ ] Log level: INFO în producție
  - [ ] Sensitive data NOT logged (passwords, tokens)
  - [ ] Centralized logging (optional: ELK stack, CloudWatch)

### Frontend Deployment

- [ ] **Build Production**

  ```bash
  npm run build
  ```

  - [ ] Build successful fără erori
  - [ ] Bundle size < 2MB (compressed)
  - [ ] Zero lint errors ✅
  - [ ] Zero TypeScript errors ✅

- [ ] **Deployment Method**

  - [ ] **Option 1: Vercel** (recomandat pentru Next.js)

    - [ ] Project linked la GitHub
    - [ ] Environment variables setate
    - [ ] Custom domain configurat
    - [ ] Auto-deploy pe push la main branch

  - [ ] **Option 2: Docker + Nginx**
    - [ ] Dockerfile pentru Next.js
    - [ ] Static files served by Nginx
    - [ ] Gzip compression activată
    - [ ] Brotli compression activată (optional)

- [ ] **CDN Configuration**

  - [ ] CloudFlare sau AWS CloudFront configurat
  - [ ] Cache rules pentru assets statice
  - [ ] Purge cache strategy

- [ ] **Performance Optimization**
  - [ ] Images optimized (WebP format)
  - [ ] Lazy loading pentru imagini
  - [ ] Code splitting activat
  - [ ] Prefetch pentru rute importante
  - [ ] Service Worker pentru offline (optional)

### DNS Configuration

- [ ] **Records configurate:**
  ```
  A     yourdomain.com          -> Server IP
  A     www.yourdomain.com      -> Server IP
  A     api.yourdomain.com      -> Backend Server IP
  CNAME cdn.yourdomain.com      -> CloudFlare/CloudFront
  TXT   yourdomain.com          -> SPF record pentru email
  TXT   _dmarc.yourdomain.com   -> DMARC policy
  ```

---

## 🔍 10. MONITORING & OBSERVABILITY

### Application Monitoring

- [ ] **Uptime Monitoring**

  - [ ] UptimeRobot sau Pingdom configurat
  - [ ] Check interval: 5 min
  - [ ] Alert channels: Email, SMS, Slack
  - [ ] Monitorizare endpoints:
    - [ ] https://yourdomain.com (frontend)
    - [ ] https://api.yourdomain.com/health (backend)

- [ ] **Error Tracking**

  - [ ] Sentry instalat și configurat (recomandat)
  - [ ] Error alerts pentru 5xx errors
  - [ ] Performance monitoring activat
  - [ ] Release tracking configurat

- [ ] **Logging**
  - [ ] Application logs
  - [ ] Access logs (Nginx)
  - [ ] Error logs
  - [ ] Audit logs (user actions)
  - [ ] Log retention: 30 days

### Performance Metrics

- [ ] **Backend Metrics**

  - [ ] Avg response time < 200ms
  - [ ] 95th percentile < 500ms
  - [ ] Error rate < 1%
  - [ ] Database query time < 50ms
  - [ ] CPU usage < 70%
  - [ ] Memory usage < 80%

- [ ] **Frontend Metrics**

  - [ ] First Contentful Paint (FCP) < 1.8s
  - [ ] Largest Contentful Paint (LCP) < 2.5s
  - [ ] Time to Interactive (TTI) < 3.8s
  - [ ] Cumulative Layout Shift (CLS) < 0.1
  - [ ] First Input Delay (FID) < 100ms

- [ ] **Database Monitoring**
  - [ ] Connection pool usage
  - [ ] Slow query log activat (queries > 1s)
  - [ ] Table sizes monitorizate
  - [ ] Index usage statistics

### Alerting Rules

- [ ] 5xx errors > 10 în 5 min → Critical alert
- [ ] Response time > 2s for 5 min → Warning alert
- [ ] Disk usage > 80% → Warning alert
- [ ] Disk usage > 90% → Critical alert
- [ ] CPU usage > 80% for 10 min → Warning alert
- [ ] Memory usage > 90% → Critical alert
- [ ] Database connections > 80% pool → Warning alert

---

## 🧪 11. TESTING

### Unit Tests

- [ ] **Backend Tests**

  - [ ] Authentication tests (login, register, refresh)
  - [ ] CRUD operations tests pentru toate modelele
  - [ ] Business logic tests (invoice calculations)
  - [ ] Coverage target: > 70%

- [ ] **Frontend Tests**
  - [ ] Component tests (React Testing Library)
  - [ ] Hook tests (useMe, custom hooks)
  - [ ] Utility functions tests
  - [ ] Coverage target: > 60%

### Integration Tests

- [ ] API endpoints tests (end-to-end)
- [ ] Database migrations tests
- [ ] Authentication flow tests
- [ ] Payment flow tests (dacă aplicabil)

### E2E Tests (Playwright/Cypress)

- [ ] **Critical User Journeys:**
  - [ ] User registration → Legal accept → Dashboard
  - [ ] Login → Create invoice → Download PDF
  - [ ] Add client → Create invoice with client
  - [ ] Add product → Create invoice with product
  - [ ] Create invoice → Create credit note
  - [ ] Change preferences → Verify saved

### Load Testing

- [ ] **K6 sau Artillery tests:**
  - [ ] Login endpoint: 100 req/s
  - [ ] Invoice list: 50 req/s
  - [ ] Invoice creation: 20 req/s
  - [ ] PDF generation: 10 req/s

### Security Testing

- [ ] **OWASP Top 10 verification:**
  - [ ] SQL Injection tests (folosind SQLAlchemy parametrizat)
  - [ ] XSS tests (React escaping automat)
  - [ ] CSRF protection (SameSite cookies)
  - [ ] Authentication bypass tests
  - [ ] Authorization tests (role-based access)
  - [ ] Sensitive data exposure checks

---

## 📚 12. DOCUMENTAȚIE

### API Documentation

- [ ] **OpenAPI/Swagger**
  - [ ] Swagger UI accesibil la `/docs`
  - [ ] Toate endpoints documentate
  - [ ] Request/response examples
  - [ ] Authentication documented
  - [ ] Error codes explained

### User Documentation

- [ ] **User Guides:**
  - [ ] How to create your first invoice
  - [ ] How to manage clients
  - [ ] How to customize invoice templates
  - [ ] How to export data (GDPR)
  - [ ] FAQ section

### Admin Documentation

- [ ] **Admin Guides:**
  - [ ] How to add new merchant
  - [ ] How to manage users
  - [ ] How to handle support tickets
  - [ ] Database backup/restore procedure

### Developer Documentation

- [ ] **README.md complete:**

  - [ ] Project description
  - [ ] Tech stack
  - [ ] Setup instructions
  - [ ] Environment variables
  - [ ] Running tests
  - [ ] Deployment guide

- [ ] **CONTRIBUTING.md**
  - [ ] Code style guide
  - [ ] Git workflow
  - [ ] Pull request process

---

## 🔐 13. COMPLIANCE & LEGAL

### GDPR Compliance

- [ ] **Data Privacy**
  - ✅ User data export endpoint (`GET /auth/me/data`)
  - ✅ User account deletion (`DELETE /auth/me`)
  - [ ] Privacy Policy actualizat
  - [ ] Cookie consent banner (dacă folosești analytics cookies)
  - [ ] Data retention policy definită
  - [ ] Data processing agreement (DPA) pregătit

### Romanian Legal Requirements (ANAF)

- [ ] **E-Factura Integration** (dacă aplicabil)

  - [ ] ANAF API integration pentru B2G invoices
  - [ ] XML format conform standard RO e-Factura
  - [ ] Digital signature pentru facturi

- [ ] **Invoice Legal Requirements:**
  - [ ] Număr factură secvențial
  - [ ] Serie factură
  - [ ] Data emiterii
  - [ ] CUI merchant și client
  - [ ] Cod IBAN pentru plăți
  - [ ] Mențiuni legale în footer

### PEPPOL Network (optional)

- [ ] PEPPOL Access Point configurat
- [ ] PEPPOL ID înregistrat
- [ ] SMP (Service Metadata Publisher) setup

---

## 🎯 14. LAUNCH DAY CHECKLIST

### Pre-Launch (24h înainte)

- [ ] Verificat toate items din acest checklist
- [ ] Database backup complet
- [ ] Rollback plan pregătit
- [ ] Team notificat despre launch
- [ ] Monitoring alerts verificate
- [ ] On-call schedule pregătit

### Launch (Ziua 0)

- [ ] Deploy backend în producție
- [ ] Rulat migrații database
- [ ] Rulat seed scripts (admin user, legal docs)
- [ ] Verificat health check endpoints
- [ ] Deploy frontend în producție
- [ ] Verificat toate paginile publice
- [ ] Test complete authentication flow
- [ ] Smoke tests pentru features critice

### Post-Launch (primele 24h)

- [ ] Monitorizat logs pentru erori
- [ ] Verificat metrici: response time, error rate
- [ ] Testat fluxuri critice: register, login, create invoice
- [ ] Verificat email delivery
- [ ] Verificat PDF generation
- [ ] Customer support pregătit pentru feedback

### Post-Launch (Prima săptămână)

- [ ] Daily review logs și metrici
- [ ] Colectat user feedback
- [ ] Prioritizat bug fixes
- [ ] Performance optimization (dacă necesar)
- [ ] Scalare infrastructură (dacă necesar)

---

## 📊 15. SUCCESS METRICS

### Technical KPIs

- [ ] Uptime target: 99.9% (8.76h downtime/an permis)
- [ ] Avg response time: < 200ms
- [ ] Error rate: < 0.1%
- [ ] PDF generation success rate: > 99.5%
- [ ] Email delivery rate: > 98%

### Business KPIs

- [ ] User registrations/day target: ****\_\_****
- [ ] Active merchants target: ****\_\_****
- [ ] Invoices generated/day target: ****\_\_****
- [ ] Revenue target (dacă aplicabil): ****\_\_****

---

## ✅ STATUS ACTUAL

### ✅ COMPLET

- [x] Backend JWT authentication cu datetime fix
- [x] Frontend legal acceptance flow cu token refresh
- [x] Hero section complet internationalizat (4 limbi)
- [x] Preferences page cu API integration completă
- [x] Dashboard settings page fără erori de lint
- [x] TypeScript strict mode fără erori

### ⚠️ PARȚIAL COMPLET

- [ ] Template customization în preferences (UI există, lipsește API integration)
- [ ] Email templates (lipsește implementare completă)
- [ ] PEPPOL integration (UI există, lipsește backend complet)

### ❌ DE IMPLEMENTAT

- [ ] E-Factura ANAF integration (România specific)
- [ ] Forgot password flow
- [ ] Two-factor authentication (2FA)
- [ ] Advanced reporting & analytics
- [ ] Recurring invoices
- [ ] Payment tracking
- [ ] Multi-currency support

---

## 📞 CONTACTE & RESURSE

### Support Contacts

- **Technical Lead:** ****\_\_****
- **DevOps:** ****\_\_****
- **Security:** ****\_\_****
- **Legal:** ****\_\_****

### External Services

- **Domain Registrar:** ****\_\_****
- **Hosting Provider:** ****\_\_****
- **Email Provider:** ****\_\_****
- **Monitoring Service:** ****\_\_****
- **Backup Service:** ****\_\_****

---

## 🔄 VERSIONING

**Document Version:** 1.0  
**Last Updated:** 2025-01-29  
**Next Review:** După deployment în producție

---

**✨ NOTĂ FINALĂ:**  
Acest document este un ghid viu. După fiecare deployment, actualizează statusul items și adaugă lecții învățate. Succes la lansare! 🚀

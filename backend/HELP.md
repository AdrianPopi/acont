# 🚀 ACONT Backend - Documentație Completă

## 📋 Cuprins

1. [Descriere Generală](#descriere-generală)
2. [Structură Backend](#structură-backend)
3. [Tehnologii Utilizate](#tehnologii-utilizate)
4. [Instalare și Setup](#instalare-și-setup)
5. [Configurare](#configurare)
6. [Baze de Date & Migrații](#baze-de-date--migrații)
7. [Modele de Date](#modele-de-date)
8. [Autentificare & Securitate](#autentificare--securitate)
9. [API Endpoints](#api-endpoints)
10. [Funcționalități Principale](#funcționalități-principale)
11. [Comenzi Utile](#comenzi-utile)
12. [Troubleshooting](#troubleshooting)

---

## 📝 Descriere Generală

ACONT Backend este o aplicație FastAPI pentru gestionarea:

- **Autentificare și Autorizare** (JWT-based)
- **Clienți și Contacte** (Companies, Business Partners)
- **Produse și Servicii**
- **Facturi și Numere de Secvență**
- **Note de Credit**
- **Documente Legale** (Terms of Service, Privacy Policy)
- **Acceptări Legale** (User Agreements)
- **Logo Merchant**

---

## 📂 Structură Backend

```
backend/
├── main.py                      # Entry point, configurare FastAPI
├── pyproject.toml               # Dependencies și metadata
├── alembic.ini                  # Configurare Alembic migrations
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (local)
├── pyrightconfig.json           # Configurare Pyright type checker
│
├── alembic/
│   ├── env.py                   # Configurare bază de date pentru migrații
│   ├── versions/                # Fișiere migrații (changeset-uri)
│   │   ├── 5a0674d39f26_init_tables.py
│   │   ├── 413a6c322a75_create_clients_table.py
│   │   ├── 48793fb4d4f6_add_products_table.py
│   │   ├── 8bd125f848fd_add_invoices.py
│   │   ├── 586d5f6b1601_add_credit_notes.py
│   │   ├── ac8f928d8c91_add_legal_documents.py
│   │   ├── 10de051f9eac_add_legal_acceptances.py
│   │   └── ...alte migrații
│   └── script.py.mako           # Template pentru migrații noi
│
├── app/
│   ├── __init__.py              # Package initialization
│   │
│   ├── api/
│   │   ├── router.py            # Configurare principale routes
│   │   └── routes/
│   │       ├── auth.py          # Autentificare (login, register, refresh)
│   │       ├── admin_legal_documents.py  # Gestiunea documente legale
│   │       ├── legal.py         # Endpoints publice documente legale
│   │       ├── clients.py       # CRUD Clienți
│   │       ├── products.py      # CRUD Produse
│   │       ├── invoices.py      # CRUD Facturi
│   │       ├── credit_notes.py  # CRUD Note de Credit
│   │       ├── merchant_logo.py # Upload/Download Logo Merchant
│   │       ├── deps.py          # Dependency injections (JWT verify, DB session)
│   │       └── __pycache__/
│   │
│   ├── core/
│   │   ├── config.py            # Settings, environment variables
│   │   ├── security.py          # JWT, password hashing, authorization
│   │   ├── countries.py         # Lista țări (enums)
│   │   ├── invoice.py           # Business logic facturi
│   │   ├── credit_note_pdf.py   # Generare PDF note credit
│   │   ├── invoice_pdf.py       # Generare PDF facturi
│   │   ├── legal.py             # Business logic documente legale
│   │   └── __pycache__/
│   │
│   ├── db/
│   │   ├── base.py              # Base class pentru ORM models
│   │   ├── session.py           # Database connection & sessionmaker
│   │   └── __pycache__/
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # Model User (auth)
│   │   ├── merchant.py          # Model Merchant (profil companie)
│   │   ├── link.py              # Model Link (relationships)
│   │   ├── token.py             # Model Token (refresh tokens)
│   │   ├── audit.py             # Model Audit (audit logs)
│   │   ├── client.py            # Model Client (clienți)
│   │   ├── product.py           # Model Product
│   │   ├── invoice.py           # Model Invoice
│   │   ├── invoice_item.py      # Model InvoiceItem (linii facturi)
│   │   ├── invoice_sequence.py  # Model InvoiceSequence (numerotare)
│   │   ├── credit_note.py       # Model CreditNote
│   │   ├── credit_note_item.py  # Model CreditNoteItem
│   │   ├── legal_document.py    # Model LegalDocument
│   │   ├── legal_acceptance.py  # Model LegalAcceptance
│   │   └── __pycache__/
│   │
│   ├── schemas/
│   │   ├── auth.py              # Pydantic schemas: login, token
│   │   ├── clients.py           # Schemas: ClientCreate, ClientUpdate
│   │   ├── products.py          # Schemas: ProductCreate, ProductUpdate
│   │   ├── invoices.py          # Schemas: InvoiceCreate, InvoiceResponse
│   │   ├── credit_notes.py      # Schemas: CreditNoteCreate, CreditNoteResponse
│   │   └── __pycache__/
│   │
│   └── scripts/
│       ├── seed_legal_docs.py   # Seed script: populate documente legale
│       └── __pycache__/
│
├── scripts/
│   └── seed_platform_admin.py   # Seed script: create platform admin user
│
├── static/
│   └── logos/                   # Folder pentru merchant logos
│       └── .gitkeep
│
└── __pycache__/
```

---

## 🛠️ Tehnologii Utilizate

| Tehnologie           | Versiune | Rol                             |
| -------------------- | -------- | ------------------------------- |
| **FastAPI**          | ≥0.115   | Web framework, REST API         |
| **Uvicorn**          | ≥0.30    | ASGI server                     |
| **SQLAlchemy**       | ≥2.0     | ORM (Object-Relational Mapping) |
| **PostgreSQL**       | -        | Database (psycopg2/psycopg)     |
| **Alembic**          | ≥1.13    | Database migrations             |
| **Pydantic**         | ≥2.0     | Data validation & serialization |
| **python-jose**      | ≥3.3     | JWT tokens                      |
| **passlib+bcrypt**   | -        | Password hashing                |
| **Pillow**           | ≥12.0    | Image processing (logos)        |
| **python-multipart** | -        | Form data parsing               |

---

## 📦 Instalare și Setup

### Prerequisite-uri

- Python 3.11 sau mai recent
- PostgreSQL 12+
- pip (Python package manager)
- Git

### Pași de Instalare

#### 1️⃣ Clone Repository

```bash
cd e:\ACONT
git clone <repository-url> backend
cd backend
```

#### 2️⃣ Creare Virtual Environment (Opțional dar Recomandat)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 3️⃣ Instalare Dependencies

```bash
pip install -r requirements.txt
# SAU din pyproject.toml
pip install -e .
```

#### 4️⃣ Configurare .env

Crează fișier `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/acont_db

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_ISSUER=http://localhost:8000

# Tokens
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=5

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Cookies
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=

# Legal Docs
LEGAL_TERMS_VERSION=2025-12-17
LEGAL_PRIVACY_VERSION=2025-12-17
```

#### 5️⃣ Creare PostgreSQL Database

```bash
# Conectare la PostgreSQL
psql -U postgres

# Creare database și user
CREATE DATABASE acont_db;
CREATE USER acont_user WITH PASSWORD 'your_password';
ALTER ROLE acont_user SET client_encoding TO 'utf8';
ALTER ROLE acont_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE acont_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE acont_db TO acont_user;
\q
```

#### 6️⃣ Rulare Migrații

```bash
# Upgrade la versiunea curentă
alembic upgrade head

# Sau: seed-ează data inițială
python scripts/seed_platform_admin.py
python app/scripts/seed_legal_docs.py
```

#### 7️⃣ Pornire Server

```bash
# Development mode (auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### 8️⃣ Verificare

- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health (dacă implementat)

---

## ⚙️ Configurare

### app/core/config.py

Fișierul central pentru toate settings-urile aplicației:

```python
class Settings(BaseModel):
    # CORS Origins
    CORS_ORIGINS: list[str]        # Allowed origins pentru CORS

    # Cookie Settings
    COOKIE_SECURE: bool             # https-only (production=True)
    COOKIE_SAMESITE: str            # "lax" | "strict" | "none"
    COOKIE_DOMAIN: str | None       # Domain pentru cookies

    # JWT
    JWT_ISSUER: str                 # Token issuer
    JWT_SECRET: str                 # Cheia secretă (CHANGE IN PRODUCTION!)

    # Token Expiration
    ACCESS_TOKEN_MINUTES: int       # Ex: 15 minutes
    REFRESH_TOKEN_DAYS: int         # Ex: 5 days

    # Legal Versions
    LEGAL_TERMS_VERSION: str        # Version string pentru Terms
    LEGAL_PRIVACY_VERSION: str      # Version string pentru Privacy

    # Database
    DATABASE_URL: str               # PostgreSQL connection string
```

### Environment Variables

```bash
# Obligatorii
DATABASE_URL                # postgresql://user:pass@localhost/db

# JWT & Security
JWT_SECRET                  # Minimum 32 caractere în production
JWT_ISSUER                  # Base URL (ex: https://api.acont.com)
ACCESS_TOKEN_MINUTES        # Default: 15
REFRESH_TOKEN_DAYS          # Default: 5

# CORS
CORS_ORIGINS               # Comma-separated (ex: http://localhost:3000,https://app.acont.com)

# Cookies
COOKIE_SECURE              # "true" pe HTTPS, "false" pe HTTP
COOKIE_SAMESITE            # "lax" | "strict"
COOKIE_DOMAIN              # Domain-ul fără protocol (ex: acont.com)

# Legal
LEGAL_TERMS_VERSION        # Versiune Terms (format: YYYY-MM-DD)
LEGAL_PRIVACY_VERSION      # Versiune Privacy
```

---

## 🗄️ Baze de Date & Migrații

### Alembic - Database Versioning

Alembic permite management-ul schimbărilor structurii bazei de date.

#### Comenzi Alembic

```bash
# Vedere versiuni aplicate
alembic current

# Upgrade la versiune din urmă
alembic upgrade head

# Upgrade la o versiune specifică
alembic upgrade 10de051f9eac

# Downgrade o versiune
alembic downgrade -1

# Downgrade la o versiune specifică
alembic downgrade 5a0674d39f26

# Vezi history
alembic history

# Creare nouă migrație (auto-detect schimbări în models)
alembic revision --autogenerate -m "describe_change"

# Creare migrație manuală (gol)
alembic revision -m "manual_change"
```

### Fișierele de Migrații Existente

| Fișier                                                 | Descriere                                          |
| ------------------------------------------------------ | -------------------------------------------------- |
| `5a0674d39f26_init_tables.py`                          | Tabelele inițiale (users, merchants, links, audit) |
| `bfb17306a90d_add_clients_table.py`                    | Creare tabel clients                               |
| `413a6c322a75_create_clients_table.py`                 | Update clienți (posibil duplicate/update)          |
| `63d4430f5b7d_recreate_clients_and_products_tables.py` | Recreare tabel-e (refactor)                        |
| `48793fb4d4f6_add_products_table.py`                   | Tabel produse                                      |
| `8bd125f848fd_add_invoices.py`                         | Tabel facturi și invoice_items                     |
| `7d64a2fa3111_invoice_client_comm_template.py`         | Field pentru communication template                |
| `586d5f6b1601_add_credit_notes.py`                     | Tabel note credit                                  |
| `ac8f928d8c91_add_legal_documents.py`                  | Tabel documente legale                             |
| `10de051f9eac_add_legal_acceptances.py`                | Tabel acceptări legale de utilizatori              |
| `3a6744c22bb0_add_merchant_logo_url.py`                | URL logo merchant                                  |
| `993cd5b3df93_add_merchant_logo_url.py`                | Update logo URL                                    |
| `9c558179f89e_add_merchant_logo_url.py`                | Alt update logo                                    |

### Creare Nouă Migrație

```bash
# 1. Modifică un Model în app/models/
# 2. Rulează auto-generate
alembic revision --autogenerate -m "descriptive_name"

# 3. Review fișierul generat în alembic/versions/
# 4. Aplică migrația
alembic upgrade head
```

---

## 📊 Modele de Date

### Tabela: User (Autentificare)

```python
# models/user.py
- id: UUID (PK)
- email: str (UNIQUE, NOT NULL)
- hashed_password: str
- first_name: str
- last_name: str
- is_active: bool (default: True)
- merchant_id: UUID (FK -> Merchant)
- created_at: datetime
- updated_at: datetime
```

### Tabela: Merchant (Profil Companie)

```python
# models/merchant.py
- id: UUID (PK)
- name: str (UNIQUE, NOT NULL)
- email: str
- phone: str
- website: str
- country: str
- tax_id: str
- logo_url: str (nullable, path să logo)
- created_at: datetime
- updated_at: datetime
```

### Tabela: Link (Relații)

```python
# models/link.py
- id: UUID (PK)
- entity_type: str (enum: "client", "product", etc.)
- entity_id: UUID
- display_name: str
- created_at: datetime
```

### Tabela: Token (Refresh Tokens)

```python
# models/token.py
- id: UUID (PK)
- user_id: UUID (FK -> User)
- token: str (UNIQUE, NOT NULL)
- expires_at: datetime
- is_revoked: bool (default: False)
- created_at: datetime
```

### Tabela: Audit (Audit Logs)

```python
# models/audit.py
- id: UUID (PK)
- entity_type: str
- entity_id: UUID
- action: str (enum: "create", "update", "delete")
- changes: dict (JSON)
- user_id: UUID (FK -> User, nullable)
- created_at: datetime
```

### Tabela: Client (Clienți/Contacte)

```python
# models/client.py
- id: UUID (PK)
- merchant_id: UUID (FK -> Merchant)
- name: str (NOT NULL)
- email: str
- phone: str
- address: str
- city: str
- zip_code: str
- country: str
- tax_id: str
- industry: str
- notes: str
- is_active: bool (default: True)
- created_at: datetime
- updated_at: datetime
```

### Tabela: Product (Produse)

```python
# models/product.py
- id: UUID (PK)
- merchant_id: UUID (FK -> Merchant)
- name: str (NOT NULL)
- description: str
- price: Decimal (with precision)
- currency: str (enum: "USD", "EUR", "RON", etc.)
- unit: str (enum: "piece", "hour", "kg", etc.)
- is_active: bool (default: True)
- created_at: datetime
- updated_at: datetime
```

### Tabela: Invoice (Facturi)

```python
# models/invoice.py
- id: UUID (PK)
- merchant_id: UUID (FK -> Merchant)
- client_id: UUID (FK -> Client)
- invoice_number: str (UNIQUE)
- issue_date: date
- due_date: date
- currency: str
- subtotal: Decimal
- tax: Decimal (VAT/TVA)
- total: Decimal
- status: str (enum: "draft", "sent", "paid", "overdue")
- notes: str
- payment_method: str
- created_at: datetime
- updated_at: datetime
```

### Tabela: InvoiceItem (Linii Facturi)

```python
# models/invoice_item.py
- id: UUID (PK)
- invoice_id: UUID (FK -> Invoice)
- product_id: UUID (FK -> Product, nullable)
- description: str
- quantity: Decimal
- unit_price: Decimal
- tax_rate: Decimal (0-100)
- line_total: Decimal
```

### Tabela: InvoiceSequence (Numerotare)

```python
# models/invoice_sequence.py
- id: UUID (PK)
- merchant_id: UUID (FK -> Merchant, UNIQUE)
- current_number: int (next invoice number)
- prefix: str (ex: "INV-")
- suffix: str
- format: str (ex: "YYYY/###")
```

### Tabela: CreditNote (Note de Credit)

```python
# models/credit_note.py
- id: UUID (PK)
- merchant_id: UUID (FK -> Merchant)
- invoice_id: UUID (FK -> Invoice, nullable)
- client_id: UUID (FK -> Client)
- credit_note_number: str (UNIQUE)
- issue_date: date
- reason: str
- subtotal: Decimal
- tax: Decimal
- total: Decimal
- status: str (enum: "draft", "sent", "applied")
- created_at: datetime
- updated_at: datetime
```

### Tabela: CreditNoteItem (Linii Note Credit)

```python
# models/credit_note_item.py
- id: UUID (PK)
- credit_note_id: UUID (FK -> CreditNote)
- description: str
- quantity: Decimal
- unit_price: Decimal
- tax_rate: Decimal
- line_total: Decimal
```

### Tabela: LegalDocument (Documente Legale)

```python
# models/legal_document.py
- id: UUID (PK)
- type: str (enum: "terms_of_service", "privacy_policy")
- version: str (UNIQUE together cu type)
- content: str (HTML content)
- language: str (enum: "en", "fr", "ro", "nl")
- is_active: bool (default: True)
- created_at: datetime
- updated_at: datetime
```

### Tabela: LegalAcceptance (Acceptări Documente)

```python
# models/legal_acceptance.py
- id: UUID (PK)
- user_id: UUID (FK -> User)
- legal_document_id: UUID (FK -> LegalDocument)
- accepted_at: datetime
- ip_address: str (nullable)
- user_agent: str (nullable)
```

---

## 🔐 Autentificare & Securitate

### JWT Authentication

Sistemul utilizează **JWT (JSON Web Tokens)** pentru autentificare.

#### Token Structure

```
Header:   { "alg": "HS256", "typ": "JWT" }
Payload:  { "sub": "user_id", "exp": timestamp, "iat": timestamp, "iss": issuer }
Signature: HMAC-SHA256
```

#### Tipuri de Tokeni

**1. Access Token**

- Durată: 15 minute (configurable)
- Utilizare: Autentificare request-uri API
- Header: `Authorization: Bearer <access_token>`

**2. Refresh Token**

- Durată: 5 zile (configurable)
- Utilizare: Obținere nou access token
- Stocare: HTTPOnly cookie (preferred) sau localStorage
- Endpoint: `POST /api/auth/refresh`

### Security Module (core/security.py)

```python
# Hash password
hashed = hash_password(plain_password)

# Verify password
is_valid = verify_password(plain_password, hashed)

# Create JWT token
token = create_access_token(data={"sub": user_id}, expires_minutes=15)
refresh_token = create_refresh_token(data={"sub": user_id})

# Verify JWT token
payload = verify_token(token)  # Returns decoded payload or raises exception
```

### Dependencies (routes/deps.py)

```python
# Current User - verifică JWT și returnează user object
async def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> User:
    # Decode JWT
    # Query user din DB
    # Returnează user

# Current Active User - verifică dacă user este activ
async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    # Verify user.is_active
    # Return user
```

### Protected Routes

```python
from fastapi import Depends
from app.api.routes.deps import get_current_user

@router.get("/protected")
async def protected_endpoint(current_user: User = Depends(get_current_user)):
    # Doar utilizatori autentificați
    return {"user": current_user.email}
```

### Password Policy

- **Hashing**: bcrypt (cu salt)
- **Storage**: Niciodată plain-text
- **Reset**: Prin email token (opțional, depinde implementare)

---

## 🔌 API Endpoints

### Help & Documentation Routes (`/api/help`)

#### Get Full API Help

```
GET /api/help
(No authentication required)

Response:
{
  "title": "ACONT API - Help Documentation",
  "version": "0.1.0",
  "description": "Complete REST API for ACONT invoicing system",
  "categories": [
    {
      "name": "Authentication",
      "description": "User registration, login, token management",
      "endpoints": [...]
    },
    ...
  ]
}
```

#### Get Help for Specific Category

```
GET /api/help/category/{category_name}
(No authentication required)

Path Parameters:
- category_name: "authentication", "clients", "products", "invoices", "credit_notes", "legal_documents", "merchant_logo"

Response:
{
  "name": "Clients",
  "description": "Manage customers/clients",
  "endpoints": [...]
}
```

#### List All Endpoints

```
GET /api/help/endpoints
(No authentication required)

Response:
{
  "total": 45,
  "endpoints": [
    {
      "category": "Authentication",
      "method": "POST",
      "path": "/api/auth/register",
      "description": "Register new user",
      "auth_required": false,
      ...
    },
    ...
  ]
}
```

#### Search Endpoints

```
GET /api/help/search?q={keyword}
(No authentication required)

Query Parameters:
- q: Search keyword (searches in path, method, description)

Example:
GET /api/help/search?q=invoice

Response:
{
  "query": "invoice",
  "total": 6,
  "results": [
    {
      "category": "Invoices",
      "method": "GET",
      "path": "/api/invoices",
      "description": "List all invoices",
      ...
    },
    ...
  ]
}
```

### Authentication Routes (`/api/auth`)

#### 1. Register

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123",
  "first_name": "John",
  "last_name": "Doe"
}

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "merchant_id": "uuid"
}
```

#### 2. Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123"
}

Response:
{
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "token_type": "bearer"
}
```

#### 3. Refresh Token

```
POST /api/auth/refresh
Authorization: Bearer <refresh_token>

Response:
{
  "access_token": "new_jwt_token",
  "token_type": "bearer"
}
```

#### 4. Logout

```
POST /api/auth/logout
Authorization: Bearer <access_token>

Response: { "message": "Logged out successfully" }
```

### Clients Routes (`/api/clients`)

#### List Clients

```
GET /api/clients
Authorization: Bearer <access_token>

Query params:
?skip=0&limit=10&search=name

Response:
[
  {
    "id": "uuid",
    "name": "Client Name",
    "email": "client@example.com",
    "phone": "+40...",
    "country": "RO",
    "tax_id": "...",
    ...
  }
]
```

#### Create Client

```
POST /api/clients
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "New Client",
  "email": "new@example.com",
  "phone": "+40...",
  "address": "...",
  "city": "Bucharest",
  "zip_code": "010101",
  "country": "RO",
  "tax_id": "..."
}

Response: 201 Created
{ "id": "uuid", "name": "New Client", ... }
```

#### Get Client

```
GET /api/clients/{client_id}
Authorization: Bearer <access_token>

Response:
{ "id": "uuid", "name": "Client", ... }
```

#### Update Client

```
PUT /api/clients/{client_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "...",
  ...
}

Response:
{ "id": "uuid", "name": "Updated Name", ... }
```

#### Delete Client

```
DELETE /api/clients/{client_id}
Authorization: Bearer <access_token>

Response: 204 No Content
```

### Products Routes (`/api/products`)

#### List Products

```
GET /api/products
Authorization: Bearer <access_token>

Query params:
?skip=0&limit=10&is_active=true

Response: [ { "id": "uuid", "name": "Product", "price": 99.99, ... } ]
```

#### Create Product

```
POST /api/products
Authorization: Bearer <access_token>

{
  "name": "Product Name",
  "description": "...",
  "price": 99.99,
  "currency": "USD",
  "unit": "piece"
}

Response: 201 Created
```

#### Update Product

```
PUT /api/products/{product_id}
Authorization: Bearer <access_token>

Response: { "id": "uuid", ... }
```

#### Delete Product

```
DELETE /api/products/{product_id}
Authorization: Bearer <access_token>

Response: 204 No Content
```

### Invoices Routes (`/api/invoices`)

#### List Invoices

```
GET /api/invoices
Authorization: Bearer <access_token>

Query params:
?skip=0&limit=10&status=draft&client_id=uuid

Response: [ { "id": "uuid", "invoice_number": "INV-001", ... } ]
```

#### Create Invoice

```
POST /api/invoices
Authorization: Bearer <access_token>

{
  "client_id": "uuid",
  "issue_date": "2026-01-06",
  "due_date": "2026-02-06",
  "currency": "USD",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 50.00,
      "tax_rate": 19
    }
  ],
  "notes": "..."
}

Response: 201 Created
```

#### Get Invoice

```
GET /api/invoices/{invoice_id}
Authorization: Bearer <access_token>

Response: { "id": "uuid", "invoice_number": "INV-001", ... }
```

#### Update Invoice

```
PUT /api/invoices/{invoice_id}
Authorization: Bearer <access_token>

Response: { "id": "uuid", ... }
```

#### Delete Invoice

```
DELETE /api/invoices/{invoice_id}
Authorization: Bearer <access_token>

Response: 204 No Content
```

#### Download Invoice PDF

```
GET /api/invoices/{invoice_id}/pdf
Authorization: Bearer <access_token>

Response: application/pdf (file download)
```

### Credit Notes Routes (`/api/credit_notes`)

#### List Credit Notes

```
GET /api/credit_notes
Authorization: Bearer <access_token>

Response: [ { "id": "uuid", "credit_note_number": "CN-001", ... } ]
```

#### Create Credit Note

```
POST /api/credit_notes
Authorization: Bearer <access_token>

{
  "invoice_id": "uuid",
  "client_id": "uuid",
  "reason": "Product return",
  "items": [
    {
      "description": "Item description",
      "quantity": 1,
      "unit_price": 50.00,
      "tax_rate": 19
    }
  ]
}

Response: 201 Created
```

#### Download Credit Note PDF

```
GET /api/credit_notes/{credit_note_id}/pdf
Authorization: Bearer <access_token>

Response: application/pdf
```

### Legal Documents Routes

#### Public: Get Latest Terms

```
GET /api/legal/terms
(No authentication required)

Response:
{
  "id": "uuid",
  "type": "terms_of_service",
  "version": "2025-12-17",
  "content": "<html>...</html>",
  "language": "en"
}
```

#### Public: Get Latest Privacy Policy

```
GET /api/legal/privacy
(No authentication required)

Response: { "type": "privacy_policy", ... }
```

#### Admin: Create/Update Legal Document

```
POST /api/admin/legal-documents
Authorization: Bearer <access_token>

{
  "type": "terms_of_service",
  "version": "2025-12-18",
  "content": "<html>...</html>",
  "language": "en"
}

Response: 201 Created
```

#### Accept Legal Document (User)

```
POST /api/legal/accept
Authorization: Bearer <access_token>

{
  "legal_document_id": "uuid"
}

Response: { "id": "uuid", "accepted_at": "2026-01-06T10:00:00Z" }
```

### Merchant Logo Routes (`/api/merchant/logo`)

#### Upload Logo

```
POST /api/merchant/logo
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <image_file> (JPEG, PNG)

Response:
{
  "filename": "logo.png",
  "url": "/static/logos/merchant_id/logo.png"
}
```

#### Download Logo

```
GET /api/merchant/logo
(No authentication)

Response: image/png or image/jpeg
```

---

## 💼 Funcționalități Principale

### 1. Gestiune Clienți

- **CRUD**: Create, Read, Update, Delete clienți
- **Search**: Căutare după nume, email, țară
- **Validare**: Email unic, format validation
- **Soft Delete**: Marchare ca inactiv (nu ștergere reală)

### 2. Gestiune Produse

- **Catalog**: Lista de produse disponibile
- **Prețuri**: Cu suport pentru mai multe valute
- **Categorii**: Industrie/categorie (opțional)
- **Activ/Inactiv**: Flag pentru activitate

### 3. Gestiune Facturi

- **Numerotare Automată**: Prin InvoiceSequence
- **Calcul Automat**: Subtotal, tax, total
- **PDF**: Generare PDF professional
- **Status Tracking**: draft → sent → paid → overdue
- **Linii Facturi**: Cu detalii produs, cantitate, preț

### 4. Gestiune Note de Credit

- **Referință Factură**: Link la factura originală
- **Calcule Automate**: Subtotal, tax, total
- **PDF**: Generare PDF
- **Motiv**: Motivul creditului (retur, discount, etc.)

### 5. Autentificare & Autorizare

- **JWT**: Token-based authentication
- **Access Token**: 15 minute (configurable)
- **Refresh Token**: 5 zile (configurable)
- **HTTPOnly Cookies**: Pentru stocare sigură (frontend)
- **Role-based**: (opțional, depinde implementare)

### 6. Documente Legale

- **Terms of Service**: Versionate
- **Privacy Policy**: Versionate
- **Multi-language**: EN, FR, RO, NL
- **User Acceptance**: Track acceptări de utilizatori
- **HTML Content**: Rich text support

### 7. Audit Logging

- **Entity Changes**: Urmărire modificări entități
- **User Tracking**: Cine a făcut schimbarea
- **Timestamps**: Când s-a întâmplat
- **Change Details**: Ce exact s-a modificat

### 8. Merchant Profile

- **Company Info**: Nume, email, telefon, website
- **Tax ID**: Identifier fiscal
- **Logo**: Upload și stocare
- **Multiple Users**: Sub același merchant

---

## 📌 Comenzi Utile

### Development

```bash
# Start dev server cu auto-reload
uvicorn main:app --reload

# Start cu custom port
uvicorn main:app --reload --port 8001

# Start cu debug logging
uvicorn main:app --reload --log-level debug
```

### Database

```bash
# Upgrade migrations
alembic upgrade head

# See current version
alembic current

# Rollback o versiune
alembic downgrade -1

# Create auto-migration
alembic revision --autogenerate -m "description"

# Verify connection
python -c "from app.db.session import engine; print(engine)"
```

### Data Seeding

```bash
# Create admin user
python scripts/seed_platform_admin.py

# Seed legal documents
python app/scripts/seed_legal_docs.py
```

### Testing

```bash
# Run tests (dacă existente)
pytest

# Run cu coverage
pytest --cov=app

# Run specific test
pytest tests/test_auth.py::test_login
```

### Code Quality

```bash
# Format code (dacă black instalat)
black app/

# Check types (Pyright)
pyright

# Lint (dacă instalat)
flake8 app/
```

---

## 🔍 Troubleshooting

### ❌ Error: "DATABASE_URL is missing"

**Cauză**: Environment variable `DATABASE_URL` nu e setat

**Soluție**:

1. Creează/editează `backend/.env`
2. Adaugă: `DATABASE_URL=postgresql://user:pass@localhost:5432/acont_db`
3. Salvează și restartează server

```bash
# Verifica variabila
echo %DATABASE_URL%  # Windows
echo $DATABASE_URL   # macOS/Linux
```

---

### ❌ Error: "psycopg2.OperationalError: could not connect"

**Cauze Posibile**:

1. PostgreSQL nu rulează
2. Connection string greșit
3. Credențiale incorecte
4. Firewall blochează conexiunea

**Soluții**:

```bash
# Verifică dacă PostgreSQL rulează
# Windows
tasklist | findstr postgres

# Testează conexiune
psql -U acont_user -h localhost -d acont_db -c "SELECT 1"

# Verifică DATABASE_URL
# Format: postgresql://user:password@host:port/dbname
```

---

### ❌ Error: "No module named 'app'"

**Cauză**: PYTHONPATH nu include directorul backend

**Soluție**:

```bash
# Verify you're in backend directory
cd e:\ACONT\backend

# Run from there
uvicorn main:app --reload
```

---

### ❌ Error: "JWT_SECRET is not set properly"

**Cauză**: `JWT_SECRET` default este "change-me"

**Soluție**:

```bash
# Generate secure key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Copy output to .env
JWT_SECRET=your_generated_secret_here
```

---

### ❌ Error: "Port 8000 already in use"

**Soluție**:

```bash
# Use different port
uvicorn main:app --reload --port 8001

# Or kill existing process
# Windows
taskkill /PID <pid> /F

# macOS/Linux
kill -9 <pid>
```

---

### ❌ Migration fails

**Cauza**: Migrația nu se aplică corect

**Soluție**:

```bash
# Check current state
alembic current

# Check history
alembic history

# Downgrade and re-apply
alembic downgrade -1
alembic upgrade head

# Manual check
psql -U acont_user -d acont_db -c "\dt"  # List tables
```

---

### ❌ CORS errors

**Simptom**: "Access to XMLHttpRequest blocked by CORS policy"

**Soluție**:

```bash
# backend/.env
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Verify settings
python -c "from app.core.config import settings; print(settings.CORS_ORIGINS)"
```

---

### ✅ Common Success Checks

```bash
# Check server is running
curl http://localhost:8000/docs

# Check auth endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Check database connection
python -c "from app.db.session import SessionLocal; db = SessionLocal(); print('Connected!')"
```

---

## 📚 Documente Suplimentare

- **FastAPI**: https://fastapi.tiangolo.com
- **SQLAlchemy**: https://docs.sqlalchemy.org
- **Alembic**: https://alembic.sqlalchemy.org
- **Pydantic**: https://docs.pydantic.dev
- **PostgreSQL**: https://www.postgresql.org/docs

---

## 👥 Support & Contact

Pentru probleme sau întrebări:

1. Verifică sectiunea Troubleshooting
2. Consultă documentația relevantă
3. Contactează team-ul development

---

**Last Updated**: January 6, 2026
**Version**: 0.1.0

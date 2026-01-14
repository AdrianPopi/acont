# INTEGRARE PEPPOL - ACONT Platform

## Ghid Rapid pentru Utilizatori

---

## 📋 CE ESTE PEPPOL?

**PEPPOL** = Pan-European Public Procurement OnLine

- Rețea europeană pentru **facturi electronice B2B**
- **Obligatoriu din 2026** în Belgia pentru facturare B2B
- Fiecare companie primește un **ID PEPPOL unic** de la furnizorul său

---

### ACONT **NU** generează ID-uri PEPPOL

**ID-ul PEPPOL** este emis de:

- **Access Point Provider** (furnizorul tău PEPPOL)
- **Autoritatea de certificare** din țara ta
- **Operatorul de rețea** cu care ai contract

### ACONT doar **STOCHEAZĂ** ID-ul tău PEPPOL pentru trimitere facturi

---

## 🔍 DE UNDE IEI ID-UL PEPPOL?

### Fiecare companie TREBUIE să obțină ID-ul de la furnizorul său

**Pași pentru a obține ID PEPPOL:**

1. **Alege un Access Point Provider certificat**

   **Provideri certificați pentru Belgia:**

   - **Basware** - https://www.basware.com/en-be/products/e-invoicing/
   - **Tradeshift** - https://tradeshift.com/
   - **Pagero** - https://www.pagero.com/
   - **Storecove** - https://www.storecove.com/
   - **IBM Sterling** - https://www.ibm.com/products/b2b-integrator
   - **Unifiedpost** - https://www.unifiedpost.com/be-nl/
   - **Zoomit** - https://www.zoomit.com/en/

   **⚠️ Important**: Verifică lista actualizată pe https://peppol.eu/who-is-who/peppol-certified-aps/

2. **Înregistrează-te la provider și creează cont**

   **Ce trebuie să pregătești:**

   - ✅ Număr TVA valid (BE0123456789)
   - ✅ Date companie (nume legal, adresă sediu social)
   - ✅ Persoană de contact (email, telefon)
   - ✅ Documente legale (certificat TVA, extras KBO/BCE)

   **Procesul de înregistrare:**

   - Completezi formularul online pe site-ul providerului
   - Upload documente de identificare (KYC)
   - Semnezi contractul de servicii (digital sau fizic)
   - Plătești taxa de setup + abonament lunar/anual

3. **Primești ID-ul în format standard**

   **După validarea documentelor (1-5 zile lucrătoare):**

   - Provider activează contul tău în rețeaua PEPPOL
   - Primești email cu **ID-ul PEPPOL unic**
   - Format: `0208:BE0123456789`
     - `0208` = Prefix pentru Belgia (ISO 6523)
     - `BE0123456789` = Numărul tău de TVA
   - ID-ul este înregistrat în **SMP (Service Metadata Publisher)**

4. **Verifici ID-ul primit**
   - Trebuie să fie unic în rețeaua PEPPOL (garantat de provider)
   - Verificat și activat de Access Point Provider
   - Asociat cu datele companiei tale (nume, TVA, adresă)
   - Vizibil în directorul PEPPOL pentru alte companii

### 💰 Costuri estimate (2026)

- **Setup fee**: €0 - €500 (variază per provider)
- **Abonament lunar**: €15 - €100/lună
- **Cost per factură**: €0.05 - €0.50 (depinde de volum)
- **Pachete pentru IMM-uri**: €300 - €1200/an (all-inclusive)

**💡 Sfat**: Compară prețurile mai multor provideri și negociază pentru volume mari!

---

## 🚀 CUM FUNCȚIONEAZĂ INTEGRAREA ÎN ACONT?

### Pas 1: Obține ID-ul PEPPOL (din AFARA platformei)

```
Compania ta → Access Point Provider → Primești ID PEPPOL
```

### Pas 2: Introduce ID-ul în ACONT

```
ACONT Settings → Tab "Integrare PEPPOL" → Introdu ID-ul primit
```

### Pas 3: ACONT salvează și validează ID-ul

```
Backend verifică formatul → Salvează în baza de date → Status: Active
```

### Pas 4: Folosești ID-ul pentru facturi

```
Creezi factură → ACONT trimite prin PEPPOL → Client primește în sistemul său
```

---

## 📊 STATUS-URI INTEGRARE

### 🔵 Not Started (Nu a început)

- **Ce înseamnă**: ID-ul PEPPOL nu a fost introdus încă
- **Ce trebuie să faci**: Obține ID-ul de la Access Point Provider și introdu-l în ACONT

### 🟡 Pending (În așteptare)

- **Ce înseamnă**: ID-ul a fost introdus, se verifică conexiunea
- **Ce trebuie să faci**: Așteaptă validarea (câteva minute)

### 🟢 Active (Activ)

- **Ce înseamnă**: ✅ Totul funcționează! Poți trimite facturi prin PEPPOL
- **Ce trebuie să faci**: Folosește platforma normal, facturile se trimit automat

### 🔴 Failed (Eșuat)

- **Ce înseamnă**: ID-ul introdus este invalid sau există o problemă tehnică
- **Ce trebuie să faci**:
  - Verifică formatul ID-ului (0208:BE...)
  - Contactează Access Point Provider să confirme ID-ul
  - Contactează suportul ACONT dacă problema persistă

---

## 🔐 FORMAT ID PEPPOL

### Structură standard pentru Belgia:

```
0208:BE0123456789
│    │└──────────── Număr TVA (10 cifre)
│    └───────────── Prefix țară (BE = Belgia)
└────────────────── Prefix PEPPOL pentru Belgia
```

### Exemple valide:

- ✅ `0208:BE0123456789`
- ✅ `0208:BE0987654321`
- ✅ `0208:BE1234567890`

### Exemple INVALIDE:

- ❌ `BE0123456789` (lipsește prefixul 0208)
- ❌ `0208:0123456789` (lipsește BE)
- ❌ `0208BE0123456789` (lipsește : după prefix)
- ❌ `BE0123456789:0208` (ordine inversă)

---

## 💻 CUM INTRODUCI ID-UL ÎN ACONT?

### În interfața web:

1. **Login** în contul tău ACONT
2. **Mergi la**: Dashboard → **Settings** (Setări)
3. **Click pe tab-ul**: **"Integrare PEPPOL"**
4. **Vezi explicațiile**: info box violet cu pașii
5. **Introdu ID-ul**: în câmpul "Identificator PEPPOL"
   - Exemple: `0208:BE0123456789`
6. **Click**: **"Salvează ID-ul PEPPOL"**
7. **Așteaptă**: Status să devină "Activ" (🟢)

### UI-ul arată:

```
┌─────────────────────────────────────────┐
│ ℹ️ Ce este PEPPOL?                      │
│ Rețeaua europeană pentru facturi B2B   │
│ • Obține ID de la Access Point Provider│
│ • Introdu ID-ul aici (0208:BE...)      │
│ • După activare, trimiți facturi       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Status Integrare: 🟢 Activ              │
│ ID curent: 0208:BE0123456789            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Identificator PEPPOL *                  │
│ [0208:BE0123456789               ]     │
│ Format: 0208:BE + numărul tău TVA       │
└─────────────────────────────────────────┘

[Salvează ID-ul PEPPOL]
```

---

## 🔄 FLUX COMPLET DE LUCRU

### 1. Pregătire (AFARA platformei ACONT)

```mermaid
Compania ta
    ↓
Contactează Access Point Provider
    ↓
Semnează contract + plătește serviciul
    ↓
Provider creează cont PEPPOL
    ↓
Provider îți trimite ID-ul PEPPOL unic
    ↓
Primești confirmare: 0208:BE0123456789
```

### 2. Configurare (ÎN platforma ACONT)

```mermaid
Login ACONT
    ↓
Settings → Tab PEPPOL
    ↓
Introdu ID-ul primit de la provider
    ↓
Click "Salvează ID-ul PEPPOL"
    ↓
Backend validează formatul
    ↓
Status: 🟢 Active
```

### 3. Utilizare (Automat)

```mermaid
Creezi factură în ACONT
    ↓
Selectezi client (cu sau fără PEPPOL)
    ↓
Click "Emite factură"
    ↓
ACONT verifică dacă clientul are PEPPOL
    ↓
DA: Trimite prin PEPPOL (automat)
NU: Trimite prin email (PDF)
    ↓
Client primește factura în sistemul său
```

---

## 📡 CE SE ÎNTÂMPLĂ ÎN BACKEND?

### Când salvezi ID-ul PEPPOL:

```python
# 1. Primește request de la frontend
POST /preferences/peppol
Body: { "peppol_id": "0208:BE0123456789" }

# 2. Verifică formatul
if not matches("^\d{4}:[A-Z]{2}\d{10}$", peppol_id):
    return ERROR: "Format invalid"

# 3. Salvează în baza de date
PeppolIntegration.update({
    "peppol_id": "0208:BE0123456789",
    "integration_status": "active",
    "is_integrated": True,
    "integration_date": datetime.now()
})

# 4. Returnează success
return { "status": "active", "peppol_id": "..." }
```

### Când trimiți o factură:

```python
# 1. Creezi factura în ACONT
invoice = Invoice.create(...)

# 2. Backend verifică PEPPOL
if merchant.peppol_integration.is_integrated:
    # Merchant ARE ID PEPPOL configurat

    if client.peppol_id:
        # Client ARE ID PEPPOL
        send_via_peppol_network(invoice)
        # Trimite XML structurat prin PEPPOL
    else:
        # Client NU ARE PEPPOL
        send_via_email_pdf(invoice)
        # Trimite PDF clasic prin email

# 3. Marchează factura ca "issued"
invoice.status = "issued"
invoice.save()
```

---

## ❓ ÎNTREBĂRI FRECVENTE (FAQ)

### Q1: ACONT poate să-mi creeze ID PEPPOL?

**R: NU.** ACONT NU creează ID-uri PEPPOL. Trebuie să obții ID-ul de la un **Access Point Provider autorizat**.

### Q2: Unde găsesc un Access Point Provider?

**R:** Lista oficială: https://peppol.org/who-is-who/peppol-certified-aps/
Furnizori populari:

- Basware
- Tradeshift
- Pagero
- IBM Sterling
- Sovos

### Q3: Cât costă ID-ul PEPPOL?

**R:** Costul variază în funcție de provider. În general:

- Taxa de setup: €50-200 (o singură dată)
- Abonament lunar: €20-100/lună
- Cost per factură: €0.10-0.50/factură

### Q4: Pot schimba ID-ul PEPPOL după ce l-am introdus?

**R: DA.** Poți actualiza ID-ul oricând din Settings → Tab PEPPOL. Pur și simplu suprascrie ID-ul vechi cu cel nou.

### Q5: Ce se întâmplă dacă introduc un ID invalid?

**R:** Backend-ul validează formatul. Dacă nu respectă structura `0208:BE0123456789`, primești eroare. Status rămâne "Not Started" până introduci un ID valid.

### Q6: Clientul meu trebuie să aibă și el ID PEPPOL?

**R:** Depinde:

- **DA**: Dacă vrei să trimiți facturi prin PEPPOL → clientul TREBUIE să aibă ID PEPPOL
- **NU**: Dacă clientul nu are PEPPOL → ACONT trimite PDF clasic prin email

### Q7: Pot trimite facturi PEPPOL dacă clientul nu are ID?

**R: NU.** PEPPOL funcționează doar între două părți care au ID-uri PEPPOL. Dacă clientul nu are, factura se trimite prin email (PDF).

### Q8: ID-ul PEPPOL e același cu numărul de TVA?

**R: NU.** ID-ul PEPPOL CONȚINE numărul de TVA, dar are prefix:

- Număr TVA: `BE0123456789`
- ID PEPPOL: `0208:BE0123456789` (cu prefix)

### Q9: Pot avea mai multe ID-uri PEPPOL?

**R: NU.** În ACONT, fiecare merchant (companie) are UN SINGUR ID PEPPOL configurat. Dacă ai mai multe companii, creează conturi separate.

### Q10: Ce se întâmplă după ce salvez ID-ul?

**R:**

1. Status devine "Activ" (🟢)
2. ID-ul e salvat în baza de date
3. Când creezi facturi, ACONT verifică automat dacă clientul are PEPPOL
4. Dacă DA → trimite prin PEPPOL (XML structurat)
5. Dacă NU → trimite prin email (PDF clasic)

---

## 🛠️ SUPORT TEHNIC

### Probleme cu ID-ul PEPPOL?

**Verifică mai întâi:**

1. ✅ Format corect: `0208:BE0123456789`
2. ✅ Prefix: `0208` pentru Belgia
3. ✅ Cod țară: `BE`
4. ✅ Număr TVA: 10 cifre
5. ✅ Separator: `:` (două puncte)

**Dacă problema persistă:**

- 📧 Email: support@acont.be
- 📞 Telefon: +32 XXX XXX XXX
- 💬 Chat live: acont.be/chat

**Pentru probleme cu Access Point:**

- Contactează direct furnizorul tău PEPPOL
- Nu ACONT, ci providerul care ți-a emis ID-ul

---

## 📚 RESURSE UTILE

### Documentație oficială:

- **PEPPOL Official**: https://peppol.org
- **Access Points List**: https://peppol.org/who-is-who/peppol-certified-aps/
- **EN 16931 Standard**: https://ec.europa.eu/cefdigital/wiki/display/CEFDIGITAL/EN+16931
- **OpenPEPPOL**: https://docs.peppol.eu/

### Pentru Belgia:

- **FPS Finance**: https://finances.belgium.be
- **Legislație 2026**: https://www.ejustice.just.fgov.be
- **Digipolis (eBox)**: https://www.digipolis.be/
- **FedICT**: https://dt.bosa.be/

### Provideri Access Point certificați:

- **Basware Belgium**: contact-be@basware.com
- **Unifiedpost Group**: https://www.unifiedpost.com/be-nl/contact
- **Storecove**: support@storecove.com
- **Zoomit**: https://www.zoomit.com/en/contact/

### Video tutoriale:

- **Ce este PEPPOL?**: https://www.youtube.com/watch?v=peppol-intro
- **Cum obțin ID PEPPOL?**: Contactează direct providerul ales
- **Integrare în ACONT**: Vezi documentul curent

---

## 🔧 PENTRU DEZVOLTATORI - API INTEGRATION

### Endpoint-uri ACONT pentru PEPPOL

#### 1. Salvare ID PEPPOL (Client)

```http
POST /clients/{client_id}
Content-Type: application/json

{
  "peppol_id": "0208:BE0123456789",
  "name": "Client SRL",
  "tax_id": "BE0123456789",
  "email": "contact@client.be"
}
```

#### 2. Verificare status transmisie

```http
GET /invoices/{invoice_id}
```

**Response:**

```json
{
  "id": 123,
  "invoice_no": "INV-2026-00001",
  "client_peppol_id": "0208:BE0123456789",
  "transmission_method": "peppol",
  "sent_via_peppol": true,
  "peppol_sent_at": "2026-01-10T10:30:00Z",
  "status": "issued"
}
```

#### 3. Generare factură cu transmisie PEPPOL

```http
POST /invoices/
Content-Type: application/json

{
  "client_id": 456,
  "issue_date": "2026-01-10",
  "items": [...],
  "template_style": "modern"
}
```

**Logica automată:**

- Dacă `client.peppol_id` există → `transmission_method = "peppol"`
- Dacă `client.peppol_id` este NULL → `transmission_method = "email"`
- Backend setează automat `sent_via_peppol = true` după trimitere

### Format UBL 2.1 (PEPPOL BIS Billing 3.0)

**ACONT generează automat XML în format standard:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>INV-2026-00001</cbc:ID>
  <cbc:IssueDate>2026-01-10</cbc:IssueDate>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="0208">BE0987654321</cbc:EndpointID>
      ...
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID schemeID="0208">BE0123456789</cbc:EndpointID>
      ...
    </cac:Party>
  </cac:AccountingCustomerParty>
  ...
</Invoice>
```

### Testing în development

**Sandbox PEPPOL:**

- OpenPEPPOL Test Network: https://peppol.helger.com/
- Test Access Point: Contactează providerul pentru credentials
- Validare UBL: https://ecosio.com/en/peppol/peppol-and-xml-document-validator/

---

## ✅ CHECKLIST RAPID

Urmărește acești pași pentru integrare PEPPOL:

- [ ] 1. **Alege un Access Point Provider** (Basware, Tradeshift, etc.)
- [ ] 2. **Semnează contract** cu providerul ales
- [ ] 3. **Primești ID-ul PEPPOL** (ex: 0208:BE0123456789)
- [ ] 4. **Login în ACONT**
- [ ] 5. **Mergi la Settings → Tab PEPPOL**
- [ ] 6. **Introdu ID-ul primit**
- [ ] 7. **Click "Salvează ID-ul PEPPOL"**
- [ ] 8. **Verifică status: 🟢 Activ**
- [ ] 9. **Testează**: Creează o factură test
- [ ] 10. **Gata!** Poți trimite facturi prin PEPPOL

---

## 📝 CONCLUZIE

### Rezumat:

✅ **ACONT NU creează ID-uri PEPPOL**  
✅ **Tu obții ID-ul de la Access Point Provider**  
✅ **ACONT doar STOCHEAZĂ și FOLOSEȘTE ID-ul tău**  
✅ **Integrarea este SIMPLĂ**: Login → Settings → Tab PEPPOL → Introdu ID → Save  
✅ **După activare**: Facturile se trimit automat prin PEPPOL (dacă clientul are ID)

### Flux complet în 3 propoziții:

1. **Obții ID PEPPOL** de la un Access Point Provider (AFARA ACONT)
2. **Introduci ID-ul** în ACONT Settings → Tab PEPPOL
3. **ACONT folosește** ID-ul tău să trimită facturi prin rețeaua PEPPOL

---

**Document creat**: 2026-01-08  
**Versiune**: 1.0  
**Platformă**: ACONT.BE  
**Status**: ✅ Production Ready

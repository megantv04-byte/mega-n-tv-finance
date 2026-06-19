# Excel Import Guide - X-Flow

## Overview

X-Flow now supports importing invoices, payments, customers, and expenses from Excel files. The system intelligently handles complex invoices that span multiple rows (multi-item invoices) by automatically merging them into a single invoice record.

## Features

### ✅ Multi-Row Invoice Support
**Key Feature**: Invoices with multiple items can be entered on separate rows and will be automatically merged into a single invoice.

#### How It Works:
- **First row** of an invoice: Must have Customer name and Date (required fields)
- **Continuation rows**: Leave Customer and Date empty, but include the additional product/item information
- **Automatic Merge**: System detects continuation rows and merges them with the invoice above

#### Example:

| Data | Numri i fatures | Klienti | Data per pagese | Shuma | Produkti | Sasia | Çmimi | ... |
|------|---|---|---|---|---|---|---|---|
| 2026-01-15 | INV-001 | Ardit Krasniqi | 2026-01-20 | 150 | 12 muaj abonim | 1 | 100 | ... |
| (empty) | (empty) | (empty) | (empty) | (empty) | Setup fee | 1 | 50 | ... |
| 2026-01-16 | INV-002 | Blerim Hyseni | 2026-01-25 | 200 | 6 muaj abonim | 1 | 200 | ... |

**Result:**
- **Invoice 1** (INV-001, Ardit Krasniqi): 2 items
  - 12 muaj abonim: EUR 100
  - Setup fee: EUR 50
  - Total: EUR 150

- **Invoice 2** (INV-002, Blerim Hyseni): 1 item
  - 6 muaj abonim: EUR 200
  - Total: EUR 200

---

## Supported Entities

### 1. **Invoices** (Fatura)
Import product/service invoices with support for multiple items per invoice.

#### Required Columns:
- **Klienti** (Customer) *
- **Data** (Date) *
- **Shuma** (Amount) *

#### Optional Columns:
- **Numri i fatures** (Invoice Number)
- **Data per pagese** (Due Date)
- **Produkti** (Product)
- **Pershkrimi i produktit** (Description)
- **Sasia** (Quantity)
- **Çmimi** (Price)
- **Skadimi abonimit** (Subscription Expiry)
- **Data njoftimit** (Notification Date)
- **Statusi** (Status: paid, pending, overdue, draft)

#### Multi-Row Invoice Rules:
1. First row must contain: Customer + Date + Amount
2. Subsequent rows for same invoice: Leave Customer/Date empty, add product/item info
3. Next non-empty Customer = start of new invoice
4. All items are merged into single invoice's items array

### 2. **Payments** (Pagesa)
Import payment records linked to invoices.

#### Required Columns:
- **Numri i Faturës** (Invoice Number) *
- **Shuma** (Amount) *

#### Optional Columns:
- **Data** (Date)
- **Klienti** (Customer)
- **Fee** (Commission/Fee)
- **Metoda** (Payment Method)
- **Llogaria** (Account)
- **Depozituar tek** (Deposited To)
- **Referenca** (Reference/Transaction ID)
- **Shënime** (Notes)

### 3. **Customers** (Klientë)
Import customer/client information.

#### Required Columns:
- **Emri** (First Name) or similar
- **Mbiemri** (Last Name) or similar

#### Optional Columns:
- **Telefoni** (Phone)
- **Email**
- **Shteti** (Country)
- **App** (Application)
- **MAC Address**
- **Referuar nga** (Referred By)

### 4. **Expenses** (Shpenzime)
Import expense records.

#### Required Columns:
- **Data** (Date) *
- **Shuma** (Amount) *

#### Optional Columns:
- **Kategoria** (Category)
- **Lloji** (Type)
- **Furnitori** (Vendor)
- **Paguaj nga** (Paid From)
- **Referenca** (Reference)
- **Paguar nga** (Paid By)

---

## Column Name Aliases

The system is flexible with column names. It recognizes multiple variations in Albanian and English:

### Invoice Columns:
- **Customer**: klienti, customer, emri, emër
- **Date**: data, date, data faturës
- **Amount**: shuma, amount, total, vlera
- **Due Date**: skadenca, due, due date, data skadencës
- **Product**: produkti, shërbimi, item, përshkrimi
- **Quantity**: sasia, qty, quantity, sasi
- **Price**: çmimi, price, cmimi
- **Subscription Expiry**: skadimi abonimit, subscription expiry, skadim
- **Notify Date**: data njoftimit, notify date, njoftim

---

## How to Use

### Step 1: Download Template
1. Go to **Invoices** (or any module supporting Excel import)
2. Click **"Import Excel"** button
3. Click **"Download Template"** to get the Excel template
4. The template includes proper headers and example data

### Step 2: Fill In Your Data
1. Open the downloaded template
2. Delete the example row
3. Add your invoice/payment/customer data
4. For multi-item invoices: Use multiple rows with first row containing customer+date
5. Save the file

### Step 3: Import Into X-Flow
1. Click **"Import Excel"** button again
2. Click the upload area or drag & drop your file
3. Review the preview showing detected records
4. Click **"Importo..."** to import

### Step 4: Verify
- Data appears in the respective module (Invoices, Payments, etc.)
- Multi-item invoices show correctly merged with all items
- Status, dates, and amounts are properly formatted

---

## Date Format Support

The system automatically recognizes dates in these formats:
- **ISO Format**: 2026-01-15 (YYYY-MM-DD) ✅
- **European Format**: 15/01/2026 (DD/MM/YYYY) ✅
- **European Dot**: 15.01.2026 (DD.MM.YYYY) ✅
- **Excel Serial**: Automatic conversion from Excel date numbers ✅

---

## Status Normalization

When importing invoices, status values are automatically normalized:
- `paid`, `paguar`, `i paguar` → **paid**
- `pending`, `në pritje` → **pending**
- `overdue`, `vonuar`, `i vonuar` → **overdue**
- `draft`, `skicë`, `skice` → **draft**
- `void`, `anuluar` → **void**

---

## Payment Method Normalization

Payment methods are intelligently normalized:
- `PayPal` → **PayPal**
- `Stripe` → **Stripe**
- `bank`, `transfer`, `bankar` → **Transfer Bankar**
- `western` → **Western Union**
- `moneygram` → **Money Gram**
- `ria` → **Ria**
- `crypto`, `bitcoin` → **Crypto**
- `cash`, `kesh`, `online` → **Kesh** (Default)

---

## Deposited To Normalization

For payments, the "Deposited To" field recognizes:
- `xxx`, `XXX` → **XXX**
- `bledi`, `endy`, `Bledi` → **Bledi** (Default)
- Any other value: kept as-is

---

## Technical Details

### File Compatibility
- **.xlsx** (Excel 2007+) ✅
- **.xls** (Excel 97-2003) ✅
- **.csv** (Comma-separated values) ✅

### Import Limits
- Max rows per import: Unlimited
- Header row detection: Automatic
- Empty row filtering: Automatic (empty rows ignored)

### Multi-Row Invoice Merging Algorithm
```
FOR EACH row in spreadsheet:
  IF (row has Customer AND row has Date):
    - Start new invoice
    - Add first item from row
  ELSE IF (previous invoice exists AND row has Product):
    - Add item to previous invoice
  END IF
END FOR

RESULT: All items merged under single invoice record
```

---

## Examples

### Example 1: Single-Item Invoice
| Data | Klienti | Data per pagese | Shuma | Produkti | Sasia | Çmimi |
|---|---|---|---|---|---|---|
| 2026-01-15 | Ardit Krasniqi | 2026-01-20 | 100 | 12 muaj abonim | 1 | 100 |

**Result**: 1 invoice with 1 item

---

### Example 2: Multi-Item Invoice
| Data | Klienti | Data per pagese | Shuma | Produkti | Sasia | Çmimi |
|---|---|---|---|---|---|---|
| 2026-01-15 | Ardit Krasniqi | 2026-01-20 | 150 | 12 muaj abonim | 1 | 100 |
| | | | | Setup fee | 1 | 50 |

**Result**: 1 invoice with 2 items (total EUR 150)

---

### Example 3: Multiple Invoices
| Data | Klienti | Data per pagese | Shuma | Produkti | Sasia | Çmimi |
|---|---|---|---|---|---|---|
| 2026-01-15 | Ardit Krasniqi | 2026-01-20 | 100 | 12 muaj abonim | 1 | 100 |
| 2026-01-16 | Blerim Hyseni | 2026-01-25 | 200 | 6 muaj abonim | 1 | 200 |

**Result**: 2 invoices (1 item each)

---

## Troubleshooting

### "Nuk u gjet asnjë rresht i vlefshëm" (No valid rows found)
- **Cause**: All data rows are empty or malformed
- **Solution**: Check that your data starts from row 2 (row 1 = headers)

### Invoice number missing
- **Info**: Invoice numbers are auto-generated if not provided
- **Format**: INV-XXXXXX (auto-generated from timestamp)

### Amounts not importing
- **Cause**: Amount field has wrong format
- **Solution**: Ensure amounts are numbers (not text like "€100")

### Multi-item invoice not merging
- **Cause**: Customer or Date fields not empty in continuation row
- **Solution**: Leave Customer and Date **completely empty** in continuation rows

---

## Supported Languages

The system recognizes column headers in:
- **Albanian** (Shqip): Primary language
- **English**: Full support for bilingual imports
- **Mixed**: Can auto-detect column purpose across languages

---

## Data Safety

- ✅ All imports create NEW records (no overwrites)
- ✅ Invalid rows are skipped (not deleted)
- ✅ Data validation on amount, date, customer fields
- ✅ Automatic status normalization
- ✅ All data syncs to Supabase in real-time

---

## Recent Enhancements (2026-05-26)

### Version 2.0 - Multi-Row Invoice Support
- ✅ Added `mergeInvoiceRows()` function
- ✅ Automatic grouping of related invoice rows
- ✅ Support for multiple items per single invoice
- ✅ Proper items array construction
- ✅ Continuation row detection

**Changelog:**
- Before: 1 product row = 1 separate invoice
- After: Multiple product rows for same customer/date = 1 invoice with multiple items

---

## Quick Checklist for Excel Import

- [ ] Downloaded template from X-Flow
- [ ] Added your invoice/payment data
- [ ] For multi-item invoices: First row has customer+date, other rows left empty for customer+date
- [ ] Checked date format (any common format works)
- [ ] Removed all empty rows
- [ ] Verified all required fields are filled
- [ ] File saved as .xlsx, .xls, or .csv
- [ ] File size < 100MB (no limit enforced, but practical limit)
- [ ] Ready to import!

---

**Questions?** The import modal shows helpful hints and you can always download the template to see the correct format.

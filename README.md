# Rodded-Impeller-Inspection

# WEIR SOP Digital Entry Form

A web‑based digital form for capturing **Template Visual Work Instruction (SOP)** data used in manufacturing and inspection workflows.  
This application is a modern, user‑friendly front end that replicates **all fields from the original SOP document**, while improving usability, readability, and future system integration.

---

## 🎯 Purpose

The purpose of this application is to:

- Digitize paper‑based SOP inspection sheets
- Ensure **no fields or measurements are missed**
- Improve consistency and accuracy of data entry
- Enable future integration with **ASP.NET backend** and **Excel‑based record storage**
- Support audit, QA, and traceability requirements

---

## 🧱 Current Scope (Frontend)

✅ Implemented using:
- **HTML**
- **CSS**
- **Vanilla JavaScript (minimal / optional)**

✅ Features:
- Clean, card‑based layout
- Logical separation of SOP sections
- Fully standards‑compliant HTML (no invalid table structures)
- Responsive and printable design
- Image‑based logo in header

❌ Not yet included:
- Backend / database
- Authentication
- Excel export
- Validation logic (planned for next phase)

---

## 📋 Sections Included

The form includes **all fields from the original SOP**, organized into the following sections:

### 1. Header
- Company logo (image)
- SOP title

### 2. Basic Information
- Operation
- Department
- Part Description
- Part Number
- Customer
- Impeller Date Code
- Customer Part Number
- Production Number

### 3. Checklist
- All checklist tasks from the SOP
- Inspector initials and date for each task

### 4. Impeller Hole Dimensions
- Hole numbers (1‑1 through 4‑1)
- Measurements:
  - Top
  - Middle
  - Bottom
  - Shim
  - Hole Center (390 / 395 / N/A)
- Reference tolerance:
  - **46.0 – 46.6 mm**

### 5. Rod Dimensions (Separate Section)
- Rod numbers (Rod 1 through Rod 10)
- Diameter (mm)
- Length (mm)
- Reference tolerances:
  - Diameter: **44.3 – 44.7 mm**
  - Length: **347 – 353 mm**

### 6. Plug Data
- Plug Part Number: **MK782670A05**
- Rows 1 through 11
- Fields:
  - Plug Thread Length (85 mm)
  - Rod + Plug Thread
  - Plug Length (112 mm)
  - Rod + Plug

### 7. Sign‑off
- Inspected By
- Work Performed By
- Signature
- Date

---

## 🖼 Logo Configuration

The header uses an image logo:


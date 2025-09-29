# 📝 PLACEHOLDER WRITING GUIDE

## ✅ CORRECT WAY TO WRITE PLACEHOLDERS:

### **Format:** `{placeholder_name}`

**Examples:**
```
Vessel Name: {vessel_name}
IMO Number: {imo}
Flag State: {flag}
Built Year: {built}
Owner: {owner_name}
```

## 🚫 AVOID THESE MISTAKES:

❌ `{ vessel_name }` (spaces inside)
❌ `{vessel name}` (spaces in name)
❌ `{{vessel_name}}` (double braces)
❌ `[vessel_name]` (square brackets)

## 📋 AVAILABLE AUTO-FILL PLACEHOLDERS:

### **Vessel Basic Info:**
- `{vessel_name}` → Vessel name
- `{imo}` → IMO number
- `{flag}` → Flag state
- `{vessel_type}` → Vessel type
- `{built}` → Year built
- `{callsign}` → Call sign
- `{mmsi}` → MMSI number

### **Vessel Dimensions:**
- `{length}` → Length in meters
- `{beam}` → Width/beam in meters
- `{draught}` → Draft in meters
- `{deadweight}` → Deadweight tonnage
- `{gross_tonnage}` → Gross tonnage
- `{speed}` → Speed in knots

### **Ownership:**
- `{owner_name}` → Owner company
- `{operator_name}` → Operator company

## 🔧 FOR CUSTOM PLACEHOLDERS:

If you need placeholders not in the list above:

1. **Write them as:** `{your_custom_name}`
2. **In admin panel:** Click "Edit" on template
3. **Map manually:** Select "Fixed Text" or "Database Field"

**Example:**
- Document: `Contract Date: {contract_date}`
- Admin mapping: `contract_date` → Fixed Text: "2024-01-15"
# 🎯 SIMPLE SOLUTION FOR MISSING PLACEHOLDERS

## ✅ PROBLEM IDENTIFIED:
- Some placeholders not auto-filling
- Duplicates in document
- Need manual mapping for custom placeholders

## 📝 SOLUTION: WRITE PLACEHOLDERS CORRECTLY

### **Step 1: Use Correct Format**
```
✅ CORRECT: {vessel_name}
✅ CORRECT: {imo}
✅ CORRECT: {contract_date}

❌ WRONG: { vessel_name }
❌ WRONG: {{vessel_name}}
❌ WRONG: [vessel_name]
```

### **Step 2: Available Auto-Fill Placeholders**
```
{vessel_name} → Vessel name
{imo} → IMO number  
{flag} → Flag state
{vessel_type} → Vessel type
{built} → Year built
{deadweight} → Deadweight
{length} → Length
{beam} → Width
{owner_name} → Owner
{operator_name} → Operator
```

### **Step 3: For Custom Placeholders**
If you need placeholders not in the auto-fill list:

1. **Write in document:** `{your_custom_name}`
2. **In admin panel:** Click "Edit" on template
3. **Map manually:** 
   - Select "Fixed Text" → Enter value
   - OR Select "Database Field" → Choose field
   - OR Select "Multiple Choices" → Enter options

**Example:**
- Document: `Contract Date: {contract_date}`
- Admin mapping: `contract_date` → Fixed Text: "2024-01-15"

## 🔧 QUICK TEST:

1. Create Word document with: `Vessel: {vessel_name}, IMO: {imo}`
2. Upload to admin panel
3. Go to vessel page → Download
4. Check if vessel name and IMO appear correctly

## 💡 TIP:
If placeholder not working:
1. Check spelling exactly matches
2. Use admin panel "Edit" to map manually
3. Avoid duplicates in same document
# Data Source Mapping - Smart Garage CRM

## 📊 **Primary Data Source: `all_jobs` Table**

The application pulls ALL data from the **`all_jobs`** table in Supabase. This is the single source of truth for:
- Customer information
- Job details  
- Financial data
- Technician assignments
- Lead information

## 🔗 **Field Mappings**

### **Customer Information**
| Display Field | Database Field | Table | Example |
|---------------|----------------|-------|---------|
| Customer Name | `Client Name` | all_jobs | "John Smith" |
| Phone | `Phone` | all_jobs | "(555) 123-4567" |
| Email | `Email` | all_jobs | "john@example.com" |
| Address | `Address` | all_jobs | "123 Main St" |

### **Job Information**
| Display Field | Database Field | Table | Example |
|---------------|----------------|-------|---------|
| Job ID | `Count` | all_jobs | "500344" |
| Parts Sold | `Parts Sold` | all_jobs | "Garage Door Spring" |
| Status | `Status` | all_jobs | "New Lead" |
| Technician | `Technician` | all_jobs | "Dan" |
| Date | `Date` | all_jobs | "2024-01-15" |
| Lead Platform | `LP` | all_jobs | "Thumbtack" |
| Notes | `Notes` | all_jobs | "Customer called about..." |

### **Financial Information**
| Display Field | Database Field | Table | Example |
|---------------|----------------|-------|---------|
| Sales Amount | `Sales` | all_jobs | 350.00 |
| Company Parts | `Company Parts` | all_jobs | 45.00 |
| Tech Parts | `Tech Parts` | all_jobs | 25.00 |
| Total Costs | `Total Costs` | all_jobs | 70.00 |
| Gross Profit | `Gross Profit` | all_jobs | 280.00 |
| Technician Payout | `Technician Payout` | all_jobs | 105.00 |
| Company Profit | `Company Profit` | all_jobs | 175.00 |

### **Payment Information**
| Display Field | Database Field | Table | Example |
|---------------|----------------|-------|---------|
| Cash | `Cash` | all_jobs | 200.00 |
| Check/Zelle | `Check/Zelle` | all_jobs | 150.00 |
| Credit Card | `CC` | all_jobs | 0.00 |
| CC After Fee | `CC after fee` | all_jobs | 0.00 |
| Thumbtack | `Thumbtack` | all_jobs | 0.00 |

## 🔍 **Data Flow**

### **1. Jobs Manager Page**
```
Jobs Manager → useJobs() → all_jobs table → Display jobs
```

**Query:**
```sql
SELECT * FROM all_jobs ORDER BY Count DESC
```

### **2. Customer Management Page**
```
Customer Management → useCustomers() → all_jobs table → Group by Client Name
```

**Query:**
```sql
SELECT * FROM all_jobs ORDER BY Count DESC
-- Then groups by 'Client Name' field
```

### **3. Dashboard**
```
Dashboard → useCustomers() → all_jobs table → Calculate totals
```

**Query:**
```sql
SELECT * FROM all_jobs ORDER BY Count DESC
-- Then calculates revenue, costs, profit from Sales, Company Parts, Tech Parts fields
```

## 📋 **Key Points**

### **Single Table Architecture**
- ✅ **All data** comes from `all_jobs` table
- ✅ **No joins** - everything is in one table
- ✅ **Flat structure** - each row = one job
- ✅ **Customer grouping** - done in application code, not database

### **Field Names**
- ✅ **Exact field names** - uses exact column names from database
- ✅ **Case sensitive** - `Client Name` (not `client_name`)
- ✅ **Spaces allowed** - field names can have spaces
- ✅ **Special characters** - some fields have `/` like `Check/Zelle`

### **Data Transformation**
- ✅ **Client-side grouping** - customers grouped by `Client Name`
- ✅ **Financial calculations** - done in application code
- ✅ **Status mapping** - `Status` field maps to job stages
- ✅ **Date handling** - `Date` field used for sorting and display

## 🛠️ **How to Verify**

### **Check Database Directly**
1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Select `all_jobs` table
4. You'll see all the fields listed above

### **Check Application Code**
- **Jobs Manager**: `src/pages/jobs/page.tsx` → `useJobs()` hook
- **Customer Management**: `src/pages/customers/page.tsx` → `useCustomers()` hook  
- **Data Hooks**: `src/hooks/useSupabase.ts` → Contains all database queries

### **Console Logging**
Add this to any component to see raw data:
```javascript
console.log('Raw database data:', jobs); // Shows all_jobs table data
```

## 🎯 **Summary**

**Everything comes from the `all_jobs` table:**
- Customer names = `Client Name` field
- Job IDs = `Count` field  
- All job details = Various fields in same table
- Financial data = `Sales`, `Company Parts`, `Tech Parts`, etc.
- No other tables are used for display data

# Database Migration Guide

## Quick Migration Steps

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not installed):
   ```bash
   npm install -g supabase
   ```

2. **Link to your project**:
   ```bash
   supabase link --project-ref vycktqjiaomxvsbvgzly
   ```

3. **Push all migrations**:
   ```bash
   supabase db push
   ```

### Option 2: Manual Migration via Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vycktqjiaomxvsbvgzly
2. Navigate to **SQL Editor**
3. Copy and paste the content from each migration file in chronological order:

**Migration Files (in order):**
- `20250822221600_e9c47856-0679-467a-913f-18c694a34ddc.sql` (Main tables & seed data)
- `20250822223506_30442a8f-5fd0-4175-9e5e-b572b18d282e.sql` (User roles system)
- `20250822223554_b028ee38-8012-4bbe-af71-b150b1035f46.sql`
- ... (continue with all files in chronological order)

### What Gets Created:

**Core Tables:**
- `profiles` - User profiles
- `subscriptions` - User subscriptions  
- `companies` - Oil companies
- `ports` - Global ports
- `refineries` - Oil refineries
- `vessels` - Oil tankers/ships
- `brokers` - Broker accounts
- `deals` - Trading deals
- `oil_prices` - Current oil prices
- `messages` - User messages
- `ai_logs` - AI interaction logs

**Sample Data Included:**
- 5 major oil companies (Saudi Aramco, Shell, BP, etc.)
- 5 key ports (Rotterdam, Singapore, Houston, etc.)
- 3 major refineries
- 3 sample vessels
- Current oil prices for major crude types

**Security:**
- Row Level Security (RLS) enabled
- Proper authentication policies
- Role-based access control

### Verification:

After migration, check your Supabase dashboard:
1. **Database** → **Tables** should show all tables
2. **Authentication** → **Users** for user management
3. **API** → **Settings** to verify your keys match .env file

Your application should now connect to the migrated database with all existing functionality intact!
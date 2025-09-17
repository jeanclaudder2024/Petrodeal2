# Support System Database Migration Instructions

## Overview
This document provides instructions for manually applying the support system database migration to your Supabase database.

## Migration File
The migration script is located at: `supabase/migrations/20250129000000_create_support_system.sql`

## Manual Application Steps

### Option 1: Using Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the entire content of the migration file `20250129000000_create_support_system.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### Option 2: Using Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db push
```

### Option 3: Direct Database Connection
If you have direct access to your PostgreSQL database:
```bash
psql -h your-db-host -U your-username -d your-database -f supabase/migrations/20250129000000_create_support_system.sql
```

## What This Migration Creates

### Tables Created:
1. **support_categories** - Categories for organizing support tickets
2. **support_tickets** - Main support tickets table
3. **support_ticket_messages** - Messages/replies for each ticket

### Default Categories Inserted:
- Technical Support
- Account Issues
- Feature Request
- General Inquiry

### Security Features:
- Row Level Security (RLS) policies for data protection
- User access controls (users can only see their own tickets)
- Admin access controls (admins can see and manage all tickets)

### Performance Features:
- Indexes on frequently queried columns
- Automatic timestamp updates
- Foreign key relationships

## Prerequisites
Make sure you have the following tables in your database before running this migration:
- `auth.users` (Supabase Auth table)
- `user_roles` (for admin role checking)

If you don't have a `user_roles` table, you can create it with:
```sql
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own roles
CREATE POLICY "Users can read own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Allow admins to manage roles
CREATE POLICY "Admins can manage roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );
```

## Verification
After running the migration, verify it was successful by checking:
1. All three tables exist: `support_categories`, `support_tickets`, `support_ticket_messages`
2. Default categories are inserted (should have 4 categories)
3. RLS policies are enabled on all tables
4. Indexes are created

You can verify with these queries:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'support_%';

-- Check default categories
SELECT * FROM support_categories;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename LIKE 'support_%';
```

## Troubleshooting
- If you get permission errors, make sure you're running as a database owner or have sufficient privileges
- If foreign key constraints fail, ensure the referenced tables (`auth.users`, `user_roles`) exist
- If RLS policies fail, check that the `user_roles` table exists and has the correct structure

## Support
If you encounter any issues with the migration, please check the error messages carefully and ensure all prerequisites are met.
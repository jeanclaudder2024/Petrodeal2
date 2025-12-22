-- Add unique constraint on email_accounts.email_address for upsert to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'email_accounts_email_address_key'
  ) THEN
    ALTER TABLE email_accounts ADD CONSTRAINT email_accounts_email_address_key UNIQUE (email_address);
  END IF;
END $$;
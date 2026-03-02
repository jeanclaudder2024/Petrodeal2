
-- Update SMTP password in email_accounts
UPDATE public.email_accounts 
SET smtp_password = 'Fz^7c$RJo;8', updated_at = now()
WHERE id = '78520648-40ce-4b54-8f5a-ccff11cb4455';

-- Update password + fix typo in email_configurations
UPDATE public.email_configurations 
SET password = 'Fz^7c$RJo;8', from_name = 'PetroDealHub', updated_at = now()
WHERE id = 'b6f05929-0a29-4400-b868-8e4e4051bd4e';

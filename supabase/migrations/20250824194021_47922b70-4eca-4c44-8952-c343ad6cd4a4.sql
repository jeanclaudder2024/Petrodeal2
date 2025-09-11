-- Update RLS policies to restrict broker-admin communication only
-- Drop existing policies and create new ones

-- Drop existing policies
DROP POLICY IF EXISTS "Brokers can send messages" ON broker_chat_messages;
DROP POLICY IF EXISTS "Brokers can view their own chats" ON broker_chat_messages;

-- Create new policy for brokers to send messages (only to admins)
CREATE POLICY "Brokers can send messages to admins" ON broker_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Broker can only send their own messages
  (broker_id IN (
    SELECT broker_profiles.id 
    FROM broker_profiles 
    WHERE broker_profiles.user_id = auth.uid()
  ) AND sender_type = 'broker')
  OR
  -- Admin can send messages to any broker
  (has_role(auth.uid(), 'admin') AND sender_type = 'admin')
);

-- Create new policy for viewing messages (broker-admin only)
CREATE POLICY "Brokers can view their admin chats" ON broker_chat_messages
FOR SELECT
TO authenticated
USING (
  -- Broker can view messages in their own chat thread
  (broker_id IN (
    SELECT broker_profiles.id 
    FROM broker_profiles 
    WHERE broker_profiles.user_id = auth.uid()
  ))
  OR
  -- Admin can view all messages
  has_role(auth.uid(), 'admin')
);
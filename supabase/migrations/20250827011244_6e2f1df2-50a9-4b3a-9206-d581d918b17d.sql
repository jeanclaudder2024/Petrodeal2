-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule oil price updates every 24 hours at 6:00 AM UTC
SELECT cron.schedule(
  'fetch-oil-prices-daily',
  '0 6 * * *', -- Daily at 6:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://ozjhdxvwqbzcvcywhwjg.supabase.co/functions/v1/fetch-oil-prices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) AS request_id;
  $$
);
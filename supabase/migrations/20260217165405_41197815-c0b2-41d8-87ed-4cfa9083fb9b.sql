
-- Create the cron job for daily oil price fetching
SELECT cron.schedule(
  'invoke-fetch-oil-prices-daily',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://xisfommyksvgzaeuvsmh.supabase.co/functions/v1/fetch-oil-prices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc2ZvbW15a3N2Z3phZXV2c21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzYxNDEsImV4cCI6MjA4NjkxMjE0MX0.J81gVoNehHGkEZa6yx_fmPdRnlAbU5qbEA2GEncqgs4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

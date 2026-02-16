# Document generation – troubleshooting

## 500 on api/process-document or api/generate-document

The backend returns 500 when something fails (e.g. database not configured or an exception).

**1. Check the error message in the UI**  
After the fix, the toast will show the backend `detail` (e.g. "Database not configured").

**2. "Database not configured"**  
On the VPS, the document-processor must have Supabase credentials:

- Edit `/opt/petrodealhub/document-processor/.env`
- Set at least:
  - `SUPABASE_URL=https://your-project.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`  
  (or `SUPABASE_KEY` if you use the anon key and RLS allows the operations)

Then restart the API: `pm2 restart python-api`

**3. See the real error on the server**  
On the VPS:

```bash
pm2 logs python-api --lines 100
```

Look for the Python traceback right after a failed request.

**4. Template not found**  
If the backend says "Template 'X' not found", ensure the template file exists under `document-processor/templates/` on the VPS (same name as in the app).

---

## 404 on api/ai-status

The backend now exposes `/ai-status`. If you still see 404, pull the latest `document-processor` and restart:

```bash
cd /opt/petrodealhub/document-processor && git pull origin master && cd .. && pm2 restart python-api
```

---

## Auth: "Invalid Refresh Token: Refresh Token Not Found"

This is Supabase auth: the session in the browser is expired or invalid.

**Fix:** Sign out and sign back in (or clear site data for petrodealhub.com and log in again).

---

## 406 on Supabase REST (banner_configs, system_settings)

406 usually means the server cannot return the format the client asked for (e.g. Accept header). If it only happens for some tables, check Supabase RLS and that the table exists and has the expected columns.

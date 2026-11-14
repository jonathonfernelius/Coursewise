# Task notification setup

Coursewise task reminders use browser Web Push. GitHub Pages continues to host the static app; Supabase stores each signed-in user's device subscriptions and runs the scheduled sender. Calendar events do not send notifications.

## One-time project setup

1. **Apply the database migration.** From the project folder, preview and apply the migration:

   ```powershell
   npx --yes supabase@latest db push --remote --dry-run
   npx --yes supabase@latest db push --remote
   ```

   The migration creates the per-device subscription table, a private delivery ledger, and an index for pending task reminders. Row-level security limits subscription records to their owner.

2. **Generate a VAPID key pair.** In PowerShell, run:

   ```powershell
   npx --yes web-push generate-vapid-keys
   ```

   Keep both values private while setting them up. The public key goes in the website configuration; the private key must stay in Supabase.

3. **Add the public key to the website.** In `js/supabase.js`, replace the empty `vapidPublicKey` value with the generated public key. This key is designed to be public. Never put the private key in a website file or commit it.

4. **Set the server secrets.** Create a long random value for `REMINDER_CRON_SECRET` (at least 32 random bytes). Set all four secrets in the Supabase project:

   ```powershell
   npx --yes supabase@latest secrets set VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY" VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY" VAPID_SUBJECT="mailto:YOUR_EMAIL" REMINDER_CRON_SECRET="YOUR_LONG_RANDOM_CRON_SECRET" --project-ref mhfvwzfoupeltdccpvmc
   ```

   Use the exact same public key in `js/supabase.js` and `VAPID_PUBLIC_KEY`. `VAPID_SUBJECT` can be a monitored email address or an HTTPS URL identifying the app. Keep the private key and cron secret out of Git and out of chat.

5. **Deploy the sender and Canvas sync functions.** The Canvas sync update also clears a reminder if an assignment loses its due date.

   ```powershell
   npx --yes supabase@latest functions deploy send-task-reminders --no-verify-jwt --project-ref mhfvwzfoupeltdccpvmc
   npx --yes supabase@latest functions deploy canvas-import --project-ref mhfvwzfoupeltdccpvmc
   ```

   The function is configured without Supabase JWT verification because the scheduled request uses its own shared secret header. It checks `x-coursewise-cron-secret` before doing any work.

6. **Enable the Supabase database extensions.** In the Supabase Dashboard for this project, open **Database → Extensions** and enable `pg_cron` and `pg_net`. Supabase Vault is used to keep the project URL, an API secret key, and the cron secret out of the scheduled SQL.

7. **Store the scheduled job values in Vault.** In **Project Settings → API Keys**, copy the project's secret API key (the legacy `service_role` key also works). Open **SQL Editor** and run this SQL, replacing the project URL and the two marked secrets with your own. Use the same cron secret as step 4. Never use the publishable key here.

   ```sql
   select vault.create_secret(
     'https://mhfvwzfoupeltdccpvmc.supabase.co',
     'coursewise_reminder_project_url'
   );

   select vault.create_secret(
     'YOUR_LONG_RANDOM_CRON_SECRET',
     'coursewise_reminder_cron_secret'
   );

   select vault.create_secret(
     'YOUR_SUPABASE_SECRET_API_KEY',
     'coursewise_reminder_api_key'
   );
   ```

8. **Schedule the sender once per minute.** In the SQL Editor, run:

   ```sql
   select cron.schedule(
     'coursewise-task-reminders',
     '* * * * *',
     $$
       select net.http_post(
         url := (
           select decrypted_secret
           from vault.decrypted_secrets
           where name = 'coursewise_reminder_project_url'
         ) || '/functions/v1/send-task-reminders',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'apikey', (
             select decrypted_secret
             from vault.decrypted_secrets
             where name = 'coursewise_reminder_api_key'
           ),
           'x-coursewise-cron-secret', (
             select decrypted_secret
             from vault.decrypted_secrets
             where name = 'coursewise_reminder_cron_secret'
           )
         ),
         body := '{}'::jsonb
       );
     $$
   );
   ```

   A one-minute schedule means about 43,200 scheduled function invocations in a 30-day month for the whole project, not per user. Review the project's current Supabase usage in its Dashboard.

9. **Publish the frontend.** Commit and push the `js/supabase.js` public-key change and the project files to the GitHub Pages branch. Do not commit any private key or cron secret.

## Enable it on each device

1. Sign in to Coursewise and open **Profile → Task notifications**.
2. Tap **Enable notifications** and allow the browser prompt. Permission is requested only after the user presses this button.
3. Repeat on every browser/device where reminders should appear. Each device stores a separate subscription. The button can turn notifications off on that device.
4. Create or edit a task, choose a due date, turn on **Schedule Reminder**, choose the lead time, and save. If the due date is removed, the reminder control disappears and the saved reminder is cleared. A task with a date but no time uses 9:00 a.m. in that device's time zone; a task with a time uses its saved due time.

## Platform setup

- **Windows:** Allow notifications for Coursewise in browser site settings. If the browser is allowed but notifications remain hidden, open **Settings → System → Notifications** and allow notifications for that browser.
- **macOS:** Allow Coursewise in browser website settings, then check **System Settings → Notifications** for the browser. Current Safari and Chromium-based browsers support web push on supported macOS versions.
- **iPhone/iPad:** Use Safari's **Share → Add to Home Screen**, open Coursewise from the Home Screen icon, then enable notifications in Coursewise. iOS/iPadOS requires the Home Screen web app; normal Safari tabs cannot subscribe to web push. Manage the OS permission under **Settings → Notifications → Coursewise**.
- **Android:** Allow the browser's notification prompt and check Android's app notification settings and browser site settings if it was blocked.

Browser/device notification settings can block delivery even after Coursewise is enabled. Reminders require an internet connection and can be delayed by the browser's push service or OS power settings. The notification content is intentionally generic and does not include task titles.

## Check or remove the schedule

In the Supabase SQL Editor, inspect the job with:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'coursewise-task-reminders';
```

Remove it with:

```sql
select cron.unschedule('coursewise-task-reminders');
```

The browser subscription controls only that device. To fully stop scheduled processing for the project, unschedule the cron job. To remove notification setup later, also remove the two Vault secrets and VAPID Function secrets.

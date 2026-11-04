# Friends UI preview

Open Home after signing in. The Friends card sits below Today; the header Friends button is available on the regular app pages. Both open the same slide-out panel.

Sample people only. Search by name, username, or a sample email such as oliverl@example.com. Add, accept, decline, and cancel update this page only. No backend, real friend requests, shared tasks, or account changes are connected. Reloading or navigating resets the sample states.

Changed: shared UI initialization, homepage layout, stylesheet/script references. Added: css/friends.css and js/friends.js. Existing bulk task actions are preserved.

Activity and cheers: friends show today's completion count when positive, otherwise this calendar week's count (Monday–Sunday), otherwise no activity line or Cheer button. Totals deduplicate task IDs within each period. Task names are never displayed. Each friend also shows their current streak (days in a row, in Utah time, with at least one finished task) as a number only. Cheers and days reset at midnight Utah time. Cheer switches to Cheered on both surfaces and prevents repeat clicks for that person/day within the preview session. These interactions remain UI-only; no notifications are sent. Real activity tracking and permissions require backend implementation.

# Profile, Canvas and menu polish

Replace these files in your existing website, then commit and push:
- css/styles.css
- js/profile.js
- js/canvas-integration.js
- js/home.js
- js/ui.js

No new Supabase SQL or Edge Function deployment is required. This ZIP is based
on your uploaded Coursewise-merged-task-sorting (1).zip and preserves its sorting,
Canvas autosave, AI cancellation and other existing behavior.

Changes:
- Open sort dropdowns are raised above neighboring list cards and controls.
- Profile streak counts use compact, uniform-size day bubbles. Flame, trophy and
  calendar icon motion is subtle and disabled by reduced-motion preferences.
- Canvas connection UI is more compact, with a calendar symbol, connected status,
  primary check action and secondary Disconnect action.
- Busiest and Free captions removed from the weekly view; chart/data remain.
- Session update reminders exclude all saved Canvas decisions, including skipped
  items, consistent with the merged import flow's undecided-item detection.

Validation: syntax checks for all changed JS, streak render states and reminder
filter checks passed. Browser visual checks and live Supabase tests were not run.

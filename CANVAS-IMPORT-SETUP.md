# Guided Canvas import update

## Install
1. Replace **js/canvas-integration.js** in your website with this ZIP's file.
2. Commit and push in GitHub Desktop. Refresh after your site finishes deploying.
3. No new SQL or Edge Function changes are required for this update if the earlier
   canvas-import fix and Gemini function are already deployed.

The ZIP includes all earlier changes. To install the earlier import fix if needed:
replace Supabase > Edge Functions > canvas-import > Code > index.ts with
supabase/functions/canvas-import/index.ts from this ZIP, then deploy it.

## Try with a fresh account
- Connect Canvas. Calendar loading replaces the preview.
- Choose Review with AI or Review manually. Merely connecting makes no Gemini call.
- Inspect suggested course-list destinations. Existing exact normalized matches are
  reused. Missing lists are offered as Create “IS 404”. No list is always available.
- Expand Review assignments or Suggested to leave out to adjust the checkboxes.
- Confirm using the import button; it names the number of lists to create and items
  to import. Only courses with selected items get a new list.
- Loading replaces review during import. View tasks appears on success.

## Returning users and retries
Saved checkbox choices are honored. Already-imported items are excluded from new
imports, with deadline synchronization retained. Categories are not required; existing
category choices are preserved. Edit an imported task's organization from the task UI.
AI failures retain completed results in this page session and offer Retry remaining AI
review. You can import without finishing AI review. Refreshing loses that AI cache.
Lists created before an interrupted import are reused on retry. A failure may leave an
empty newly created list; no existing lists or tasks are deleted to roll back a failure.
The import backend retains its duplicate checking. Parallel imports in separate browser
tabs are not protected by a new database uniqueness constraint in this update.

## Dates and privacy
Calendar feeds do not reveal submission status. Older assignments are unselected by
default but can be included. Date-only deadlines remain date-only in the preview.
The user's private calendar URL and downloaded calendar are NOT included in this ZIP.

## Checks
Simulated fresh-account tests with a 125-item fixture passed: 41 default selections on
Nov 7, 2026 (Mountain Time), four lists created at confirmation, existing IS401 reused,
manual review makes no AI request, and an interrupted 80/45 AI review retries only 45.
JS syntax passed. Live Supabase/Gemini and browser visual QA were not performed.

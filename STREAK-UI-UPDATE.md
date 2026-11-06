Latest refinements:
- Restored animated SVG flame in Snapshot streak bar.
- Removed daily task totals from Friends list, homepage Friends card, and friend details.
- Kept friend current streak inside details only and preserved Cheer.
- Preserved the seven-day weekly view.

- Friend details now show two side-by-side stats: current streak and tasks done today (using the existing `today` field from `coursewise_friends_data`). Task counts remain hidden in the main Friends list and home card.

- Friend profiles: tapping a friend's avatar or row (list and home card) opens their profile. The profile shows a large photo; tapping it enlarges it in place to fill the panel width, and tapping again shrinks it. No photo set → initials, not tappable. Frontend-only change (js/friends.js, css/friends.css); no SQL.

- Friends panel now slides out and fades its backdrop on close (X button, Escape, or clicking outside), with a slightly softer slide-in. Respects reduced-motion.

- Light/dark mode is now saved per account (Settings.Appearance), like the accent color. Run supabase/migrations/20261105010000_appearance_setting.sql once. Existing accounts keep their current device mode the first time, then it is saved. Without the SQL, dark mode stays device-local and nothing breaks.

- Preferences: new "Military time (24-hour)" switch. Saved per account (Settings.TimeFormat; run supabase/migrations/20261105020000_time_format_setting.sql) and cached on the device. Task and calendar times, the time picker (0–23, no AM/PM), and cheer timestamps follow it. Stored task times are unchanged (always HH:MM).

- Profile photo loading: signed photo URLs are now kept for the browser tab (so the browser reuses its cached image on every page), the photo lookup runs alongside the main page load, the header avatar is only rebuilt when it changes, and photos fade in with the initials hidden while a photo is on its way. On Profile, tapping your photo enlarges it in place (tap again to shrink), like the friend profile.

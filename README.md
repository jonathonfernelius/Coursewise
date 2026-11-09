# IS401-Todo-List
## App Summary
Students often struggle to manage assignments and deadlines across multiple courses and platforms. Tidy is a student focused task management app designed to organize coursework, manage tasks, and keep track of changing deadlines. The application combines a daily task overview, interactive to-do lists, and a calendar view into one platform. The main goal of Tidy is to simplify assignment tracking through planned Canvas integration, allowing students to manage and update their academic responsibilities more efficiently. By emphasizing simplicity and user experience, Tidy helps students stay organized without adding unnecessary complexity to their schedules. 

## Entity-Relationship Diagram
![Project ERD](images/IS401ERD.png "ERD")

## Tech Stack
- **Frontend:** Built using HTML, CSS, and JavaScript.
- **Backend & Database:** Supabase was used to handle all backend and database needs to create durable information.
- **Hosting:** GitHub Pages was used to host the website and allow easy access.
- **Why this approach:** We used this tech stack due to its familiarity from other projects. It was the easiest option for us to implement given the time frame and it serves all our needs perfectly.

## How to Get It Running
1. Navigate to the website URL: https://jonathonfernelius.github.io/IS401-Todo-List/index.html
2. If you already have an account, log in using your email & password
3. If you don't, click on the 'Create an Account' button.
4. After being redirected to the account creation page, fill out the required information and create your account
5. Confirm the account creation was successful
6. Awesome! You have your account, you are now on the home page of the website (aka the 'Today' page on the navbar) Here you can view your tasks due today, overdue tasks, and tasks for this week.
7. Navigate to the 'profile' page using the navbar or by clicking on your profile picture.
8. Set your preferences for color theme or calendar view. You will also be able to integrate with canvas here once the functionality is added.
9. Navigate back to any of the other 3 pages on the navbar. It's time to learn how to add tasks.
## Adding Tasks
10. In the upper right corner of the today / to-do / calendar pages, there is a button to add tasks, click on it.
11. Fill out the required information, this will include
12. The Name of the task (what you will call it)
13. Assigning the task to a list (Default options include School, Work, or Personal. You may add more as you desire)
14. Assigning the task a category (These are defined by the user and are intended to be more specific attributes to list items. ex - Homework, Projects, Sports)
15. Set a Due Date (When you want to accomplish the task by)
16. (Optional) Assign a specific time to the Due Date
17. Choose if the the task/events reoccurs. If so, choose how often it does under the repeat option.
18. Set a reminder (Functionality not added yet)
19. Create the task.
20. The task is now created and can be viewed in the today / to-do / calendar pages.
21. Mark the task off as complete when finished.

## Calendar events
Use **Add event** on the Calendar page to add a dated event with an optional
start and end time and category. Events appear on the calendar and in that day's details, but are
stored separately from tasks and never appear in task lists. The calendar also
shows an **Upcoming events** box below the task lists with events for today and
the next six days, up to 25 at a time. The event form has a reserved notifications control;
notifications are not enabled yet.

Before deploying this feature, run
`supabase/migrations/20261109000000_calendar_events.sql` once in the Supabase SQL
Editor. If that table was already created, also run
`supabase/migrations/20261109010000_calendar_event_recurrence.sql` to add the
recurrence rule and
`supabase/migrations/20261109020000_calendar_event_end_time.sql` to add end times.
Events can repeat daily, on weekdays, weekly, monthly, or on a custom schedule
with an optional end condition. An end time requires a start time and must be
later than it.

## Applying the list-ordering migration
To enable persistent list ordering on an existing Supabase project:
1. Open the project's Supabase SQL Editor.
2. Run `supabase/migrations/20261027000000_list_sort_order.sql` once if it has not already been applied.
3. Run `supabase/migrations/20261027010000_task_sort_order.sql` once to enable persistent task ordering and moving tasks between lists.
4. Deploy the updated site.

The migrations keep existing list and task order, then enable new lists and
tasks to be added at the bottom. Users can drag lists and tasks into a saved
order, and move tasks between lists. Run both migrations to enable both
features; the task-order migration can also be run independently.

## Applying the streaks migration
1. Open the project's Supabase SQL Editor.
2. Run `supabase/migrations/20261104000000_streaks.sql` once.
3. Deploy the updated site.

A streak day is any Utah-time (America/Denver) day with at least one completed task. Streaks are computed from `coursewise_completion_times`, so un-checking a task recomputes them. The migration also moves friend cheers and "done today" counts from UTC to Utah midnight.

## Verifying the Vertical Slice
To verify that the account creation vertical slice is working:
1. Open the website.
2. Click the Sign Up button to create a new account.
3. Enter the required account information and submit the form.
4. Confirm that the account was successfully created.
5. Refresh the page and verify that the user remains logged in.
6. Check Supabase to confirm that the new account information was saved to the database.

If the account remains accessible after refreshing, this demonstrates that the frontend successfully communicates with Supabase and that user account information persists.

## Canvas import: guided review
See **CANVAS-IMPORT-SETUP.md** for the current flow and installation steps.

Canvas loads first, then the student chooses **Review with AI** or **Review manually**.
Gemini is never called automatically on connection, page load, or a manual review.
Both paths lead to one course-organized preview. Older items and calendar events
start unselected, with AI suggestions applied only on the AI path. Everything is
editable before import. Previously saved or manually changed selections are respected.

Existing course lists are matched by normalized names (for example IS401 and IS 401).
If no match exists, the preview offers to create the course list. New lists are created
only when the user confirms import, and only for courses with selected items. Categories
are optional and are not required in this flow. Existing imported tasks are left alone,
except for the pre-existing deadline sync when checking Canvas.

### Gemini setup (only if not already configured)
Store GEMINI_API_KEY and your supported GEMINI_MODEL as Supabase Function secrets,
then deploy supabase/functions/canvas-ai-suggestions/index.ts. Never put the key in
browser JavaScript. Keep your project on your intended free plan; this update does
not change billing settings. Project quotas still apply. Reviews send only titles,
event types, due dates and batch indexes. The server also computes a past-due flag.

AI requests run sequentially in groups of up to 80, with a brief pause between batches.
Completed results are cached only while this page remains open; an explicit retry
reviews unfinished items. A failed review does not block manual selection/import.

## Profile streak updates
The profile uses SVG flame/trophy animations with reduced-motion support and an info
button instead of explanatory text under the cards. Personal-best persistence requires
supabase/migrations/20261107010000_persistent_streak_best.sql in the SQL Editor.
This is an earlier update, not a requirement added by the guided import UI.
It seeds from remaining completion history; already-deleted history cannot be recovered.

## Validation
Guided import tests use a local calendar fixture with 125 items. They verify manual
selection defaults, opt-in AI, batches and resume, existing-list matching, and creating
lists only on confirmation. Frontend syntax checks pass. No live database writes or
Gemini calls were performed. Browser visual verification was unavailable in this runtime.


## To-do visibility fix
Replace js/todo.js and js/ui.js, then commit/push the website. No Supabase changes.
The To-do page now includes Unassigned for tasks with no list or an unavailable
list, using the existing edit, delete, complete and bulk-selection actions. These
rows do not expose drag grips; use the pencil to choose a list. The Show completed
button controls the existing showDone preference. No tasks are reimported or changed
by displaying the section.

Checks passed for zero-list accounts, null/missing lists, completed visibility,
edit/delete/bulk hooks, and unchanged named-list drag markup. JS syntax passed.
Browser visual verification and live Supabase operations were not performed.


## Compact Canvas screen and list placement
Replace js/canvas-integration.js and js/todo.js; commit and push. No Supabase changes.
Unassigned appears after named lists. Canvas hides its check button during loading,
AI review and importing so only the activity card shows progress. The review-choice
screen uses a short item count, two buttons and a collapsed About AI review disclosure.
Syntax, import-flow and unassigned-task rendering regression checks passed.


## Task sorting

Each To-do list can be sorted manually, alphabetically, by due date, by recently
added, or by category. Use the arrow button to reverse a sort. Preferences are
saved in this browser for each account. Dragging or keyboard-reordering tasks
returns that list to Manual order.

To enable the Recently added sort on an existing Supabase project, run
`supabase/migrations/20261107000000_task_created_at.sql` once in the SQL Editor,
then deploy the updated site. Tasks already in the database receive the time
the migration runs because their original creation time was not recorded.

Canvas import also suggests a category matching the course name. If there is no
match, the review lets you create that category when you confirm the import.

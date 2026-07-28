---
name: update-news
description: Sync merged GitHub PRs by aymuos15 into the site's News list in src/js/updates.js. Use when the user says "update my news page", "I made new PRs", "sync my PRs", or similar.
---

# Update news page

Adds newly-merged PRs to the `updates` array in `src/js/updates.js`.

## Rules

- **Merged PRs only.** Open and closed-unmerged PRs are never added. Report them at the end instead.
- Entries live in `src/js/updates.js`, in the `updates` array, `"category": "pr"`.
- PR entries are ordered newest-first within the `pr` block. Insert new ones at the top of that block (just before the current first `"category": "pr"` entry).
- Skip PRs to the user's own forks (e.g. `aymuos15/*`).

## Steps

1. Fetch merged PRs:

   ```
   gh api "search/issues?q=author:aymuos15+type:pr+is:merged+is:public&sort=updated&order=desc&per_page=60" \
     --jq '.items[] | "\(.repository_url|split("/")|.[-2:]|join("/")) #\(.number) \(.closed_at) \(.title)"'
   ```

2. Read `src/js/updates.js` and collect the PR URLs already present. Anything from step 1 not present is a candidate.

3. Read `orgs.md` in this skill directory. Split candidates by whether their org is listed.

4. For candidates in **unlisted** orgs, ask the user (AskUserQuestion) whether to include them and whether to add that org to the accepted list. If they approve the org, append it to `orgs.md`.

5. Insert an entry per approved candidate, matching the existing format exactly:

   ```js
   { "date": "Jul. '26", "description": "<a href=\"https://github.com/ORG/REPO/pull/NUM\">TITLE</a> - ORG/REPO", "category": "pr" },
   ```

   - `date` uses the PR's merge month: `Jan. '26`, `Feb. '26`, ... `Sept. '25`, `Oct. '25`.
   - Escape HTML in titles (`&gt;`, `&lt;`, `&amp;`). Drop a trailing `(#1234)` issue ref only if it reads awkwardly; otherwise keep the title verbatim.

6. Report: what was added, and list any open PRs that were skipped (repo, number, title) so the user knows what's still in flight.

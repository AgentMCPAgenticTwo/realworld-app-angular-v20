# Correction c303dd2e7edc

**Target:** frontend

**Instruction:**

Rules recorded in the memory above are this project's own and still apply: where this change touches the same thing (the same field, form, format or limit), follow them even though this request does not repeat them, and say in your summary which ones you applied.

Add a loading indicator to the existing API health status in the footer while the health check is in progress. Once the check completes, preserve the existing green status for success and red status for failure. Follow the established implementation pattern.

---

This branch was forked to isolate this one correction. sage-maintenance-agent's CI workflow commits its result on top of this note once it runs; see the PR's checks and commits for progress.

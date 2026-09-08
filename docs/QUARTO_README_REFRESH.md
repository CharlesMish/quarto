# README refresh — September 8, 2026

Changed files: `README.md` and this handoff. The front page now leads with the
machine, image, local viewer instructions, current branch status, and Hush Basin
relationship. Detailed frozen status and architecture history remain in their
existing linked records. The accepted FO1 image is retained.

GitHub was checked directly: accepted main was `e56a4c0`, and reconciliation
PR #5 remained OPEN, with no merge timestamp. The README labels its viewer and
surface improvements accordingly rather than presenting them as merged.

Validation: both existing `tests/mt1-ba1.spec.ts` cases passed (570 ms), all eight
relative README links/images resolved, and `git diff --check` passed. Build and
browser/geometry suites were not rerun because no runtime, configuration, test,
or geometry file changed. The BA1 tests use files only; no viewer or authority
process was started.

Evidence consulted: both README/current-state versions, nomenclature, operator
contract, GitHub PR states and main history, package scripts, and existing BA1
documentation assertions. No accepted evidence was regenerated. New evidence is
this documentation validation record.

Authority participation: **none**.

Remaining unknowns: PR #5 acceptance and native Godot validation remain separate;
no hosted-viewer deployment was checked or changed. No validation failures.

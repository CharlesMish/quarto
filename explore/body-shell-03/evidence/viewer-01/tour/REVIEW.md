# Integrated handover-tour visual review

The actual integrated tour was reviewed through `presentation.setTourStep(4)`
and `setTourStep(5)`, with BODY ON, at 1440×960 and 390×844. Mobile screenshots
include both explicitly collapsed and expanded Details states. No camera,
lighting, geometry or visibility override was used.

The two desktop cameras show the approaching and terminal can/receiver from the
open stern, with the tour card clear of the mechanism. On mobile, the compact
tour card occupies a separate area above the rendering canvas: 116px collapsed
and 166px with Details expanded. It no longer covers the can opening or receiver.
The smaller viewport with Details expanded retains a useful handover view.
The tour is an overview; individual lock inspection still uses existing close-up
and section controls. Outer folio tips may leave the dedicated handover close-up.

Every visible enabled control passed viewport and center hit-target checks.
The card and canvas do not overlap on mobile, no horizontal page overflow was
observed, and BODY ON remains enabled in all six cases. The capture record
includes lightweight initial provenance, source hashes checked before and after
capture, actual camera/card/canvas state, controls and JavaScript errors.

Changed source files: none in this review. Added evidence: six screenshots,
`review.json` and the original `capture.mjs` in this new directory. The script's
root, output and viewer URL constants describe the original WSL run; change
those constants and create a fresh output directory for another capture. Earlier
occluded-camera/mobile-card images remain in `../development/` as development
evidence. Details persists between stops; the final script explicitly
sets its requested state instead of assuming it resets.

**Authority participation: none.** Intentional canonical pose controls used the
existing frozen runtime certificate path. Initial build identification used only
the lightweight provenance APIs; no authority or accepted-evidence writer ran.
Other tests ran concurrently, so these captures establish no timing claim.
Native Godot validation remains outside this browser presentation review.

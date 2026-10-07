# Changelog

Notable changes to Quarto are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The repository also retains the historical `quarto-ks1-accepted` tag.

## [Unreleased]

### Added
- Charter (`docs/CHARTER.md`), MIT license, and this changelog.
- Showcase polish for the public viewer: link-preview metadata and image, favicon, a one-time load showing of the transformation, centred guided framing that settles on SPREAD and DRIVE, and tests for each (`docs/QUARTO_SHOWCASE_POLISH_01.md`).

### Changed
- README updated for visitors, with current setup instructions, model limits, and a pinned viewer screenshot.
- Public viewer copy: the readout shows progress, and provenance identifiers sit under a collapsed Provenance disclosure in Details & help.
- Hush Basin palette and studio/lite lighting rebalanced so the folios no longer dominate and the hull and hardware separate. Flat lighting and the accepted palette are unchanged.

## [0.1.0] - 2026-09-27

This entry covers `9321de4` through `88b1070`.

### Added
- Initial import: the engineering viewer, the study records and evidence, and the presentation package (`9321de4`).
- Receiving shoulders (FO1) that show which station each folio belongs to (#1, `aaa0f20`).
- Body study (BA1): Quarto is an exposed-carrier vehicle. No geometry changed (#3, `285e496`).
- Negative result for the stern study (SO1), with #2 left unmerged (`2dba3ec`, via #3).
- Cloudflare Workers hosting (#4, `e56a4c0`).
- Viewer controls, tour, Fit, and the Hush Basin palette, plus the solid-body surface repair, combined with FO1 (#5, `e5cac49`).
- Public presentation viewer at https://quarto.cmish.dev/ (#7, `35a20ab`; `bea1264`).
- Faster interactive posing, lighting tiers, and Inspect/Show/Game playback speeds (#8, `88b1070`).

### Changed
- README rewritten for visitors (#6, `e5e0556`).

### Fixed
- Source-integrity test updated so it checks the root build scripts against the deployment baseline (#8, `d3e0587`).

export type PresentationPalette = "hush-basin" | "accepted";

export interface PresentationState {
  palette: PresentationPalette;
  tourStep: number | null;
  automatic: boolean;
  direction: number;
}

export interface PresentationHooks {
  getState(): PresentationState & { viewerId: "QUARTO-VIEWER-01" };
  setPalette(value: PresentationPalette): void;
  setTourStep(value: number | null): void;
  fitCamera(): void;
  reverse(): void;
}

/** Reading the tour never evaluates a pose or an authority predicate. */
export const TOUR_STOPS = [
  {
    title: "SPREAD · meet the four folios",
    description: "Each folio is a complete lateral assembly. The smaller forward pair sits lower; the larger rear pair starts higher to make room for its downward fold.",
    t: 0, camera: "body",
  },
  {
    title: "Fold · keep the material",
    description: "The outer leaves fold underside-to-underside. Watch the hinge and the different front and rear timing: the wide envelope contracts without shrinking or hiding the leaves.",
    t: 0.24, camera: "body",
  },
  {
    title: "Reorient · the rear haunch",
    description: "The restrained folios yaw aft and cant toward their packing posture. The higher, larger rear pair gives Quarto its characteristic shoulder relationship.",
    t: 0.6, camera: "body",
  },
  {
    title: "Seat · owned receiving sockets",
    description: "The folios acquire their catches and nests along the fixed rails. Their outer faces remain proud of the presentation shell's chine; they do not disappear into the body.",
    t: 0.86, camera: "driveBody",
  },
  {
    title: "Handover · fixed core, moving can",
    description: "The hollow can translates around the fixed core. The open stern lets you follow the receiver toward capture and locking. PROP SECTION can expose the interior when you want a closer look.",
    t: 0.94, camera: "tourHandover",
  },
  {
    title: "DRIVE · inspect the handover",
    description: "The terminal receiver, capture and locks remain inspectable. Compare the released pose, or reverse the transformation to follow the sequence back. This tour describes motion; readiness remains in the inspection diagnostics.",
    t: 1, camera: "tourSeated",
  },
] as const;

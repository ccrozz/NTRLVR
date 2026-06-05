import { useEffect } from "react";

export type HelpToolItem = { name: string; description: string };

/** Collapsed / expanded canvas toolbar (top-left of grid). */
export const DESIGNER_TOOLBAR_QUICK: HelpToolItem[] = [
  {
    name: "Tools",
    description:
      "Opens the canvas toolbar. On desktop it starts as a compact pill — expand to reach zoom, grid, and ⋯.",
  },
  {
    name: "− / + / Fit",
    description:
      "Zoom the top-down layout in and out, or Fit to re-center on your beds and plants.",
  },
  {
    name: "Undo / Redo",
    description: "Step backward and forward (⌘Z / ⌘⇧Z).",
  },
  {
    name: "Grid",
    description: "Toggle the 1-foot grid and edge rulers.",
  },
  {
    name: "⋯",
    description:
      "More — beds, Build for me, display modes, side profile, yard photo, and PNG export.",
  },
];

/** Inside the ⋯ menu on the canvas toolbar. */
export const DESIGNER_TOOLBAR_MENU: HelpToolItem[] = [
  {
    name: "Beds & space",
    description:
      "Add rectangle or circle beds in feet, or draw a custom outline on the grid.",
  },
  {
    name: "Build for me",
    description:
      "Opens the Build For Me tab in the left sidebar for the step-by-step questionnaire.",
  },
  {
    name: "Simple plant dots / Full plant rings",
    description:
      "Compact dots when the bed is crowded, or full canopy-size rings with labels.",
  },
  {
    name: "Side profile / Top-down view",
    description:
      "Switch to a side elevation of plant height and spread (drag to pan, scroll to zoom), or back to the plan view.",
  },
  {
    name: "Yard photo",
    description: "Upload a photo of your yard as the canvas background.",
  },
  {
    name: "Save as PNG",
    description: "Download a snapshot of your current top-down layout.",
  },
];

export const DESIGNER_HELP_SECTIONS = [
  {
    title: "Let's build your garden",
    body: "Tap Let's build your garden in the top bar, or open Build For Me in the left sidebar (⋯ → Build for me). Pick your state and sub-region, size or draw a bed, then answer the questionnaire. Food forest places fruit trees on the canvas first; kitchen, pollinator, visual, and easy-care styles each place a different plant mix. Use Place trees on canvas or Add plants to canvas when you're ready, then fill in companions from Browse Plants.",
  },
  {
    title: "Beds & space",
    body: "Open Beds & space from ⋯. Add a rectangle or circle by size in feet, or tap Draw custom outline and click corners on the grid (at least 3 points, then Finish zone in the bottom bar). In Select mode, drag a zone to move it and every plant inside together. Resize a selected bed by dragging its corner handles.",
  },
  {
    title: "Find plants (left sidebar)",
    body: "Browse Plants is the default — search, filter by category (fruit trees, herbs, flowers, natives, and more), and switch state with the Florida / Tennessee / Connecticut tabs. Tap a row to open its profile without placing it. After Build For Me, recommendations show with priority badges; use Show all plants to return to the full regional catalog.",
  },
  {
    title: "Place plants",
    body: "Drag from the list onto the grid (on mobile, long-press the ⠿ handle on each row). Each plant shows a canopy ring sized to mature spread — toggle Simple plant dots in ⋯ for a cleaner view. Build For Me can auto-place its picks; you can still drag extras from Browse Plants.",
  },
  {
    title: "Plants on the canvas",
    body: "Single-click (or tap) a plant to select it, see its boundary, and drag to move. Double-click (or double-tap) opens the full profile on the right. Dragging empty grid space pans; scroll or pinch zooms toward the cursor.",
  },
  {
    title: "Your garden list",
    body: "After you place plants, Your garden appears at the top of the canvas — a quick list of everything on the grid. With multiple beds, space tabs filter plants per zone in the sidebar and garden list.",
  },
  {
    title: "Plant profile & growing guide",
    body: "Tap a plant in the sidebar (without dragging) to read its profile. Double-click a canvas plant for the same panel. Expand How to grow it in [your state] for zone fit, planting timing, day-to-day care, and first-year tips tailored to Florida, Tennessee, or Connecticut. When a plant is selected on canvas, use Plant nearby — tap + to place a companion on its ring, or Why? for a short pairing note.",
  },
  {
    title: "Side profile",
    body: "Open Side profile from ⋯ to see plants drawn to scale by height and canopy width, in left-to-right garden order. Drag to pan across a long layout; scroll or use − / + / Fit to zoom. Hover or click a plant for its name and dimensions — selection syncs with the top-down view.",
  },
  {
    title: "Pan and zoom",
    body: "On the top-down canvas, drag empty space to pan. Mouse wheel or pinch zooms; two-finger trackpad scroll pans. Use − / + or Fit in the toolbar. Edge rulers show feet when the grid is on.",
  },
  {
    title: "Canvas layers",
    body: "At the bottom of the left sidebar, open Canvas layers to show or hide overstory, understory, shrubs, herbs, and other layers — handy when the bed feels crowded.",
  },
  {
    title: "Remove a plant",
    body: "Select a plant on the canvas, then Delete or Backspace, or Remove from layout in the profile panel.",
  },
  {
    title: "Want us to build it for you?",
    body: "After you have a plan, Evergreen Solutions FL can install native restoration, food forests, and land-management work on Florida properties. Use Request a quote in Build For Me results or the full plan sheet — or visit evergreensolutionsfl.com.",
  },
] as const;

export function DesignerHelpOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="designer-help-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="designer-help-card"
        role="dialog"
        aria-labelledby="designer-help-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="designer-help-dismiss"
          onClick={onClose}
          aria-label="Close instructions"
        >
          ×
        </button>
        <header className="designer-help-card-head">
          <h2 id="designer-help-title">How to use the designer</h2>
          <p className="designer-help-intro">
            Plan a regional food forest on a real-size grid: pick Florida,
            Tennessee, or Connecticut, define beds, use Build For Me or
            hand-pick plants, read state-tailored growing guides, and refine
            layout, companions, layers, and side profile.
          </p>
        </header>

        <section
          className="designer-help-tools-block"
          aria-labelledby="designer-help-tools-title"
        >
          <h3
            id="designer-help-tools-title"
            className="designer-help-tools-heading"
          >
            Canvas toolbar (top-left)
          </h3>
          <ul className="designer-help-tools">
            {DESIGNER_TOOLBAR_QUICK.map((tool) => (
              <li key={tool.name}>
                <strong>{tool.name}</strong>
                <span>{tool.description}</span>
              </li>
            ))}
          </ul>
          <p className="designer-help-tools-subhead">In the ⋯ menu</p>
          <ul className="designer-help-tools">
            {DESIGNER_TOOLBAR_MENU.map((tool) => (
              <li key={tool.name}>
                <strong>{tool.name}</strong>
                <span>{tool.description}</span>
              </li>
            ))}
          </ul>
        </section>

        <ol className="designer-help-list">
          {DESIGNER_HELP_SECTIONS.map((section) => (
            <li key={section.title} className="designer-help-item">
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </li>
          ))}
        </ol>
        <footer className="designer-help-card-foot">
          <button type="button" className="designer-help-gotit" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
}

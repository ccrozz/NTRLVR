import { useEffect } from "react";

export type HelpToolItem = { name: string; description: string };

/** Collapsed / expanded canvas toolbar (top-left of grid). */
export const DESIGNER_TOOLBAR_QUICK: HelpToolItem[] = [
  {
    name: "Tools",
    description:
      "Tap to open the canvas toolbar. On desktop it stays as a small pill until you need it; tap × or hide to collapse again.",
  },
  {
    name: "− / +",
    description: "Zoom out and in on the layout.",
  },
  {
    name: "Fit",
    description: "Re-center the view on your beds and plants.",
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
      "More options — beds, Build for me, display modes, yard photo, and export (opens as a small menu, not a big panel).",
  },
];

/** Inside the ⋯ menu on the canvas toolbar. */
export const DESIGNER_TOOLBAR_MENU: HelpToolItem[] = [
  {
    name: "Beds & space",
    description:
      "Add or edit beds in feet — rectangle, circle, or draw a custom outline on the grid.",
  },
  {
    name: "Build for me",
    description:
      "Opens the Build For Me tab in the left sidebar to answer a short questionnaire.",
  },
  {
    name: "Simple plant dots / Full plant rings",
    description:
      "Compact dots when the bed is crowded, or full canopy-size rings with labels.",
  },
  {
    name: "Side profile / Top-down view",
    description:
      "Switch between planning on the grid and a vertical stack of canopy layers.",
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
    body: "Use the top-bar button or Build For Me in the left sidebar (or ⋯ → Build for me). Pick your state, draw or size a bed, then answer the questionnaire. Food forest = fruit trees only on canvas. Kitchen garden = herbs and veggies. Pollinator = flowers and nectar plants. Visual = ornamental beauty, no fruit trees. Use Place on canvas when you're ready.",
  },
  {
    title: "Beds & space",
    body: "Open Beds & space from ⋯. Add a rectangle or circle by size in feet, or tap Draw custom outline and click corners on the grid (at least 3 points, then Finish zone in the bottom bar). In Select mode, drag a zone to move it and every plant inside together.",
  },
  {
    title: "Find plants (left sidebar)",
    body: "Browse Plants is the default — search, filter by category, and switch state (Florida, Tennessee, Connecticut). After Build For Me, recommendations show with priority badges; use Show all plants to return to the full catalog. Full catalog at the bottom opens the complete list.",
  },
  {
    title: "Place plants",
    body: "Drag from the list onto the grid (on mobile, use the ⠿ handle on each row). Each plant shows a canopy ring sized to mature spread — toggle Simple plant dots in ⋯ for a cleaner view. Build For Me beds are rectangles: click the bed to select it, then drag corners to resize (plants scale with the bed).",
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
    title: "Plant profile & companions",
    body: "Tap a plant in the sidebar (without dragging) to read its profile. Double-click a canvas plant for the same panel. When selected on canvas, use Plant nearby — tap + to place a companion on its ring, or Why? for a short pairing note.",
  },
  {
    title: "Pan and zoom",
    body: "Drag empty space to pan. Mouse wheel or pinch zooms; two-finger trackpad scroll pans. Use − / + or Fit in the toolbar. Edge rulers show feet when the grid is on.",
  },
  {
    title: "Canvas layers",
    body: "At the bottom of the left sidebar, open Canvas layers to show or hide overstory, understory, shrubs, herbs, and other layers — handy when the bed feels crowded.",
  },
  {
    title: "Remove a plant",
    body: "Select a plant on the canvas, then Delete or Backspace, or Remove from layout in the profile panel.",
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
            Plan a regional food forest on a real-size grid: define beds, use
            Build For Me or hand-pick plants, then refine layout, companions,
            and layers.
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

import { useEffect } from "react";

export type HelpToolItem = { name: string; description: string };

/** Always visible on the top-left of the canvas. */
export const DESIGNER_TOOLBAR_QUICK: HelpToolItem[] = [
  {
    name: "Scroll / pinch",
    description:
      "Mouse wheel or trackpad pinch zooms on the canvas. Two-finger scroll pans.",
  },
  { name: "+ / −", description: "Zoom buttons in the toolbar." },
  { name: "Center", description: "Pan and zoom back to a good view of your bed." },
  {
    name: "Undo / Redo",
    description: "← → in the canvas toolbar, or ⌘Z / ⌘⇧Z to step backward and forward.",
  },
  {
    name: "⋯",
    description: "Open more tools — space, grid, auto-fill, photo, export, and more.",
  },
];

/** Inside the ⋯ menu on the canvas toolbar. */
export const DESIGNER_TOOLBAR_MENU: HelpToolItem[] = [
  {
    name: "Space",
    description:
      "Open Your space to add beds in feet (rectangle, circle, or draw a custom outline on the grid).",
  },
  {
    name: "Build your garden",
    description: "Opens the Build For Me tab in the left sidebar — answer a few questions for plant recommendations.",
  },
  {
    name: "Foot grid",
    description: "Show or hide the 1-foot grid and scale bar along the canvas edges.",
  },
  {
    name: "Simple icons / Show canopy rings",
    description:
      "Switch between compact plant dots and full canopy-size rings with labels.",
  },
  {
    name: "Yard photo",
    description: "Upload a photo of your yard as the background to plan on top of.",
  },
  {
    name: "Export PNG",
    description: "Download a picture of your current top-down layout.",
  },
  {
    name: "Cross section",
    description:
      "Side view of canopy layers for plants on the canvas (top-down is for placing plants).",
  },
];

export const DESIGNER_HELP_SECTIONS = [
  {
    title: "Let's build your garden",
    body: "Tap Let's build your garden in the top bar, then use the Build For Me tab in the left sidebar. Draw beds first with Space (⋯ menu) — rectangle, circle, or custom outline — then pick My drawn space in the questionnaire so recommendations match that exact area. Or use a size estimate / custom feet. Drag plants onto the canvas, or Place all plants to fill your chosen bed.",
  },
  {
    title: "Your space — draw a bed",
    body: "Open Space from the ⋯ menu. Add a rectangle or circle by size in feet, or tap Draw custom outline and click corners on the grid (at least 3 points, then Finish zone in the bar at the bottom). In Select mode, drag a zone to move it and all plants inside together. Auto-fill with a new bed adds a second zone beside your layout; choose an existing zone only when you want to refill that bed (plants inside it are replaced).",
  },
  {
    title: "Find plants (left sidebar)",
    body: "Browse Plants is the default tab — search by name or use category pills. After Build For Me, recommended plants appear in Browse Plants with priority badges; tap Show all plants to return to the full catalog. Tap Full catalog at the bottom for the complete list.",
  },
  {
    title: "Place plants",
    body: "Drag a plant from the list onto the grid. Each plant shows a canopy ring sized to mature spread (toggle Simple icons in ⋯ if you want a cleaner view). Click a plant on the canvas to select it.",
  },
  {
    title: "Your garden list",
    body: "After you place plants, a Your garden tab appears on the left edge of the canvas. With more than one bed drawn, use the space tabs to switch between them and see only the plants in that zone. The Browse Plants sidebar uses the same tabs when you have recommendations.",
  },
  {
    title: "Plant profile & companions",
    body: "Click a plant in the sidebar (without dragging) to read its profile on the right. When a plant is selected on the canvas, the profile shows Plant nearby — tap + to place a companion on its ring, or Why? for a short pairing note.",
  },
  {
    title: "Pan and zoom",
    body: "Drag empty space on the grid to pan. Scroll or pinch over the canvas to zoom toward your cursor; two-finger trackpad scroll pans. Use + / − or Center in the toolbar. Edge rulers show feet when the grid is on.",
  },
  {
    title: "Hide canopy layers",
    body: "At the bottom of the left sidebar, open Canvas layers to show or hide overstory, understory, shrubs, herbs, and other layers — handy when the bed feels crowded.",
  },
  {
    title: "Yard photo background",
    body: "Yard photo in the ⋯ menu lets you upload an image from your device as the backdrop. Plan on top of the real site, then use Center if you need to re-frame.",
  },
  {
    title: "Cross section view",
    body: "Cross section in ⋯ switches to a vertical stack of canopy layers for plants on your canvas. Switch back to plan view to add or move plants.",
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
            Plan a Florida food forest on a real-size grid: define your bed, auto-fill
            or hand-pick plants, and explore companions and canopy layers.
          </p>
        </header>

        <section className="designer-help-tools-block" aria-labelledby="designer-help-tools-title">
          <h3 id="designer-help-tools-title" className="designer-help-tools-heading">
            Canvas toolbar (top-left of grid)
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

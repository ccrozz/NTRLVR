import { useEffect } from "react";

export type HelpToolItem = { name: string; description: string };

/** Always visible on the top-left of the canvas. */
export const DESIGNER_TOOLBAR_QUICK: HelpToolItem[] = [
  { name: "+ / −", description: "Zoom in and out on your layout." },
  { name: "Center", description: "Reset pan and zoom to the starting view." },
  { name: "Undo", description: "Step back after moving or placing plants." },
  {
    name: "⋯",
    description: "Open the tool menu (Space, yard photo, cross section, and more).",
  },
];

/** Inside the ⋯ menu on the canvas toolbar. */
export const DESIGNER_TOOLBAR_MENU: HelpToolItem[] = [
  {
    name: "Space",
    description:
      "Opens the Your space panel to define beds and zones in feet — rectangles, circles, or a custom drawn outline.",
  },
  {
    name: "Foot grid",
    description:
      "Toggle a 1-foot grid and scale bar on the canvas so spacing matches real-world size.",
  },
  {
    name: "Yard photo",
    description:
      "Upload a photo of your yard as the canvas background. Drag plants on top to plan over the real site.",
  },
  {
    name: "Export PNG",
    description: "Download a snapshot of your current top-down layout.",
  },
  {
    name: "Cross section",
    description:
      "Switch to a side-view diagram of canopy layers (overstory, understory, shrubs, etc.) for the plants you placed.",
  },
];

export const DESIGNER_HELP_SECTIONS = [
  {
    title: "Auto-fill layout",
    body: "Tap Auto-fill in the header (or Auto-fill layout in the ⋯ menu). Walk through garden type, what you want to harvest, sun/water/time, plant priorities, then bed size and region — we build a starter layout matched to your answers.",
  },
  {
    title: "Find plants",
    body: "Use the search box and category pills on the left. Scroll the list to browse the Florida food-forest catalog.",
  },
  {
    title: "Read a plant profile",
    body: "Click a plant in the list (without dragging) to open its profile on the right — growing notes, guild roles, and suggested companions.",
  },
  {
    title: "Place plants on the canvas",
    body: "Drag a plant from the list onto the green layout area. Click a placed plant to select it and see who to plant nearby.",
  },
  {
    title: "Your garden",
    body: "Once you have plants on the canvas, a Your garden tab appears on the left edge of the layout. Tap it to open a scrollable list of everything you placed — tap any row to jump to that plant and open its profile.",
  },
  {
    title: "Build a guild",
    body: "With a plant selected on the canvas, use Plant nearby: tap + to drop a companion on its recommended ring spot, drag onto the grid, or tap Why? for a short pairing note.",
  },
  {
    title: "Pan the layout",
    body: "Drag empty canvas space to move around. Use the toolbar in the top-left corner for zoom and extra tools.",
  },
  {
    title: "Space — size your yard",
    body: "Tap Space in the ⋯ menu to open Your space. Add rectangle or circle zones by size in feet, or use Draw to click corners on the canvas (at least 3 points, then Finish zone). In Select mode, drag a zone to move it and every plant inside it together. Plants outside your zones are flagged so you can adjust placement.",
  },
  {
    title: "Yard photo background",
    body: "Tap Yard photo in the ⋯ menu and choose an image from your device. Your photo becomes the layout backdrop so you can place plants over the real yard. Use Center if you need to re-frame the view.",
  },
  {
    title: "Cross section view",
    body: "Tap Cross section in the ⋯ menu to leave the top-down plan and see a vertical stack of canopy layers for the plants on your canvas. Tap Cross section again to return to the plan view. Placing new plants is done in top-down mode.",
  },
  {
    title: "Remove a plant",
    body: "Select a plant on the canvas, then press Delete or Backspace, or use Remove from layout in the detail panel.",
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
            Plan a Florida food forest: browse plants, place them in guilds, and learn
            why neighbors work together.
          </p>
        </header>

        <section className="designer-help-tools-block" aria-labelledby="designer-help-tools-title">
          <h3 id="designer-help-tools-title" className="designer-help-tools-heading">
            Canvas toolbar
          </h3>
          <p className="designer-help-tools-lead">
            Top-left of the green layout area — tap ⋯ to open the full menu.
          </p>
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

import type { RefObject } from "react";
import type { DesignerCanvasHandle } from "./DesignerCanvas";
import {
  INITIAL_CANVAS_ZOOM,
  INITIAL_STAGE_POS,
  useDesignerStore,
} from "../../store/useDesignerStore";

export function CanvasToolbar({
  canvasRef,
}: {
  canvasRef: RefObject<DesignerCanvasHandle | null>;
}) {
  const zoom = useDesignerStore((s) => s.zoom);
  const stagePos = useDesignerStore((s) => s.stagePos);
  const setZoom = useDesignerStore((s) => s.setZoom);
  const resetCanvasView = useDesignerStore((s) => s.resetCanvasView);
  const undo = useDesignerStore((s) => s.undo);
  const showRuler = useDesignerStore((s) => s.showRuler);
  const setShowRuler = useDesignerStore((s) => s.setShowRuler);
  const setBackgroundImage = useDesignerStore((s) => s.setBackgroundImage);
  const setCanvasMode = useDesignerStore((s) => s.setCanvasMode);
  const workspacePanelOpen = useDesignerStore((s) => s.workspacePanelOpen);
  const setWorkspacePanelOpen = useDesignerStore((s) => s.setWorkspacePanelOpen);

  function uploadPhoto() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
      setCanvasMode("photo");
    };
    input.click();
  }

  function exportPng() {
    const data = canvasRef.current?.exportPng();
    if (!data) return;
    const a = document.createElement("a");
    a.href = data;
    a.download = "food-forest-layout.png";
    a.click();
  }

  return (
    <div className="designer-toolbar">
      <button type="button" onClick={() => setZoom(zoom + 0.1)}>
        Zoom in
      </button>
      <button type="button" onClick={() => setZoom(zoom - 0.1)}>
        Zoom out
      </button>
      <button
        type="button"
        onClick={resetCanvasView}
        title="Reset pan and zoom to the starting view"
        disabled={
          zoom === INITIAL_CANVAS_ZOOM &&
          stagePos.x === INITIAL_STAGE_POS.x &&
          stagePos.y === INITIAL_STAGE_POS.y
        }
      >
        Center view
      </button>
      <button type="button" onClick={undo}>
        Undo
      </button>
      <button
        type="button"
        className={workspacePanelOpen ? "designer-toolbar-active" : ""}
        onClick={() => setWorkspacePanelOpen(!workspacePanelOpen)}
      >
        Space
      </button>
      <button
        type="button"
        className={showRuler ? "designer-toolbar-active" : ""}
        onClick={() => setShowRuler(!showRuler)}
        title="Foot grid and scale bar"
      >
        {showRuler ? "Hide grid" : "Foot grid"}
      </button>
      <button type="button" onClick={uploadPhoto}>
        Yard photo
      </button>
      <button type="button" onClick={exportPng}>
        Export PNG
      </button>
    </div>
  );
}

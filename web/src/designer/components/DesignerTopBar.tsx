import { Link } from "react-router-dom";
import { AppNav } from "../../components/AppNav";

export function DesignerTopBar() {
  return (
    <header className="designer-top-bar">
      <Link to="/" className="designer-top-brand" title="NTR LVR home">
        NTR LVR
      </Link>
      <AppNav variant="dark" />
      <div className="designer-top-bar-end" aria-hidden />
    </header>
  );
}

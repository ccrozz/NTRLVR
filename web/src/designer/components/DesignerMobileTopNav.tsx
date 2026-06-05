import { NavLink, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/catalog", label: "Catalog", end: true },
] as const;

export function DesignerMobileTopNav() {
  const { pathname } = useLocation();

  return (
    <nav className="designer-top-mobile-nav" aria-label="Main">
      {LINKS.map((item) => {
        const catalogActive =
          item.to === "/catalog" &&
          (pathname === "/catalog" || pathname.startsWith("/plants/"));

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              (item.to === "/catalog" ? catalogActive : isActive)
                ? "is-active"
                : undefined
            }
          >
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

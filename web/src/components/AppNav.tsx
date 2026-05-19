import { NavLink, useLocation } from "react-router-dom";

type AppNavProps = {
  variant?: "light" | "dark";
  className?: string;
};

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/catalog", label: "Catalog", end: true },
  { to: "/designer", label: "Designer", end: false },
] as const;

export function AppNav({ variant = "light", className = "" }: AppNavProps) {
  const { pathname } = useLocation();

  return (
    <nav
      className={`app-nav app-nav--${variant}${className ? ` ${className}` : ""}`}
      aria-label="Main"
    >
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
                ? "active"
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

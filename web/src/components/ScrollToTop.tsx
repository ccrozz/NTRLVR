import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset window + in-app scroll regions when the route changes. */
function resetScrollPosition() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll<HTMLElement>(".rr-app-main").forEach((el) => {
    el.scrollTop = 0;
  });
}

export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    resetScrollPosition();
  }, [pathname]);

  return null;
}

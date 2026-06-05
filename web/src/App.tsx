import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { BrowsePage } from "./pages/BrowsePage";
import { PlantDetailPage } from "./pages/PlantDetailPage";
import { RootsLanding } from "./designer/components/landing/RootsLanding";
import { DesignerPage } from "./designer/pages/DesignerPage";

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<RootsLanding />} />
      <Route path="/designer" element={<DesignerPage />} />
      <Route element={<Layout />}>
        <Route path="catalog" element={<BrowsePage />} />
        <Route path="plants/:id" element={<PlantDetailPage />} />
      </Route>
      </Routes>
    </>
  );
}

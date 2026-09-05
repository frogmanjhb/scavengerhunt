import { Navigate, Route, Routes } from "react-router-dom";
import { AdminPage } from "./pages/AdminPage";
import { ClaimPage } from "./pages/ClaimPage";
import { DisplayPage } from "./pages/DisplayPage";
import { DonePage } from "./pages/DonePage";
import { PlayPage } from "./pages/PlayPage";
import { TeamSelectPage } from "./pages/TeamSelectPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<TeamSelectPage />} />
      <Route path="/claim/:teamId" element={<ClaimPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/done" element={<DonePage />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

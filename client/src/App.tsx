import { Navigate, Route, Routes } from "react-router-dom";
import { AdminPage } from "./pages/AdminPage";
import { DisplayPage } from "./pages/DisplayPage";
import { UploadPage } from "./pages/UploadPage";
import { ClaimPage } from "./shelved/hunt/pages/ClaimPage";
import { DonePage } from "./shelved/hunt/pages/DonePage";
import { HuntAdminPage } from "./shelved/hunt/pages/HuntAdminPage";
import { HuntDisplayPage } from "./shelved/hunt/pages/HuntDisplayPage";
import { PlayPage } from "./shelved/hunt/pages/PlayPage";
import { TeamSelectPage } from "./shelved/hunt/pages/TeamSelectPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/admin" element={<AdminPage />} />

      {/* Shelved scavenger hunt — share /hunt for a future event */}
      <Route path="/hunt" element={<TeamSelectPage />} />
      <Route path="/hunt/claim/:teamId" element={<ClaimPage />} />
      <Route path="/hunt/play" element={<PlayPage />} />
      <Route path="/hunt/done" element={<DonePage />} />
      <Route path="/hunt/display" element={<HuntDisplayPage />} />
      <Route path="/hunt/admin" element={<HuntAdminPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
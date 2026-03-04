import { Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import FooterMenu from "@/components/FooterMenu";
import HomePage from "@/pages/HomePage";
import ListPage from "@/pages/ListPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto bg-slate-800">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <FooterMenu />
    </div>
  );
}

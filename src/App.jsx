import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import "./App.css";

import Home from "./pages/Home";
import Translator from "./pages/Translator";
import HistoryPanel from "./components/HistoryPanel";
import LearningModule from "./components/LearningModule"; // ✅ IMPORT THIS

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/translator" element={<Translator />} />
          <Route path="/history" element={<HistoryPanel />} />
          <Route path="/learn" element={<LearningModule />} /> {/* ✅ FIX */}
        </Routes>
      </main>
    </div>
  );
}

export default App;

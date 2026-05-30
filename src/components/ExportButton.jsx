import { useState } from "react";
import { exportToPDF, exportToText } from "../utils/exportUtils";

const ExportButton = ({ history }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      if (format === "pdf") {
        exportToPDF(history);
      } else {
        exportToText(history);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export. Please try again.");
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  if (history.length === 0) return null;

  return (
    <div className="relative">
      {/* ===== EXPORT BUTTON ===== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="
          px-4 py-2
          border border-blue-400
          text-blue-600
          rounded-lg
          bg-white
          hover:bg-blue-50
          transition
          disabled:opacity-50
          flex items-center gap-2
        "
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span>Exporting…</span>
          </>
        ) : (
          <>
            <span>📥</span>
            <span>Export</span>
          </>
        )}
      </button>

      {/* ===== DROPDOWN ===== */}
      {isOpen && !isExporting && (
        <>
          {/* Click-away backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
            <button
              onClick={() => handleExport("pdf")}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3"
            >
              <span className="text-lg">📄</span>
              <div>
                <div className="font-medium text-gray-800">PDF</div>
                <div className="text-xs text-gray-500">
                  Download as PDF file
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport("text")}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-t"
            >
              <span className="text-lg">📝</span>
              <div>
                <div className="font-medium text-gray-800">Text</div>
                <div className="text-xs text-gray-500">
                  Download as .txt file
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;

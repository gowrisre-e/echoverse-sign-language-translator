import useIndexedDB from "../hooks/useIndexedDB";
import ExportButton from "./ExportButton";

const HistoryPanel = () => {
  const {
    history,
    isLoading,
    error,
    deleteTranslation,
    clearHistory,
  } = useIndexedDB();

  const handleDelete = async (id) => {
    if (window.confirm("Delete this translation?")) {
      await deleteTranslation(id);
    }
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        "Clear all translation history? This cannot be undone."
      )
    ) {
      await clearHistory();
    }
  };

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleString();

  return (
    <div className="history-page">

      {/* ================= HEADER ================= */}
      <div className="history-header">
        <div>
          <h2>📜 Translation History</h2>
          <p>
            {history.length} translation
            {history.length !== 1 ? "s" : ""} saved locally
          </p>
        </div>

        <div className="history-actions">
          {/* Export button (blue UI handled inside ExportButton) */}
          <ExportButton history={history} />

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="history-clear"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="history-error">
          ⚠️ {error}
        </div>
      )}

      {/* ================= LOADING ================= */}
      {isLoading && (
        <div className="history-loading">
          <div className="spinner"></div>
          <p>Loading history…</p>
        </div>
      )}

      {/* ================= EMPTY STATE ================= */}
      {!isLoading && history.length === 0 && (
        <div className="history-empty">
          <span>📋</span>
          <h3>No translations yet</h3>
          <p>
            Start translating sign language to see your history here.
          </p>
        </div>
      )}

      {/* ================= HISTORY LIST ================= */}
      {!isLoading && history.length > 0 && (
        <div className="history-list">
          {history.map((entry) => (
            <div key={entry.id} className="history-item">
              <div className="history-text">
                <p>{entry.text}</p>
                <span>{formatDate(entry.timestamp)}</span>
              </div>

              <button
                className="history-delete"
                onClick={() => handleDelete(entry.id)}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ================= PRIVACY NOTICE ================= */}
      <div className="history-privacy">
        <span>🔒</span>
        <p>
          All translations are stored locally using IndexedDB.
          No data is sent to external servers.
        </p>
      </div>

    </div>
  );
};

export default HistoryPanel;

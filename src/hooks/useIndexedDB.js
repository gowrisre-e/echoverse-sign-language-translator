import { useState, useEffect, useCallback } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'echoverse-db';
const DB_VERSION = 1;
const STORE_NAME = 'translations';

export const useIndexedDB = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize database
  const getDB = useCallback(async () => {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp');
        }
      }
    });
  }, []);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Load all translations from database
  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const allRecords = await store.getAll();

      // Sort by timestamp descending (newest first)
      allRecords.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(allRecords);
    } catch (err) {
      console.error('Error loading history:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getDB]);

  // Add a translation to history
  const addTranslation = useCallback(async (text) => {
    if (!text || text.trim() === '') return null;

    try {
      setError(null);

      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        text: text.trim(),
        timestamp: Date.now()
      };

      const id = await store.add(record);
      await tx.done;

      // Refresh history
      await loadHistory();

      return { ...record, id };
    } catch (err) {
      console.error('Error adding translation:', err);
      setError(err.message);
      return null;
    }
  }, [getDB, loadHistory]);

  // Delete a translation
  const deleteTranslation = useCallback(async (id) => {
    try {
      setError(null);

      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await store.delete(id);
      await tx.done;

      // Refresh history
      await loadHistory();

      return true;
    } catch (err) {
      console.error('Error deleting translation:', err);
      setError(err.message);
      return false;
    }
  }, [getDB, loadHistory]);

  // Clear all history
  const clearHistory = useCallback(async () => {
    try {
      setError(null);

      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await store.clear();
      await tx.done;

      setHistory([]);
      return true;
    } catch (err) {
      console.error('Error clearing history:', err);
      setError(err.message);
      return false;
    }
  }, [getDB]);

  return {
    history,
    isLoading,
    error,
    addTranslation,
    deleteTranslation,
    clearHistory,
    refreshHistory: loadHistory
  };
};

export default useIndexedDB;

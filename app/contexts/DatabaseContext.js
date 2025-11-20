"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const DatabaseContext = createContext();

// Database configurations
export const DATABASES = {
  FORT_LAUDERDALE_2025: {
    id: 'fort-lauderdale-2025',
    name: 'Fort Lauderdale 2025',
    spreadsheetId: '1DUaqTthSg76kqfaY0nQ1d7sOSXF9iTMK2WfYoJwz_a4'
  },
  PANAMA_2026: {
    id: 'panama-2026',
    name: 'Panama 2026',
    spreadsheetId: '1S-vaQ6kUfG5Q-KVFBkDiA8uKU3jmGsqAq691nhiq3Ys' 
  }
};

export function DatabaseProvider({ children }) {
  const [selectedDatabase, setSelectedDatabase] = useState(DATABASES.PANAMA_2026); // Default to Panama 2026

  // Load saved database preference from localStorage on mount
  useEffect(() => {
    const savedDbId = localStorage.getItem('selectedDatabaseId');
    if (savedDbId) {
      const db = Object.values(DATABASES).find(d => d.id === savedDbId);
      if (db) {
        setSelectedDatabase(db);
      }
    }
  }, []);

  // Save to localStorage whenever selection changes
  const selectDatabase = (database) => {
    setSelectedDatabase(database);
    localStorage.setItem('selectedDatabaseId', database.id);
  };

  return (
    <DatabaseContext.Provider value={{ selectedDatabase, selectDatabase, DATABASES }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

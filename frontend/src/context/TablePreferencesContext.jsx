import React, { createContext, useContext, useState, useEffect } from "react";

const TablePreferencesContext = createContext();

export function TablePreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tablePrefs")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("tablePrefs", JSON.stringify(prefs));
  }, [prefs]);

  const setTablePrefs = (table, newPrefs) => {
    setPrefs((prev) => ({ ...prev, [table]: { ...prev[table], ...newPrefs } }));
  };

  return (
    <TablePreferencesContext.Provider value={{ prefs, setTablePrefs }}>
      {children}
    </TablePreferencesContext.Provider>
  );
}

export function useTablePreferences(table) {
  const { prefs, setTablePrefs } = useContext(TablePreferencesContext);
  return [prefs[table] || {}, (newPrefs) => setTablePrefs(table, newPrefs)];
}

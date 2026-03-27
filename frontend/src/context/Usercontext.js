import React, { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "dp_usernames"; // { "0xADDR": "username" }

const UserContext = createContext(null);

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

export function UserProvider({ children }) {
  const [registry, setRegistry] = useState(loadAll);

  const setUsername = useCallback((address, username) => {
    if (!address) return;
    const next = { ...loadAll(), [address.toLowerCase()]: username.trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setRegistry(next);
  }, []);

  const getUsername = useCallback((address) => {
    if (!address) return null;
    return registry[address.toLowerCase()] || null;
  }, [registry]);

  const resolveAddress = useCallback((usernameOrAddress) => {
    const val = usernameOrAddress?.trim();
    if (!val) return null;
    // If it's already an address, return as-is
    if (/^0x[0-9a-fA-F]{40}$/.test(val)) return val;
    // Try to resolve username → address
    const all = loadAll();
    const entry = Object.entries(all).find(
      ([, uname]) => uname.toLowerCase() === val.toLowerCase()
    );
    return entry ? entry[0] : null;
  }, []);

  const getAllUsers = useCallback(() => {
    return Object.entries(registry).map(([address, username]) => ({ address, username }));
  }, [registry]);

  return (
    <UserContext.Provider value={{ setUsername, getUsername, resolveAddress, getAllUsers, registry }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside <UserProvider>");
  return ctx;
};
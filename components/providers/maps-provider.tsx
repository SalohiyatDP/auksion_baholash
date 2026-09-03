"use client";

import * as React from "react";

// Google Maps kalitini server (runtime env) dan klientga uzatish uchun kontekst.
// Bu docker-compose'dagi runtime env bilan ishlaydi (NEXT_PUBLIC build vaqtida inline bo'lishidan farqli).
const MapsKeyContext = React.createContext<string>("");

export function MapsKeyProvider({ apiKey, children }: { apiKey: string; children: React.ReactNode }) {
  return <MapsKeyContext.Provider value={apiKey}>{children}</MapsKeyContext.Provider>;
}

export function useMapsKey(): string {
  return React.useContext(MapsKeyContext);
}

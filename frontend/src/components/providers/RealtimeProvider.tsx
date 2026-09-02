"use client";

import React, { createContext, useContext } from "react";

export interface RealtimeContextType {
  isConnected: boolean;
  lastEventTime: string | null;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastEventTime: null,
});

export const useRealtime = () => useContext(RealtimeContext);

/**
 * RealtimeProvider (SSE Decommissioned for Serverless / Cloud Compatibility)
 * 
 * In-memory real-time SSE streaming has been disabled to support serverless deployment.
 * Data synchronization across all operational views is now handled deterministically
 * via standard React Query cache invalidation upon user mutations (create, update, delete).
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeContext.Provider value={{ isConnected: false, lastEventTime: null }}>
      {children}
    </RealtimeContext.Provider>
  );
}

"use client";

import React, { createContext, useContext } from "react";

interface Settings {
    waNumber: string;
}

const SettingsContext = createContext<Settings>({ waNumber: "" });

export function SettingsProvider({ children, waNumber }: { children: React.ReactNode, waNumber: string }) {
    return (
        <SettingsContext.Provider value={{ waNumber }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);

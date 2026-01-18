"use client";

import React, { createContext, useContext } from "react";

interface Settings {
    waNumber: string;
}

const SettingsContext = createContext<Settings>({ waNumber: "" });

export function SettingsProvider({ children, waNumber: initialWaNumber }: { children: React.ReactNode, waNumber: string }) {
    const [waNumber, setWaNumber] = React.useState(initialWaNumber);

    React.useEffect(() => {
        // ALWAYS refresh from server on mount to ensure fresh priority override
        fetch("/api/global/contact")
            .then(res => res.json())
            .then(data => {
                if (data.number && data.number !== waNumber) {
                    setWaNumber(data.number);
                }
            })
            .catch(err => console.error("Failed to fetch fresh global contact:", err));
    }, []);

    return (
        <SettingsContext.Provider value={{ waNumber }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);

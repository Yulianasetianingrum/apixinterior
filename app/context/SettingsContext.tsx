"use client";

import React, { createContext, useContext } from "react";

interface Settings {
    waNumber: string;
}

const SettingsContext = createContext<Settings>({ waNumber: "" });

export function SettingsProvider({ children, waNumber: initialWaNumber }: { children: React.ReactNode, waNumber: string }) {

    // HARD FILTER: Client-side protection against ghost number
    const filterGhost = (num: string) => {
        if (!num) return "";
        const clean = num.replace(/[^\d]/g, "");
        if (clean.includes("81234567890")) {
            console.warn("BLOCKED GHOST NUMBER CLIENT-SIDE:", num);
            return "";
        }
        return num;
    };

    const [waNumber, setWaNumber] = React.useState(filterGhost(initialWaNumber));

    React.useEffect(() => {
        // Apply filter to initial prop immediately in case it wasn't caught
        const safeInitial = filterGhost(initialWaNumber);
        if (safeInitial !== waNumber) setWaNumber(safeInitial);

        // ALWAYS refresh from server on mount
        fetch("/api/global/contact")
            .then(res => res.json())
            .then(data => {
                const safeNum = filterGhost(data.number);
                if (safeNum && safeNum !== waNumber) {
                    setWaNumber(safeNum);
                }
            })
            .catch(err => console.error("Failed to fetch fresh global contact:", err));
    }, [waNumber, initialWaNumber]);

    return (
        <SettingsContext.Provider value={{ waNumber }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface AdminThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export function AdminThemeProvider({ children }: { children: ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("admin_theme");
        if (saved === "dark") {
            setIsDarkMode(true);
        }
    }, []);

    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const next = !prev;
            localStorage.setItem("admin_theme", next ? "dark" : "light");
            return next;
        });
    };

    if (!mounted) {
        // Prevent hydration mismatch by rendering nothing or a shell until client side
        return <>{children}</>;
    }

    return (
        <AdminThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </AdminThemeContext.Provider>
    );
}

export function useAdminTheme() {
    const context = useContext(AdminThemeContext);
    if (!context) {
        throw new Error("useAdminTheme must be used within AdminThemeProvider");
    }
    return context;
}

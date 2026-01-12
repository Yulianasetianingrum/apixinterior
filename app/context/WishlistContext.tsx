"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WishlistItem {
    id: number;
    slug: string;
    name: string;
    image: string | null;
    price: number;
}

interface WishlistContextType {
    items: WishlistItem[];
    addToWishlist: (item: WishlistItem) => void;
    removeFromWishlist: (itemId: number) => void;
    isInWishlist: (itemId: number) => boolean;
    toggleWishlist: (item: WishlistItem) => void;
    totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("apix_wishlist");
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load wishlist", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("apix_wishlist", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToWishlist = (item: WishlistItem) => {
        setItems((prev) => {
            if (prev.some((i) => i.id === item.id)) return prev;
            return [...prev, item];
        });
    };

    const removeFromWishlist = (itemId: number) => {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
    };

    const isInWishlist = (itemId: number) => {
        return items.some((item) => item.id === itemId);
    };

    const toggleWishlist = (item: WishlistItem) => {
        if (isInWishlist(item.id)) {
            removeFromWishlist(item.id);
        } else {
            addToWishlist(item);
        }
    };

    const totalItems = items.length;

    return (
        <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist, totalItems }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}

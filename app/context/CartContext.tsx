"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
    id: number;
    slug: string; // needed for link
    name: string;
    price: number;
    image: string | null;
    quantity: number;
    variationName?: string; // Optional: specific variation name
    variationId?: number;   // Optional: specific variation ID
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, "quantity">) => void;
    removeFromCart: (itemId: number, variationId?: number) => void;
    updateQuantity: (itemId: number, quantity: number, variationId?: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const lastAddRef = React.useRef<{ time: number, id: number }>({ time: 0, id: 0 });

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("apix_cart");
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load cart", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("apix_cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCart = (newItem: Omit<CartItem, "quantity">) => {
        const now = Date.now();
        const timeDiff = now - lastAddRef.current.time;
        const sameItem = lastAddRef.current.id === newItem.id;

        console.log('CartContext.addToCart called:', newItem, 'lastAdd:', lastAddRef.current, 'diff:', timeDiff);

        // Prevent duplicate adds of same item within 500ms
        if (sameItem && timeDiff < 500) {
            console.log('🚫 BLOCKED duplicate add within 500ms!');
            return;
        }

        lastAddRef.current = { time: now, id: newItem.id };

        setItems((prev) => {
            console.log('Current cart items:', prev);
            const existingIndex = prev.findIndex(
                (item) => item.id === newItem.id && item.variationId === newItem.variationId
            );

            if (existingIndex > -1) {
                console.log('✅ Item exists - SETTING quantity to 1');
                const updated = [...prev];
                updated[existingIndex].quantity = 1; // SET to 1, don't increment
                return updated;
            }
            console.log('New item, adding with quantity 1');
            return [...prev, { ...newItem, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: number, variationId?: number) => {
        setItems((prev) => prev.filter(
            (item) => !(item.id === itemId && item.variationId === variationId)
        ));
    };

    const updateQuantity = (itemId: number, quantity: number, variationId?: number) => {
        if (quantity < 1) {
            removeFromCart(itemId, variationId);
            return;
        }
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId && item.variationId === variationId
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

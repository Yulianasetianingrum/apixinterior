"use client";

import { useCart } from "@/app/context/CartContext";
import { formatIDR } from "@/lib/product-utils";
import Image from "next/image";
import Link from "next/link";
import { FaTrash, FaMinus, FaPlus, FaWhatsapp } from "react-icons/fa6";
import Navbar from "@/app/navbar/page"; // We can import the Server Navbar even in client page? No.
// Wait, Navbar is a server component. We can't import a Server Component into a Client Component directly in Next 13+.
// We should make this page a Server Component that renders a Client Component.

export default function CartPage() {
    // This file acts as the Client Component wrapper if we mark it "use client"
    // BUT we want the Navbar (Server Component) to show up.
    // So usually:
    // app/keranjang/page.tsx (Server) -> renders Navbar(Server) + CartContent(Client)

    // So I need to split this file.
    return null;
}

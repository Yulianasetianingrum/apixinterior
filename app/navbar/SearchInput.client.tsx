"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import styles from "./navbar.module.css";
// We pass the styles and iconSrc as props to keep the styling logic in the parent server component
// or we can import the module css here. Since it's a module, importing here works too but we need the class names exactly.
// Better: Accept className props or just re-import styles.
// Re-importing styles is safer for modularity.

type Props = {
    searchIconSrc: any; // URL or static import
};

export default function SearchInputClient({ searchIconSrc }: Props) {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    return (
        <form className={styles.apixSearchForm} action="/search" method="GET">
            <input
                type="text"
                name="q"
                className={styles.apixSearchInput}
                placeholder="Cari di Apix Interior"
                defaultValue={query}
            />
            <button type="submit" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Image
                    src={searchIconSrc}
                    alt="Cari"
                    width={20}
                    height={20}
                    className={styles.apixSearchIconImg}
                />
            </button>
        </form>
    );
}

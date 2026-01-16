"use client";

import styles from "./toko.module.css";

type Props = {
    id: number;
    deleteAction: (formData: FormData) => Promise<any>;
};

export default function DeleteSectionButton({ id, deleteAction }: Props) {
    const handleSubmit = (e: React.FormEvent) => {
        if (!confirm("Hapus section ini?")) {
            e.preventDefault();
            return;
        }
        console.log(`🚀 [Client] Sending delete request for section ID: ${id}`);
    };

    return (
        <form action={deleteAction} onSubmit={handleSubmit} style={{ display: "inline" }}>
            <input type="hidden" name="id" value={String(id)} />
            <button type="submit" className={styles.dangerButton} style={{ padding: "4px 10px", fontSize: "12px" }}>
                Hapus
            </button>
        </form>
    );
}

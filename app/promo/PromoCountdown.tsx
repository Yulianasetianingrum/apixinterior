"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function PromoCountdown({ targetDate }: { targetDate: string | Date | null }) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        if (!targetDate) return;

        const calculateTime = () => {
            const now = new Date().getTime();
            const end = new Date(targetDate).getTime();
            const distance = end - now;

            if (distance < 0) {
                return { hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            };
        };

        // Initial calc
        setTimeLeft(calculateTime());

        const interval = setInterval(() => {
            setTimeLeft(calculateTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    if (!targetDate || !timeLeft) return null;

    // Optional: Hide if expired? Or show 00:00:00? currently showing 00:00:00 if distance < 0

    return (
        <div className={styles.countdownRow}>
            <div className={styles.countdownItem}>
                <div className={styles.countdownValue}>{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className={styles.countdownLabel}>Jam</div>
            </div>
            <div className={styles.countdownDivider}>:</div>
            <div className={styles.countdownItem}>
                <div className={styles.countdownValue}>{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className={styles.countdownLabel}>Menit</div>
            </div>
            <div className={styles.countdownDivider}>:</div>
            <div className={styles.countdownItem}>
                <div className={styles.countdownValue}>{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className={styles.countdownLabel}>Detik</div>
            </div>
        </div>
    );
}

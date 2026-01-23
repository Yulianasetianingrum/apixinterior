"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface SecureImageProps extends Omit<ImageProps, "src"> {
    src?: string | null;
    fallbackToProxy?: boolean;
}

/**
 * Enhanced Image component for Apix Interior.
 * Uses next/image for automatic optimization (WebP, resizing).
 * Includes a proxy fallback for broken paths.
 */
export default function SecureImage({
    src,
    alt = "Apix Interior - Furniture & Interior Design",
    fallbackToProxy = true,
    fill,
    width,
    height,
    style,
    priority,
    loading,
    className,
    sizes,
    ...props
}: SecureImageProps) {
    const [imgSrc, setImgSrc] = useState<string | null>(src || null);
    const [hasErrored, setHasErrored] = useState(false);

    // Sync imgSrc with src prop changes
    useEffect(() => {
        setImgSrc(src || null);
        setHasErrored(false);
    }, [src]);

    if (!imgSrc) {
        return (
            <div
                className={className}
                style={{
                    backgroundColor: "#f8fafc",
                    display: "grid",
                    placeItems: "center",
                    color: "#94a3b8",
                    fontSize: "12px",
                    fontWeight: 500,
                    width: fill ? "100%" : width,
                    height: fill ? "100%" : height,
                    borderRadius: "inherit",
                    ...style,
                }}
            >
                No image
            </div>
        );
    }

    // next/image requires width/height if NOT using fill
    // We provide defaults to prevent crashes if common usage misses them
    const finalWidth = !fill && !width ? 800 : width;
    const finalHeight = !fill && !height ? 600 : height;
    // For local/internal paths, optimization might fail in restricted prod environments
    const isInternal = imgSrc.startsWith("/") || imgSrc.includes("localhost") || imgSrc.includes("127.0.0.1");

    // Performance: Pass width to internal API to rescue performance score even in unoptimized mode
    let finalSrc = imgSrc;
    if (isInternal && finalSrc.includes("/api/img?f=") && !finalSrc.includes("&w=")) {
        const w = finalWidth || 800;
        finalSrc = `${finalSrc}&w=${w}`;
    }

    return (
        <Image
            {...props}
            src={finalSrc}
            alt={alt}
            fill={fill}
            width={fill ? undefined : finalWidth}
            height={fill ? undefined : finalHeight}
            style={style}
            priority={priority}
            loading={priority ? undefined : (loading || "lazy")}
            // ENABLE OPTIMIZATION FOR INTERNAL IMAGES
            // We removed unoptimized={isInternal} so Next.js can compress them to WebP
            unoptimized={false}
            className={className}
            sizes={sizes || (fill ? "100vw" : undefined)}
            onLoadingComplete={() => {
                // If loaded via proxy successfully, we might want to track it
            }}
            onError={() => {
                if (!hasErrored && fallbackToProxy) {
                    const urlStr = String(finalSrc);
                    // Don't proxy if already proxied or base64
                    if (urlStr && !urlStr.includes("/api/img_proxy") && !urlStr.startsWith("data:")) {
                        let filename = "";
                        try {
                            const urlObj = new URL(urlStr, window.location.origin);
                            filename = urlObj.searchParams.get("f") || urlObj.pathname.split("/").pop() || "";
                        } catch {
                            filename = urlStr.split("/").pop() || "";
                        }

                        if (filename && filename.includes(".")) {
                            setHasErrored(true);
                            setImgSrc(`/api/img_proxy?file=${filename}&t=${Date.now()}`);
                            return;
                        }
                    }
                }
            }}
        />
    );
}

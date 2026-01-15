"use client";

import { useState, useEffect, ImgHTMLAttributes } from "react";

interface SecureImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    fallbackToProxy?: boolean;
}

export default function SecureImage({ src, alt, fallbackToProxy = true, ...props }: SecureImageProps) {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasErrored, setHasErrored] = useState(false);

    // Sync imgSrc with src prop changes
    useEffect(() => {
        setImgSrc(src);
        setHasErrored(false);
    }, [src]);

    if (!imgSrc) {
        return <div style={{ ...props.style, background: '#f0f0f0', display: 'grid', placeItems: 'center', color: '#999' }}>No image</div>;
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            {...props}
            src={imgSrc}
            alt={alt}
            onError={(e) => {
                if (!hasErrored && fallbackToProxy) {
                    const urlStr = String(imgSrc);
                    if (urlStr && !urlStr.includes("/api/img_proxy")) {
                        const filename = urlStr.split("/").pop();
                        if (filename) {
                            setHasErrored(true);
                            setImgSrc(`/api/img_proxy?file=${filename}&t=${Date.now()}`);
                            return;
                        }
                    }
                }
                // Call original onError if provided
                if (props.onError) {
                    props.onError(e);
                }
            }}
        />
    );
}

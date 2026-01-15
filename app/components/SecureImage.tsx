"use client";

import { useState, ImgHTMLAttributes } from "react";

interface SecureImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    fallbackToProxy?: boolean;
}

export default function SecureImage({ src, alt, fallbackToProxy = true, ...props }: SecureImageProps) {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            {...props}
            src={imgSrc}
            alt={alt}
            onError={(e) => {
                const urlStr = String(imgSrc);
                if (fallbackToProxy && urlStr && !urlStr.includes("/api/img_proxy")) {
                    const filename = urlStr.split("/").pop();
                    if (filename) {
                        // Switch to proxy with timestamp
                        setImgSrc(`/api/img_proxy?file=${filename}&t=${Date.now()}`);
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

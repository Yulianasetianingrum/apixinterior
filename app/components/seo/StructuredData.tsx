import Script from 'next/script';

interface OrganizationSchemaProps {
    name?: string;
    url?: string;
    logo?: string;
    description?: string;
    address?: {
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
        postalCode?: string;
        addressCountry?: string;
    };
    contactPoint?: {
        telephone?: string;
        contactType?: string;
        email?: string;
    };
    sameAs?: string[];
}

export function OrganizationSchema({
    name = "Apix Interior",
    url = "https://apixinterior.com",
    logo = "https://apixinterior.com/logo/logo_apixinterior_biru.png.png",
    description = "Apix Interior menyediakan furniture berkualitas, mebel custom, dan jasa desain interior profesional untuk rumah, kantor, hotel, dan bangunan komersial.",
    address,
    contactPoint,
    sameAs = [],
}: OrganizationSchemaProps = {}) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name,
        url,
        logo,
        description,
        ...(address && { address: { "@type": "PostalAddress", ...address } }),
        ...(contactPoint && { contactPoint: { "@type": "ContactPoint", ...contactPoint } }),
        ...(sameAs.length > 0 && { sameAs }),
    };

    return (
        <Script
            id="organization-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

interface ProductSchemaProps {
    name: string;
    description?: string;
    image?: string | string[];
    sku?: string;
    brand?: string;
    offers?: {
        price: number;
        priceCurrency?: string;
        availability?: string;
        url?: string;
    };
    aggregateRating?: {
        ratingValue: number;
        reviewCount: number;
    };
}

export function ProductSchema({
    name,
    description,
    image,
    sku,
    brand = "Apix Interior",
    offers,
    aggregateRating,
}: ProductSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        ...(description && { description }),
        ...(image && { image: Array.isArray(image) ? image : [image] }),
        ...(sku && { sku }),
        brand: {
            "@type": "Brand",
            name: brand,
        },
        ...(offers && {
            offers: {
                "@type": "Offer",
                price: offers.price,
                priceCurrency: offers.priceCurrency || "IDR",
                availability: offers.availability || "https://schema.org/InStock",
                ...(offers.url && { url: offers.url }),
            },
        }),
        ...(aggregateRating && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: aggregateRating.ratingValue,
                reviewCount: aggregateRating.reviewCount,
            },
        }),
    };

    return (
        <Script
            id={`product-schema-${sku || name.replace(/\s+/g, '-').toLowerCase()}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbSchemaProps {
    items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <Script
            id="breadcrumb-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

interface WebSiteSchemaProps {
    name?: string;
    url?: string;
    searchUrl?: string;
}

export function WebSiteSchema({
    name = "Apix Interior",
    url = "https://apixinterior.com",
    searchUrl = "https://apixinterior.com/produk?q={search_term_string}",
}: WebSiteSchemaProps = {}) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name,
        url,
        potentialAction: {
            "@type": "SearchAction",
            target: searchUrl,
            "query-input": "required name=search_term_string",
        },
    };

    return (
        <Script
            id="website-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

interface LocalBusinessSchemaProps {
    name?: string;
    description?: string;
    image?: string;
    telephone?: string;
    email?: string;
    address?: {
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
        postalCode?: string;
        addressCountry?: string;
    };
    geo?: {
        latitude: number;
        longitude: number;
    };
    openingHours?: string[];
    priceRange?: string;
}

export function LocalBusinessSchema({
    name = "Apix Interior",
    description = "Furniture, Mebel, dan Jasa Desain Interior Profesional",
    image = "https://apixinterior.com/logo/logo_apixinterior_biru.png.png",
    telephone,
    email,
    address,
    geo,
    openingHours = ["Mo-Sa 09:00-18:00"],
    priceRange = "$$",
}: LocalBusinessSchemaProps = {}) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "FurnitureStore",
        name,
        description,
        image,
        ...(telephone && { telephone }),
        ...(email && { email }),
        ...(address && { address: { "@type": "PostalAddress", ...address } }),
        ...(geo && {
            geo: {
                "@type": "GeoCoordinates",
                latitude: geo.latitude,
                longitude: geo.longitude,
            },
        }),
        openingHoursSpecification: openingHours.map((hours) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: hours.split(" ")[0],
            opens: hours.split(" ")[1]?.split("-")[0],
            closes: hours.split(" ")[1]?.split("-")[1],
        })),
        priceRange,
    };

    return (
        <Script
            id="local-business-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

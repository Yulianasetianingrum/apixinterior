
const normalizeMapsUrl = (raw, fallbackName) => {
    const input = String(raw || "").trim();
    if (!input) return "";
    const cleaned = input.replace(/,+\s*$/g, "");
    if (cleaned.includes("<iframe")) {
        const match = cleaned.match(/src=["']([^"']+)["']/i);
        if (match && match[1]) return match[1].trim();
    }

    try {
        const u = new URL(cleaned);
        const host = u.host.toLowerCase();
        const isGoogle = host.includes("google.") || host.includes("maps.");
        const isEmbedPath = u.pathname.includes("/maps/embed");
        const pb = u.searchParams.get("pb");
        const output = u.searchParams.get("output");

        if (isEmbedPath && pb && pb.length > 20) return cleaned;
        if (isEmbedPath && output === "embed") return cleaned;
        if (output === "embed") return cleaned;

        if (isGoogle) {
            const q =
                u.searchParams.get("q") ||
                u.searchParams.get("query") ||
                u.searchParams.get("search") ||
                "";
            const query = q || fallbackName || "";
            if (!query) return cleaned;
            return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
        }
    } catch {
        // ignore invalid URLs
    }

    return cleaned;
};

const userIframe = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.7707336605604!2d106.96402257499095!3d-6.293832693695207!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d049216585b%3A0x69c6e1c0ddbb1f1b!2sAPIX%20INTERIOR!5e0!3m2!1sid!2sid!4v1767962639406!5m2!1sid!2sid" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';

const result = normalizeMapsUrl(userIframe, "Bekasi");

console.log("Input Length:", userIframe.length);
console.log("Result:", result);
console.log("Result Length:", result.length);

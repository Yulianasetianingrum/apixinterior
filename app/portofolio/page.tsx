import Navbar from "@/app/navbar/Navbar";
import GlobalFooter from "@/app/components/GlobalFooter";
import PortfolioGallery from "@/app/components/portfolio/PortfolioGallery.client";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Portofolio Interior Design - Apix Interior",
    description: "Lihat hasil karya desain interior kami. Kumpulan proyek kitchen set, lemari, bedroom, dan living room yang telah kami kerjakan dengan kualitas terbaik.",
};

export default async function PortfolioPage() {
    // Fetch published GALLERY sections
    const sections = await prisma.homepageSectionPublished.findMany({
        where: {
            type: "GALLERY",
            enabled: true
        },
        orderBy: { sortOrder: "asc" },
    });

    // Consolidate all image IDs from all gallery sections
    let allImageIds: number[] = [];

    sections.forEach((section: any) => {
        const cfg = section.config as any;
        if (Array.isArray(cfg.imageIds)) {
            const ids = cfg.imageIds.map((x: any) => Number(x)).filter((n: number) => !Number.isNaN(n));
            allImageIds.push(...ids);
        }
    });

    // Fetch actual image data
    const images = allImageIds.length > 0
        ? await prisma.gambarUpload.findMany({
            where: { id: { in: allImageIds } }
        })
        : [];

    // Create a map for easy lookup to preserve order if needed, 
    // or just pass the images. The grid usually just simply lists them.
    // Let's passed the mapped images to ensure they match the valid IDs.

    // Dedup images just in case
    const uniqueImages = Array.from(new Map(images.map((item: any) => [item.id, item])).values());

    return (
        <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif", paddingTop: "90px" }}>
            <Navbar />

            <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 20px" }}>
                <PortfolioGallery initialImages={uniqueImages} />
            </main>

            <GlobalFooter />
        </div>
    );
}

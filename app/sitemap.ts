import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://apixinterior.com';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/produk`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
    ];

    // Fetch all products
    const products = await prisma.produk.findMany({
        select: {
            slug: true,
            createdAt: true,
        },
    });

    const productPages: MetadataRoute.Sitemap = products
        .filter((p: any) => p.slug && p.slug.trim() !== '')
        .map((product: any) => ({
            url: `${baseUrl}/produk/${product.slug}`,
            lastModified: product.createdAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

    // Fetch all categories
    const categories = await prisma.kategoriProduk.findMany({
        select: {
            slug: true,
            createdAt: true,
        },
    });

    const categoryPages: MetadataRoute.Sitemap = categories
        .filter((c: any) => c.slug && c.slug.trim() !== '')
        .map((category: any) => ({
            url: `${baseUrl}/kategori/${category.slug}`,
            lastModified: category.createdAt || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

    return [...staticPages, ...productPages, ...categoryPages];
}

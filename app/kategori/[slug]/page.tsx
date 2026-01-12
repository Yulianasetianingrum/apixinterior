
import ProductListingPage from "@/app/produk/page";
import { prisma } from "@/lib/prisma";

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = "force-dynamic";

export default async function CategoryProductPage(props: Props) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const slug = params.slug;

    // Find the category by slug to get the actual name stored in products
    const category = await prisma.kategoriProduk.findFirst({
        where: { slug: slug },
        select: { nama: true }
    });

    // If found, use the name. If not, fallback to decoding the slug (legacy behavior)
    const categoryName = category?.nama || decodeURIComponent(slug);

    // Merge the category from slug into the searchParams
    // We treat the slug as the 'cat' filter
    const mergedSearchParams = {
        ...searchParams,
        cat: categoryName
    };

    // Render the original ProductListingPage with the modified params
    return <ProductListingPage searchParams={Promise.resolve(mergedSearchParams)} />;
}

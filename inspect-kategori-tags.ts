
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Aggregate unique categories
    const categories = await prisma.produk.groupBy({
        by: ['kategori'],
        _count: {
            kategori: true
        },
        where: {
            kategori: { not: null }
        }
    })

    // Fetch some tags to see structure
    const productsWithTags = await prisma.produk.findMany({
        where: { tags: { not: null } },
        select: { tags: true },
        take: 20
    })

    console.log('Unique Categories Usage:', JSON.stringify(categories, null, 2))
    console.log('Sample Tags:', JSON.stringify(productsWithTags, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

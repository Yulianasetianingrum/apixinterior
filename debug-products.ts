
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.produk.findMany({
        select: {
            id: true,
            nama: true,
            kategori: true,
            categoryId: true
        }
    })
    console.log('Products:', JSON.stringify(products, null, 2))

    const categories = await prisma.category.findMany()
    console.log('Categories:', JSON.stringify(categories, null, 2))
}

main()
    .catch(e => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

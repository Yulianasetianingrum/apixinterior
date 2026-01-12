
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const total = await prisma.produk.count()
    const withKategori = await prisma.produk.count({
        where: {
            kategori: { not: null }
        }
    })

    const sample = await prisma.produk.findFirst({
        where: { kategori: { not: null } },
        select: { id: true, nama: true, kategori: true, categoryId: true }
    })

    console.log(`Total Products: ${total}`)
    console.log(`Products with 'kategori' string: ${withKategori}`)
    console.log('Sample:', sample)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

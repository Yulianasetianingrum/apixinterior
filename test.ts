import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log(await prisma.informasiToko.findUnique({ where: { id: 1 } }));
}
main().catch(console.error).finally(() => prisma.$disconnect());

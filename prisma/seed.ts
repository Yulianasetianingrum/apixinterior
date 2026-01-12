// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_INITIAL_USERNAME || "admin";
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!rawPassword) {
    console.error("❌ ADMIN_INITIAL_PASSWORD belum di-set di .env");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12);

  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: {
      username,
      passwordHash,
      role: "superadmin",
    },
  });

  console.log("✅ Admin seeded:", username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

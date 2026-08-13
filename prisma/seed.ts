import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME;
  const adminRole = process.env.ADMIN_ROLE as any;

  if (!adminEmail || !adminPassword || !adminName || !adminRole) {
    throw new Error("Missing required Super Admin environment variables. Please check your .env file.");
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash: passwordHash,
        role: adminRole,
        status: "Active",
      },
    });
    console.log(`Created Super Admin: ${admin.email}`);
  } else {
    console.log(`Super Admin ${adminEmail} already exists.`);
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

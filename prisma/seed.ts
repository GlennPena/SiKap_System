import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORIES, INITIAL_ALIASES } from "../src/lib/cbf-taxonomy-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed & safe taxonomy migration...");

  // 1. Super Admin Seed
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

  // 2. Safe Category Upsert: Upsert all 20 Official TESDA Categories
  console.log(`Upserting ${CATEGORIES.length} official TESDA Online Program Categories...`);
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description
      }
    });
  }
  console.log(`Successfully upserted ${CATEGORIES.length} TESDA Categories.`);

  // 3. Migrate any existing TESDAProgram references safely
  console.log("Checking and migrating existing TESDAProgram categoryId references...");
  const oldToNewMap: Record<string, string> = {
    // Old category ID mappings if previously referenced
    "1": "11", // Old "IT & Digital" -> New "11" (ICT)
    "2": "15", // Old "Food & Culinary" -> New "15" (Process Food & Beverages)
    "3": "3",  // Automotive -> Automotive
    "4": "4",  // Welding -> Construction (Cat 4)
    "5": "5",  // Electrical -> Electrical & Electronics
    "6": "4",  // Construction & Building -> Construction (Cat 4)
    "7": "17", // Hospitality & Tourism -> Tourism (Cat 17)
    "8": "2",  // Agriculture & Fishery -> Agriculture (Cat 2)
  };

  const programs = await prisma.tESDAProgram.findMany();
  for (const prog of programs) {
    if (prog.categoryId && oldToNewMap[prog.categoryId]) {
      const newCatId = oldToNewMap[prog.categoryId];
      await prisma.tESDAProgram.update({
        where: { id: prog.id },
        data: { categoryId: newCatId }
      });
      console.log(`Migrated program "${prog.title}" categoryId: ${prog.categoryId} -> ${newCatId}`);
    }
  }

  // 4. Delete old aliases before seeding clean canonical aliases to prevent orphan or stale records
  console.log("Refreshing Alias table with clean canonical taxonomy...");
  await prisma.alias.deleteMany();

  // 5. Seed new clean Aliases
  console.log(`Seeding ${INITIAL_ALIASES.length} initial Aliases...`);
  for (const aliasItem of INITIAL_ALIASES) {
    await prisma.alias.upsert({
      where: {
        alias_categoryId: {
          alias: aliasItem.alias.toLowerCase().trim(),
          categoryId: aliasItem.categoryId
        }
      },
      update: {
        normalizedValue: aliasItem.normalizedValue
      },
      create: {
        alias: aliasItem.alias.toLowerCase().trim(),
        normalizedValue: aliasItem.normalizedValue,
        categoryId: aliasItem.categoryId
      }
    });
  }
  console.log(`Successfully seeded ${INITIAL_ALIASES.length} Aliases.`);

  // 6. Clean up obsolete Category records (e.g. old simplified categories not in 1..20)
  const validCategoryIds = new Set(CATEGORIES.map(c => c.id));
  const allDbCats = await prisma.category.findMany();
  for (const dbCat of allDbCats) {
    if (!validCategoryIds.has(dbCat.id)) {
      // Check if referenced by programs
      const refProgCount = await prisma.tESDAProgram.count({ where: { categoryId: dbCat.id } });
      const refAliasCount = await prisma.alias.count({ where: { categoryId: dbCat.id } });
      if (refProgCount === 0 && refAliasCount === 0) {
        await prisma.category.delete({ where: { id: dbCat.id } });
        console.log(`Removed obsolete category "${dbCat.name}" (ID: ${dbCat.id})`);
      } else {
        console.warn(`Category "${dbCat.name}" (ID: ${dbCat.id}) still has references: ${refProgCount} progs, ${refAliasCount} aliases`);
      }
    }
  }

  console.log("Seed & taxonomy migration completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

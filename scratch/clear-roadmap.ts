import { db } from "../src/lib/db";

async function main() {
  const profile = await db.youthProfile.findFirst({
    where: {
      name: {
        contains: "Glenn",
        mode: "insensitive"
      }
    }
  });

  console.log("Found profile:", profile ? { id: profile.id, name: profile.name, hasSavedCareerPlan: !!profile.savedCareerPlan } : "None");

  if (profile) {
    await db.youthProfile.update({
      where: { id: profile.id },
      data: {
        savedCareerPlan: null
      }
    });
    console.log(`Successfully cleared savedCareerPlan for ${profile.name} (ID: ${profile.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

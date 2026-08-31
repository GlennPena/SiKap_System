import { db } from "../src/lib/db";

async function main() {
  const profiles = await db.youthProfile.findMany({
    select: {
      id: true,
      name: true,
      savedCareerPlan: true
    }
  });

  console.log("Youth profiles count:", profiles.length);
  for (const p of profiles) {
    console.log(`- Profile [${p.id}] "${p.name}": savedCareerPlan = ${p.savedCareerPlan ? p.savedCareerPlan.substring(0, 40) + "..." : "null"}`);
  }
}

main().finally(() => db.$disconnect());

import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  console.log("DB Counts:", {
    users: await p.user.count(),
    youthProfiles: await p.youthProfile.count(),
    programs: await p.tESDAProgram.count(),
    announcements: await p.sKAnnouncement.count(),
    referrals: await p.referral.count(),
    barangays: await p.barangay.count()
  });
  await p.$disconnect();
}
run();

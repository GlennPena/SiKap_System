import { 
  cleanText, 
  calculateLevenshteinSimilarity, 
  normalizeSingleInput, 
  normalizeSkills, 
  normalizePreferences, 
  normalizeExperiences, 
  normalizeGoal 
} from "../cbf-normalization";
import { 
  calculateDetailedCBFMatch, 
  calculateContentBasedMatchScore, 
  rankProgramsForYouth 
} from "../cbf-matcher";
import { YouthProfile, TESDAProgram } from "../../types";
import { StaticAlias } from "../cbf-taxonomy-data";

function runTests() {
  console.log("=================================================");
  console.log(" RUNNING SIKAP TESDA ONLINE TAXONOMY CBF TESTS   ");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
      failed++;
    }
  }

  // --- Test 1: Exact Benchmark with 20 TESDA Online Categories ---
  console.log("\n1. Test 1 — Exact 70% Benchmark & Gate Testing (TESDA Taxonomy)");
  const benchmarkYouth: YouthProfile = {
    id: "youth-1",
    name: "Juan Dela Cruz",
    age: 20,
    purok: "Purok 1",
    barangay: "San Sebastian",
    educationalAttainment: "High School Graduate",
    currentStatus: "Out-of-school",
    skills: ["Computer", "Programming", "Welding", "Cooking", "Baking"],
    interests: ["Technology"],
    sectorPreference: "Technology",
    livelihoodGoal: "I want to become an IT professional",
    skillsRaw: ["Computer", "Programming", "Welding", "Cooking", "Baking"],
    preferencesRaw: ["Technology"],
    experiencesRaw: ["Computer Shop Helper"],
    goalRaw: "I want to become an IT professional",
    contactNumber: "09123456789",
    registeredDate: "2026-09-01",
    matchScore: 0,
    soloParent: false,
    pwd: false,
    indigenous: false
  };

  const programICT: TESDAProgram = {
    id: "prog-ict",
    title: "Computer Systems Servicing NC II",
    provider: "TESDA GPSAT",
    type: "Training",
    location: "Guiguinto, Bulacan",
    trainingHours: 280,
    cost: "Free",
    slotsTotal: 25,
    slotsRemaining: 10,
    youthMatched: 0,
    eligibility: "Open to all",
    contactPerson: "Admin",
    contactNumber: "09123456789",
    activeStatus: "Active",
    categoryId: "11", // Information and Communication Technology
    category: "Information and Communication Technology"
  };

  const programSMAW: TESDAProgram = {
    id: "prog-smaw",
    title: "Shielded Metal Arc Welding (SMAW) NC II",
    provider: "TESDA GPSAT",
    type: "Training",
    location: "Guiguinto, Bulacan",
    trainingHours: 268,
    cost: "Free",
    slotsTotal: 25,
    slotsRemaining: 8,
    youthMatched: 0,
    eligibility: "Open to all",
    contactPerson: "Admin",
    contactNumber: "09123456789",
    activeStatus: "Active",
    categoryId: "4", // Construction (Metal/Welding)
    category: "Construction"
  };

  const programElectrical: TESDAProgram = {
    id: "prog-elec",
    title: "Electrical Installation and Maintenance NC II",
    provider: "TESDA GPSAT",
    type: "Training",
    location: "Guiguinto, Bulacan",
    trainingHours: 196,
    cost: "Free",
    slotsTotal: 25,
    slotsRemaining: 5,
    youthMatched: 0,
    eligibility: "Open to all",
    contactPerson: "Admin",
    contactNumber: "09123456789",
    activeStatus: "Active",
    categoryId: "5", // Electrical and Electronics
    category: "Electrical and Electronics"
  };

  const matchICT = calculateDetailedCBFMatch(benchmarkYouth, programICT);
  assert(matchICT.skillMatch === 40, "ICT Program Skill Match is 40% (2/5 skills in Cat 11)");
  assert(matchICT.skillPoints === 20, "ICT Program Skill Points is 20 (40 x 0.50)");
  assert(matchICT.preferenceMatch === 100, "ICT Program Preference Match is 100%");
  assert(matchICT.preferencePoints === 25, "ICT Program Preference Points is 25 (100 x 0.25)");
  assert(matchICT.experienceMatch === 100, "ICT Program Experience Match is 100%");
  assert(matchICT.experiencePoints === 15, "ICT Program Experience Points is 15 (100 x 0.15)");
  assert(matchICT.goalMatch === 100, "ICT Program Goal Match is 100%");
  assert(matchICT.goalPoints === 10, "ICT Program Goal Points is 10 (100 x 0.10)");
  assert(matchICT.finalScore === 70, `ICT Program Final Score is exactly 70% (Actual: ${matchICT.finalScore}%)`);
  assert(matchICT.passedSkillGate === true, "ICT Program passes Skill Relevance Gate");

  const matchSMAW = calculateDetailedCBFMatch(benchmarkYouth, programSMAW);
  assert(matchSMAW.skillMatch === 20, "SMAW Program Skill Match is 20% (1/5 skills in Cat 4)");
  assert(matchSMAW.skillPoints === 10, "SMAW Program Skill Points is 10 (20 x 0.50)");
  assert(matchSMAW.preferenceMatch === 0, "SMAW Program Preference Match is 0%");
  assert(matchSMAW.experienceMatch === 0, "SMAW Program Experience Match is 0%");
  assert(matchSMAW.goalMatch === 0, "SMAW Program Goal Match is 0%");
  assert(matchSMAW.finalScore === 10, `SMAW Program Final Score is 10% (Actual: ${matchSMAW.finalScore}%)`);
  assert(matchSMAW.passedSkillGate === true, "SMAW Program passes Skill Relevance Gate (has 1 matching skill)");

  const matchElectrical = calculateDetailedCBFMatch(benchmarkYouth, programElectrical);
  assert(matchElectrical.skillMatch === 0, "Electrical Program Skill Match is 0%");
  assert(matchElectrical.passedSkillGate === false, "Electrical Program fails Skill Relevance Gate");
  assert(matchElectrical.excluded === true, "Electrical Program is marked EXCLUDED");

  // --- Test 2: Four-Factor Weights (50 / 25 / 15 / 10) ---
  console.log("\n2. Test 2 — Four-Factor Weights Verification");
  const test2Youth: YouthProfile = {
    ...benchmarkYouth,
    skillsRaw: ["Computer"], // 1/1 = 100% skill match on ICT
    preferencesRaw: ["Technology"], // 100%
    experiencesRaw: ["Computer Shop Helper"], // 100%
    goalRaw: "IT Professional" // 100%
  };
  const test2Match = calculateDetailedCBFMatch(test2Youth, programICT);
  assert(test2Match.skillPoints === 50, "Skill Weight 50%: 100% * 0.50 = 50 pts");
  assert(test2Match.preferencePoints === 25, "Preference Weight 25%: 100% * 0.25 = 25 pts");
  assert(test2Match.experiencePoints === 15, "Experience Weight 15%: 100% * 0.15 = 15 pts");
  assert(test2Match.goalPoints === 10, "Goal Weight 10%: 100% * 0.10 = 10 pts");
  assert(test2Match.finalScore === 100, "100% on all 4 factors produces exactly 100% Final Score");

  // --- Test 3: Skill Gate (Hard Exclusion) ---
  console.log("\n3. Test 3 — Skill Gate Exclusion with 100% Pref/Exp/Goal");
  const test3Youth: YouthProfile = {
    ...benchmarkYouth,
    skillsRaw: ["Cooking"], // 0 ICT skills
    preferencesRaw: ["Technology"],
    experiencesRaw: ["Computer Shop Helper"],
    goalRaw: "Become an IT Professional"
  };
  const test3Match = calculateDetailedCBFMatch(test3Youth, programICT);
  assert(test3Match.skillMatch === 0, "0 ICT skills gives 0% skill match");
  assert(test3Match.passedSkillGate === false, "Skill Gate FAILS when Skill Match is 0%");
  assert(test3Match.excluded === true, "Program is EXCLUDED despite 100% on other 3 factors");
  assert(calculateContentBasedMatchScore(test3Youth, programICT) === 0, "calculateContentBasedMatchScore returns 0 for excluded program");

  // --- Test 4: Agriculture Normalization (Cat 2) ---
  console.log("\n4. Test 4 — Agriculture Normalization (Cat 2)");
  const agriSkills = normalizeSkills(["farming", "animal production", "fisheries"]);
  assert(agriSkills.length === 3, "3 agriculture skills normalized");
  assert(agriSkills.every(s => s.categoryId === "2"), "All agriculture inputs map to Category 2 (Agriculture)");

  // --- Test 5: Automotive Normalization (Cat 3) ---
  console.log("\n5. Test 5 — Automotive Normalization (Cat 3)");
  const autoSkills = normalizeSkills(["automotive", "motorcycle repair", "driving"]);
  assert(autoSkills.length === 3, "3 automotive skills normalized");
  assert(autoSkills.every(s => s.categoryId === "3"), "All automotive inputs map to Category 3 (Automotive and Land Transport)");

  // --- Test 6: Construction Normalization (Cat 4) ---
  console.log("\n6. Test 6 — Construction Normalization (Cat 4)");
  const constSkills = normalizeSkills(["carpentry", "masonry", "plumbing", "tile setting", "welding"]);
  assert(constSkills.length === 5, "5 construction skills normalized");
  assert(constSkills.every(s => s.categoryId === "4"), "All construction/metal inputs map to Category 4 (Construction)");

  // --- Test 7: Electrical & Electronics Normalization (Cat 5) ---
  console.log("\n7. Test 7 — Electrical and Electronics Normalization (Cat 5)");
  const elecSkills = normalizeSkills(["electrical wiring", "electronics"]);
  assert(elecSkills.length === 2, "2 electrical/electronics skills normalized");
  assert(elecSkills.every(s => s.categoryId === "5"), "All electrical inputs map to Category 5 (Electrical and Electronics)");

  // --- Test 8: ICT Normalization (Cat 11) ---
  console.log("\n8. Test 8 — ICT Normalization (Cat 11)");
  const ictSkills = normalizeSkills(["computer", "programming", "web development", "graphic design"]);
  assert(ictSkills.length === 4, "4 ICT skills normalized");
  assert(ictSkills.every(s => s.categoryId === "11"), "All ICT inputs map to Category 11 (ICT)");

  // --- Test 9: Process Food and Beverages Normalization (Cat 15) ---
  console.log("\n9. Test 9 — Process Food and Beverages Normalization (Cat 15)");
  const foodSkills = normalizeSkills(["cooking", "baking", "food processing", "food and beverage"]);
  assert(foodSkills.length === 4, "4 food skills normalized");
  assert(foodSkills.every(s => s.categoryId === "15"), "All food inputs map to Category 15 (Process Food and Beverages)");

  // --- Test 10: Tourism Normalization (Cat 17) ---
  console.log("\n10. Test 10 — Tourism Normalization (Cat 17)");
  const tourSkills = normalizeSkills(["tour guide", "housekeeping", "front office", "bartending"]);
  assert(tourSkills.length === 4, "4 tourism skills normalized");
  assert(tourSkills.every(s => s.categoryId === "17"), "All tourism inputs map to Category 17 (Tourism)");

  // --- Test 11: Multi-word Phrase Priority ---
  console.log("\n11. Test 11 — Longest / Most Specific Phrase Priority");
  const sentenceResult = normalizeSingleInput("I worked as a computer shop helper for 6 months");
  assert(sentenceResult.value === "Computer Shop Helper", `Matched 'Computer Shop Helper' over generic 'Computer' (Actual: ${sentenceResult.value})`);
  assert(sentenceResult.categoryId === "11", "Resolved to Category 11 (ICT)");

  // --- Test 12: Ambiguity Protection ---
  console.log("\n12. Test 12 — Ambiguous Generic Terms");
  const ambiguousTaxonomy: StaticAlias[] = [
    { alias: "design", normalizedValue: "Digital Design", categoryId: "11" },
    { alias: "design", normalizedValue: "Fashion Design", categoryId: "16" }
  ];
  const ambiguousResult = normalizeSingleInput("design", ambiguousTaxonomy);
  assert(ambiguousResult.isUnresolved === true, "Ambiguous term 'design' across Cat 11 and 16 is marked Unresolved");
  assert(ambiguousResult.categoryId === null, "Ambiguous term categoryId is null");

  const specificWebDesign = normalizeSingleInput("web design");
  assert(specificWebDesign.value === "Web Design" && specificWebDesign.categoryId === "11", "Specific 'web design' resolves cleanly to Cat 11");

  const fashionDesignResult = normalizeSingleInput("fashion design");
  assert(fashionDesignResult.isUnresolved === true, "Unmapped 'fashion design' in TESDA taxonomy marked isUnresolved: true");

  // --- Test 13: Canonical Deduplication ---
  console.log("\n13. Test 13 — Canonical Duplicate Handling");
  const dedupSkills = normalizeSkills(["Computer", "computer", "COMPUTER"]);
  assert(dedupSkills.length === 1, `["Computer", "computer", "COMPUTER"] deduplicates to 1 canonical skill (Actual: ${dedupSkills.length})`);
  assert(dedupSkills[0].value === "Computer", "Canonical value is 'Computer'");

  // --- Test 14: Skill Denominator (Unresolved Excluded) ---
  console.log("\n14. Test 14 — Unresolved Skills Excluded from Denominator");
  const denomSkills = normalizeSkills(["Computer", "Programming", "UnknownAstronauticsJob999"]);
  const denomResolved = denomSkills.filter(s => !s.isUnresolved && s.categoryId !== null);
  assert(denomResolved.length === 2, `Denominator counts 2 resolved skills out of 3 entered (Actual: ${denomResolved.length})`);

  // --- Test 15: Programs with categoryId = null ---
  console.log("\n15. Test 15 — Programs with categoryId = null Handled Gracefully");
  const uncategorizedProgram: TESDAProgram = {
    ...programICT,
    id: "prog-null",
    categoryId: null,
    category: undefined
  };
  const nullMatch = calculateDetailedCBFMatch(benchmarkYouth, uncategorizedProgram);
  assert(nullMatch.excluded === true, "Uncategorized program (categoryId = null) is marked EXCLUDED");
  assert(nullMatch.finalScore === 0, "Uncategorized program score is 0");

  console.log("\n=================================================");
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED `);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

async function testApiMatch() {
  try {
    const res = await fetch("http://localhost:3001/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        youth: {
          name: "Glenn Palma Peña",
          age: 21,
          skills: ["Basic computer literacy"],
          sectorPreference: "IT & Technology",
          livelihoodGoal: "Computer Servicing Technician",
          educationalAttainment: "High School Graduate",
          currentStatus: "Out of School Youth",
          barangay: "Sta. Catalina"
        },
        programs: [
          {
            id: "prog_1",
            title: "Computer Systems Servicing NC II",
            provider: "TESDA Pampanga",
            requiredSkills: ["Basic computer literacy"],
            trainingHours: 356
          }
        ],
        generateLLMAdvice: true
      })
    });

    const data = await res.json();
    console.log("Success:", data.success);
    console.log("Rationale:", data.careerAdvice);
    console.log("Bullets:", data.bulletAdvice);
  } catch (err) {
    console.error("API Test Error:", err);
  }
}

testApiMatch();

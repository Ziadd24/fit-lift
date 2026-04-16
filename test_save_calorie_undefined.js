async function test() {
  const resultData = {
    display_title: "Apple and Toast",
    meal_type: "breakfast",
    items: [],
    totals: { calories: 196, protein: 4, carbs: 46, fat: 1 },
    confidence_score: 95,
    portion_analysis: "Estimated 223g apple, 35g slice of toast",
    notes: "Light",
    client_suggestion: null,
    coach_alert: null,
    confidence: "high"
  };

  const payload = {
    member_id: undefined,
    meal: "Large apple and a piece of toast",
    result: resultData,
    category: "breakfast"
  };

  const res = await fetch("http://localhost:3000/api/calories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

test();

async function test() {
  const res = await fetch("http://localhost:3000/api/calories/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meal: "Large apple and a piece of toast" })
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}
test();

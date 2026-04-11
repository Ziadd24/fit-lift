async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/calories/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meal: "2 scrambled eggs with toast" })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();

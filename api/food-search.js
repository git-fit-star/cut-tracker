export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { q } = req.query;
  if (!q) { res.status(400).json({ error: "Missing query" }); return; }

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=15&api_key=${process.env.USDA_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("USDA API error: " + response.status);
    const data = await response.json();

    const getNutrient = (nutrients, ids) => {
      for (const id of ids) {
        const n = nutrients.find(n =>
          n.nutrientId === id ||
          n.nutrientNumber === String(id)
        );
        if (n && n.value > 0) return Math.round(n.value);
      }
      return 0;
    };

    const foods = (data.foods || [])
      .filter(f => f.foodNutrients?.length > 0)
      .slice(0, 8)
      .map(f => ({
        id:      "usda_" + f.fdcId,
        cat:     "USDA Database",
        name:    f.description.length > 60
                   ? f.description.slice(0, 60) + "…"
                   : f.description,
        serving: f.servingSize
                   ? `${f.servingSize}${f.servingSizeUnit || "g"}`
                   : "100g",
        cal: getNutrient(f.foodNutrients, [1008, 208]),
        p:   getNutrient(f.foodNutrients, [1003, 203]),
        c:   getNutrient(f.foodNutrients, [1005, 205]),
        f:   getNutrient(f.foodNutrients, [1004, 204]),
      }))
      .filter(f => f.cal > 0);

    res.status(200).json({ foods });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

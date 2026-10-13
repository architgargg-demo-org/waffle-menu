// Pure helpers for parsing and shaping menu data (no DOM access, so they can be tested in Node).

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((value) => value.trim() !== ""));
  const [header = [], ...records] = nonEmpty;
  const keys = header.map((h) => h.trim());
  return records.map((record) =>
    Object.fromEntries(keys.map((key, index) => [key, (record[index] ?? "").trim()]))
  );
}

const isTrue = (value) => String(value).toLowerCase() === "true";

// Only customer-facing fields are kept; internal columns such as cost are intentionally dropped.
export function toMenuItem(row) {
  const vegetarian = isTrue(row.vegetarian);
  const containsDairy = isTrue(row.contains_dairy);
  const containsGluten = isTrue(row.contains_gluten);
  return {
    id: row.item_id,
    category: row.category,
    name: row.item_name,
    description: row.description,
    price: Number(row.base_price_usd),
    calories: Number(row.calories),
    vegetarian,
    vegan: row.category === "Vegan" || (vegetarian && !containsDairy),
    glutenFriendly: !containsGluten,
    containsDairy,
    containsGluten,
    seasonal: isTrue(row.seasonal),
  };
}

export function categoriesInOrder(items) {
  return [...new Set(items.map((item) => item.category))];
}

export function filterItems(items, { category = "All", query = "" } = {}) {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "All" && item.category !== category) return false;
    if (!q) return true;
    return [item.name, item.description, item.category].join(" ").toLowerCase().includes(q);
  });
}

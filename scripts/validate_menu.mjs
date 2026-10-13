// Smoke test: parses data/waffle_menu.csv with the app's own parser and checks the shaped items.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { parseCsv, toMenuItem, filterItems } from "../menu.js";

const text = await readFile(new URL("../data/waffle_menu.csv", import.meta.url), "utf8");
const items = parseCsv(text).map(toMenuItem);

assert.ok(items.length > 0, "menu has items");
for (const item of items) {
  assert.ok(item.id && item.name && item.category, `item has id/name/category: ${JSON.stringify(item)}`);
  assert.ok(Number.isFinite(item.price) && item.price > 0, `${item.id} has a valid price`);
  assert.ok(Number.isFinite(item.calories) && item.calories >= 0, `${item.id} has valid calories`);
  assert.ok(!("cost" in item), "internal cost is not exposed");
}
assert.equal(items.find((i) => i.id === "WAF-001").description, "Pearl sugar, powdered sugar, maple syrup", "quoted commas parsed");
assert.ok(items.some((i) => i.seasonal), "at least one seasonal item");
assert.ok(filterItems(items, { query: "maple" }).length > 0, "search works");
assert.ok(filterItems(items, { category: "Beverage" }).every((i) => i.category === "Beverage"), "category filter works");

console.log(`Menu OK: ${items.length} items validated.`);

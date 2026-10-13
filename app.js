import { parseCsv, toMenuItem, categoriesInOrder, filterItems } from "./menu.js";

const MENU_URL = "data/waffle_menu.csv";

const CATEGORY_ICONS = {
  Classic: "🧇",
  Fruit: "🍓",
  Savory: "🍗",
  Dessert: "🍫",
  Vegan: "🌱",
  "Gluten Friendly": "🌾",
  Kids: "🧸",
  Seasonal: "🎃",
  Beverage: "☕",
};

const state = { items: [], category: "All", query: "" };

const els = {
  menu: document.getElementById("menu"),
  status: document.getElementById("status"),
  search: document.getElementById("search-input"),
  filters: document.getElementById("category-filters"),
  featured: document.getElementById("featured"),
  featuredList: document.getElementById("featured-list"),
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function badges(item) {
  const list = [];
  if (item.seasonal) list.push(["Seasonal", "seasonal"]);
  if (item.vegan) list.push(["Vegan", "vegan"]);
  else if (item.vegetarian) list.push(["Vegetarian", "vegetarian"]);
  if (item.glutenFriendly) list.push(["Gluten-friendly", "gf"]);
  if (!list.length) return null;
  return el(
    "ul",
    { class: "badges", "aria-label": "Dietary information" },
    list.map(([label, mod]) => el("li", {}, el("span", { class: `badge badge--${mod}`, text: label })))
  );
}

function allergens(item) {
  const contains = [];
  if (item.containsGluten) contains.push("gluten");
  if (item.containsDairy) contains.push("dairy");
  return contains.length ? `Contains ${contains.join(" & ")}` : "No gluten or dairy ingredients";
}

function card(item, { featured = false } = {}) {
  const headingTag = featured ? "h3" : "h4";
  return el("article", { class: `card${featured ? " card--featured" : ""}${item.seasonal ? " card--seasonal" : ""}` }, [
    el("div", { class: "card__top" }, [
      el(headingTag, { class: "card__name", text: item.name }),
      el("p", { class: "card__price" }, [
        el("span", { class: "visually-hidden", text: "Price: " }),
        currency.format(item.price),
      ]),
    ]),
    el("p", { class: "card__desc", text: item.description }),
    badges(item),
    el("p", { class: "card__meta" }, [
      el("span", { text: `${item.calories.toLocaleString()} cal` }),
      el("span", { class: "card__dot", "aria-hidden": "true", text: "·" }),
      el("span", { text: allergens(item) }),
    ]),
  ]);
}

function renderFilters() {
  const categories = ["All", ...categoriesInOrder(state.items)];
  els.filters.replaceChildren(
    ...categories.map((category) => {
      const button = el("button", {
        type: "button",
        class: "chip",
        "aria-pressed": String(category === state.category),
        "data-category": category,
      }, [
        category === "All" ? null : el("span", { "aria-hidden": "true", text: `${CATEGORY_ICONS[category] ?? "🍽️"} ` }),
        category,
      ]);
      button.addEventListener("click", () => {
        state.category = category;
        for (const chip of els.filters.querySelectorAll(".chip")) {
          chip.setAttribute("aria-pressed", String(chip.dataset.category === category));
        }
        renderMenu();
      });
      return button;
    })
  );
}

function renderFeatured() {
  const seasonal = state.items.filter((item) => item.seasonal);
  els.featured.hidden = seasonal.length === 0;
  els.featuredList.replaceChildren(...seasonal.map((item) => card(item, { featured: true })));
}

function renderMenu() {
  const visible = filterItems(state.items, state);
  const groups = categoriesInOrder(visible);

  els.menu.replaceChildren(
    ...groups.map((category) => {
      const id = `cat-${slug(category)}`;
      return el("section", { class: "category", "aria-labelledby": id }, [
        el("h3", { class: "category__title", id }, [
          el("span", { class: "category__icon", "aria-hidden": "true", text: CATEGORY_ICONS[category] ?? "🍽️" }),
          category,
        ]),
        el("div", { class: "grid" }, visible.filter((item) => item.category === category).map((item) => card(item))),
      ]);
    })
  );

  if (!visible.length) {
    els.menu.append(
      el("div", { class: "empty" }, [
        el("p", { text: "No items match your search." }),
        el("button", { type: "button", class: "chip", text: "Clear filters" }),
      ])
    );
    els.menu.querySelector(".empty button").addEventListener("click", resetFilters);
  }

  const scope = state.category === "All" ? "" : ` in ${state.category}`;
  els.status.textContent = `Showing ${visible.length} of ${state.items.length} items${scope}.`;
}

function resetFilters() {
  state.category = "All";
  state.query = "";
  els.search.value = "";
  renderFilters();
  renderMenu();
  els.search.focus();
}

async function init() {
  els.status.textContent = "Loading menu…";
  try {
    const response = await fetch(MENU_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.items = parseCsv(await response.text()).map(toMenuItem);
  } catch (error) {
    console.error("Failed to load menu", error);
    els.status.textContent = "Sorry, the menu could not be loaded. Please refresh the page.";
    return;
  }

  els.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderMenu();
  });

  renderFeatured();
  renderFilters();
  renderMenu();
}

init();

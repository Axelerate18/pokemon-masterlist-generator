"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
import Papa from "papaparse";
import DOMPurify from "dompurify";
import { SET_SYMBOLS } from "../types/set_symbols";
import { POKEMON_SPECIES } from "../types/pokemon_species";
import { TYPE_ICONS } from "../types/type_icons";
import {
  HALF_DECK_ICONS,
  HALF_DECK_ICONS_BY_SERIES,
} from "../types/half_deck_icons";
import { EXPANSION_VARIANT_ICONS } from "../types/expansion_variant_icons";
import SearchFieldDropdown from "../components/SearchFieldDropdown";
import SearchField from "@/src/components/SearchField";
import { Lexend_Tera } from "next/font/google";

function waitForAllImagesToLoad(images) {
  return Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      xdxd;
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }),
  );
}

const speciesToSlug = (name) =>
  (name || "")
    .toLowerCase()
    .replace(/é/g, "e")
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/['.]/g, "")
    .replace(/[:]/g, "")
    .replace(/\s+/g, "-");

function normalizePokemonName(value) {
  return (value || "")
    .toLowerCase()
    .replace(/é/g, "e")
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace(/\btex\b/g, "ex")
    .trim();
}

// Map of species -> canonical default form slug used by external APIs
const DEFAULT_SPECIES_FORMS = {
  meowstic: "meowstic-male",
  indeedee: "indeedee-male",
  oinkologne: "oinkologne-male",
  oricorio: "oricorio-baile",
  toxtricity: "toxtricity-amped",
  shellos: "shellos-west",
  gastrodon: "gastrodon-west",
  minior: "minior-red-meteor",
  wormadam: "wormadam-plant",
  basculin: "basculin-red-striped",
  darmanitan: "darmanitan-standard",
  meloetta: "meloetta-aria",
  aegislash: "aegislash-shield",
  shaymin: "shaymin-land",
  wishiwashi: "wishiwashi-solo",
  lycanroc: "lycanroc-midday",
};

function getPreferredExpansionSymbolSrc(originalUrl) {
  if (!originalUrl) return { preferred: null, fallback: null };

  // Extract code from: https://images.pokemontcg.io/<code>/symbol.png
  const match = originalUrl.match(/\/([a-z0-9]+)\/symbol\.png/i);
  const code = match ? match[1].toLowerCase() : null;

  if (!code) return { preferred: null, fallback: originalUrl };

  // Only try trimmed for modern rectangle-style codes.
  // sv...  (SV era), me... (Mega Evolution era), mcd... (McDonald's)
  const isRectangleStyle =
    /^([a-z]?sv)/.test(code) || code.startsWith("me") || code.startsWith("mcd");

  if (!isRectangleStyle) return { preferred: null, fallback: originalUrl };

  return {
    preferred: `/set-symbols/trimmed/${code}.png`,
    fallback: originalUrl,
  };
}

const setLogos = Object.fromEntries(
  Object.entries(SET_SYMBOLS).map(([name, symbolUrl]) => {
    const logoUrl = symbolUrl.replace("/symbol.png", "/logo.png");
    return [name, logoUrl];
  }),
);

function getHalfDeckIcon(expansion, series) {
  const cleanSeries = (series || "").trim().toUpperCase();

  // EX/XY special cases
  if (HALF_DECK_ICONS_BY_SERIES[expansion]) {
    const icons = HALF_DECK_ICONS_BY_SERIES[expansion];
    if (icons[cleanSeries]) return icons[cleanSeries];
  }

  // Simple 1:1 cases
  return HALF_DECK_ICONS[expansion] || null;
}

const WOTC_SETS = new Set([
  "Base Set",
  "Jungle",
  "Fossil",
  "Base Set 2", // ← but we will EXEMPT this one later
  "Team Rocket",
  "Black Star Promo",
  "Gym Heroes",
  "Gym Challenge",
  "Neo Genesis",
  "Neo Discovery",
  "Neo Revelation",
  "Neo Destiny",
  "Legendary Collection",
  "Expedition Base Set",
  "Aquapolis",
  "Skyridge",
]);

const RECT_SYMBOL_HEIGHT_PX = 14; // visual height of rectangle-style symbols
const RECT_SYMBOL_WIDTH_PX = 24; // visual width of rectangle-style symbols

function parseExpansionName(expansionName = "") {
  const raw = (expansionName || "").trim();

  const tags = [];
  let base = raw;

  // Strip ALL trailing "(...)" groups, e.g. "SV Black Star Promo (PP)" -> "SV Black Star Promo"
  while (/\s*\([^)]*\)\s*$/.test(base)) {
    const m = base.match(/\s*\(([^)]*)\)\s*$/);
    if (!m) break;
    tags.unshift(m[1].trim());
    base = base.replace(/\s*\([^)]*\)\s*$/, "").trim();
  }

  return { raw, base, tags };
}

function getSymbolsForExpansion(expansionName) {
  const { raw: name, base: baseName } = parseExpansionName(expansionName);

  // New-style rectangle promos (S&V + ME) – allow suffix variants like "(PP)"
  if (baseName === "SV Black Star Promo") {
    return ["/set-symbols/trimmed/svp.png"];
  }

  if (baseName === "ME Black Star Promo") {
    return ["/set-symbols/trimmed/mep.png"];
  }

  // Older Black Star Promos – use the classic universal star symbol
  if (/black star promo/i.test(baseName)) {
    return [setSymbols["Black Star Promo"]].filter(Boolean);
  }

  // ...keep the rest of your function as-is, but whenever you do:
  // const baseName = name.split(" (")[0];
  // you can reuse the baseName we computed above.

  // Pokémon TCG Classic variant symbols (trimmed rectangles)
  if (/^pokémon tcg classic/i.test(name)) {
    const classicMap = {
      "Pokémon TCG Classic (Venusaur)": "clv",
      "Pokémon TCG Classic (Charizard)": "clc",
      "Pokémon TCG Classic (Blastoise)": "clb",
    };

    const code = classicMap[name];
    if (code) return [`/set-symbols/trimmed/${code}.png`];
  }

  // Special case: show both Hidden Fates and Shiny Vault symbols
  if (name === "Hidden Fates (Shiny Vault)") {
    return [setSymbols["Hidden Fates"], setSymbols["Shiny Vault"]].filter(
      Boolean,
    );
  }

  // Special case: treat Shining Fates (Shiny Vault) as normal Shining Fates
  if (name === "Shining Fates (Shiny Vault)") {
    return [setSymbols["Shining Fates"]].filter(Boolean);
  }

  // Default case
  return [setSymbols[baseName]].filter(Boolean);
}
function getLogoForExpansion(expansionName) {
  const { raw: name, base: baseName } = parseExpansionName(expansionName);

  if (/black star promo/i.test(baseName)) {
    return setLogos["Black Star Promo"];
  }

  if (/^pokémon tcg classic/i.test(name)) {
    return "/icons/TCG_Classic_Logo.png";
  }

  if (/^my first battle/i.test(name)) {
    return "/icons/My_First_Battle_Logo.png";
  }

  return setLogos[baseName] || null;
}

// Lowercase "ex" icon mapping by Series code (uppercase).
// If a series isn't listed here, lowercase "ex" stays as plain text.
const EX_ICON_BY_SERIES = {
  "S&V": "/icons/ex_SV.png",
};

// Series that use the uniform rarity system (icons make sense)
const UNIFORM_RARITY_SERIES = new Set(["s&v", "me"]);

// Scarlet & Violet rarity icons
const svRarityIcons = {
  Common: "/icons/Rarity_C.png",
  Uncommon: "/icons/Rarity_U.png",
  Rare: "/icons/Rarity_R.png",
  "Double Rare": "/icons/Rarity_DR.png",
  "Illustration Rare": "/icons/Rarity_IR.png",
  "Shiny Rare": "/icons/Rarity_SR.png",
  "Ultra Rare": "/icons/Rarity_UR.png",
  "Special Illustration Rare": "/icons/Rarity_SIR.png",
  "Shiny Ultra Rare": "/icons/Rarity_SUR.png",
  "Hyper Rare": "/icons/Rarity_HR.png",
  "Mega Hyper Rare": "/icons/Rarity_MHR.png",
  "Black White Rare": "/icons/Rarity_BW.png",
  "ACE SPEC Rare": "/icons/Rarity_AS.png",
  "Mega Attack Rare": "/icons/Rarity_MAR.png",
};

function renderCardNameWithSymbols(
  cardName,
  row = {},
  overrideSymbolFlags = {},
) {
  if (!cardName) return "";

  // --- Hardcoded multi-type Energy cards ---
  const lower = cardName.toLowerCase().trim();

  // --- Ultra Beast list for GX symbol color override ---
  const ultraBeasts = [
    "poipole",
    "naganadel",
    "buzzwole",
    "pheromosa",
    "xurkitree",
    "celesteela",
    "kartana",
    "guzzlord",
    "nihilego",
    "necrozma",
    "stakataka",
    "blacephalon",
  ];

  // Normalize name for checking
  const baseName = lower.replace(/-gx| ex| vstar| vmax| etc./g, "").trim();

  // Detect if this is an Ultra Beast card
  const isUltraBeast = ultraBeasts.some((ub) => baseName.includes(ub));

  // Flag for GX replacement later
  const isUltraBeastGX = isUltraBeast && lower.includes("gx");

  // --- Special exception: Holon Energy GL must NOT trigger GL icon ---
  if (lower === "holon energy gl") {
    // Return the literal name, untouched
    return "Holon Energy GL";
  }

  // Helper: render a sequence of energy icons from typeIcons
  function energy(types) {
    return types
      .map((t) => {
        const src = TYPE_ICONS[t];
        if (!src) return "";
        return `<img src="${src}" class="inline-symbol" alt="${t} energy" />`;
      })
      .join("");
  }

  // Map of exact card names → base label + energy types
  const energyCardMap = {
    // Blend Energy
    "blend energy grpd": {
      base: "Blend Energy",
      types: ["Grass", "Fire", "Psychic", "Darkness"],
    },
    "blend energy wlfm": {
      base: "Blend Energy",
      types: ["Water", "Lightning", "Fighting", "Metal"],
    },

    // Unit Energy
    "unit energy grw": {
      base: "Unit Energy",
      types: ["Grass", "Fire", "Water"],
    },
    "unit energy lpm": {
      base: "Unit Energy",
      types: ["Lightning", "Psychic", "Metal"],
    },
    "unit energy fdy": {
      base: "Unit Energy",
      types: ["Fighting", "Darkness", "Fairy"],
    },
  };

  const energyConfig = energyCardMap[lower];

  if (energyConfig) {
    // Return *only* the hardcoded energy rendering for these cards
    // This avoids triggering GL / G / C / V Pokémon badge logic
    return `${energyConfig.base} ${energy(energyConfig.types)}`;
  }

  const symbolMap = {
    GoldStar: "/icons/GoldStar.png",
    EX: "/icons/EX_BW_XY.png", // uppercase EX only
    BREAK: "/icons/Break.png",
    GX: isUltraBeastGX ? "/icons/GX_red.png" : "/icons/GX_blue.png",
    LEGEND: "/icons/Legend.png",
    Mega: "/icons/Mega.png",
    PrismStar: "/icons/Prism_Star.png",
    "V-Union": "/icons/V-union.png",
    Vmax: "/icons/Vmax.png",
    Vstar: "/icons/Vstar.png",
    V: "/icons/V.png",
    C: "/icons/C.png",
    E4: "/icons/E4.png",
    FB: "/icons/FB.png",
    G: "/icons/G.png",
    GL: "/icons/GL.png",
  };

  // Normalized series info
  const seriesRaw = row["Series"] || "";
  const series = seriesRaw.toLowerCase();
  const seriesCode = seriesRaw.trim().toUpperCase();

  const categoryRaw = (row["Category"] || "").trim().toLowerCase();
  const isPokemonCard = categoryRaw === "pokémon" || categoryRaw === "pokemon";
  const allowMegaIcon = seriesCode === "XY" && isPokemonCard;

  const lowerName = (cardName || "").toLowerCase();

  const skipSymbols =
    overrideSymbolFlags.skipCGVSymbols ||
    lowerName === "unown c" ||
    lowerName === "unown g" ||
    (lowerName === "unown v" && !series.includes("sw&sh"));

  const sortedKeys = Object.keys(symbolMap).sort((a, b) => b.length - a.length);

  let processed = cardName;

  // --- Tera ex symbol logic (tex marker) ---
  if (/\btex\b/i.test(lowerName)) {
    const imgTag = `<img src="/icons/ex_Tera.png" class="inline-symbol" alt="tera ex icon" />`;
    processed = processed.replace(/\btex\b/gi, imgTag);
    return processed;
  }

  // --- Lowercase "ex" symbol logic by series ---
  let exIcon = EX_ICON_BY_SERIES[seriesCode];

  // ME nuance: ME ex icon is only for Mega Pokémon; non-Mega ex in ME uses the S&V ex icon
  if (seriesCode === "ME") {
    const hasMegaWord = /\bmega\b/.test(lowerName);
    exIcon = hasMegaWord ? "/icons/ex_ME.png" : "/icons/ex_SV.png";
  }

  if (exIcon && /\bex\b/.test(lowerName)) {
    const imgTag = `<img src="${exIcon}" class="inline-symbol" alt="ex icon" />`;
    processed = processed.replace(/\bex\b/g, imgTag);
    return processed;
  }

  // --- Generic symbol replacement (XY Mega, old EX, Gold Star, etc.) ---
  sortedKeys.forEach((key) => {
    if (skipSymbols && ["C", "G", "V"].includes(key)) {
      return; // skip these 3 if flag is set
    }

    // Prevent Trainer cards like "Mega Signal" from triggering the XY Mega icon.
    // Only allow the Mega icon for Pokémon cards in the XY era.
    if (key === "Mega" && !allowMegaIcon) {
      return;
    }

    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(?<![\\w-])${escapedKey}(?![\\w-])`, "g");
    const imgTag = `<img src="${symbolMap[key]}" class="inline-symbol" alt="${key} icon" />`;
    processed = processed.replace(regex, imgTag);
  });

  return processed;
}

function renderTypeWithSymbols(typeText) {
  if (!typeText) return "";

  let types = [];

  if (typeText.startsWith("Dual ")) {
    types = typeText.replace("Dual ", "").split("/");
  } else {
    types = [typeText];
  }

  return `
  <div class="type-wrapper">
    ${types
      .map((type) => {
        const src = TYPE_ICONS[type.trim()];
        return src
          ? `<img src="${src}" alt="${type}" title="${type}" style="height: 16px;" />`
          : type;
      })
      .join("")}
  </div>
`;
}

function extractPokemonName(cardName) {
  return cardName
    .replace(
      /\b(Mega|Shiny|EX|GX|VSTAR|VMAX|BREAK|LEGEND|Prism Star|V-UNION|G|GL|C|FB|E4|Lv\.X|δ|STAR|Promo|Forme|Basic|Restored)\b/gi,
      "",
    )
    .replace(/[^\w\s-]/gi, "") // keep letters, spaces, and hyphens
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-"); // turn spaces into hyphens
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getExpansionSymbolHeight(expansionName) {
  const baseName = (expansionName || "").split(" (")[0];
  const isWotc = WOTC_SETS.has(baseName) && baseName !== "Base Set 2";
  return isWotc ? "14px" : "18px";
}

const CardTable = React.memo(
  function CardTable({
    displayedData,
    tableRef,
    shouldUseRarityIcons,
    minWidths,
  }) {
    return (
      <table ref={tableRef}>
        <colgroup>
          {[...Array(10)].map((_, i) => (
            <col
              key={i}
              style={{
                width: `var(--col-width-${i})`,
                minWidth: `${minWidths[i]}px`,
              }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>Series</th>
            <th>Expansion</th>
            <th>Card Name</th>
            <th>Set Number</th>
            <th>Rarity</th>
            <th>Category</th>
            <th>Type</th>
            <th>Variant</th>
            <th>Release</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {displayedData.map((row, i) => {
            const setNumber =
              (row["Set number"] || "") + (row["Set size"] || "");

            const isEmpty = (value) =>
              !value || value.toString().trim().length === 0;

            const renderCell = (value, className = "") => {
              if (isEmpty(value)) {
                return (
                  <td className={`empty-cell ${className}`} key={Math.random()}>
                    {"\u00A0"}
                  </td>
                );
              }
              return (
                <td className={className} key={Math.random()}>
                  {value}
                </td>
              );
            };

            const rawExpansion = row["Expansion"] || "";

            return (
              <tr key={i}>
                {renderCell(row["Series"], "series")}
                <td className="expansion">
                  {getSymbolsForExpansion(rawExpansion).map((url, j) => {
                    const { preferred, fallback } =
                      getPreferredExpansionSymbolSrc(url);
                    const initialSrc = preferred || fallback || url;

                    // Treat anything coming from /set-symbols/trimmed/ as a rectangle too
                    // (this catches SVP/MEP and your Classic/McD/ME trimmed icons).
                    const isRect =
                      !!preferred ||
                      (typeof initialSrc === "string" &&
                        initialSrc.startsWith("/set-symbols/trimmed/"));

                    const handleError = (e) => {
                      // Only attempt fallback if we started with a preferred trimmed path
                      if (
                        preferred &&
                        fallback &&
                        e.currentTarget.getAttribute("src") === preferred
                      ) {
                        e.currentTarget.setAttribute("src", fallback);
                      }
                    };

                    if (isRect) {
                      return (
                        <span
                          key={j}
                          className="rect-symbol-box"
                          style={{
                            height: `${RECT_SYMBOL_HEIGHT_PX}px`,
                            width: `${RECT_SYMBOL_WIDTH_PX}px`,
                          }}
                        >
                          <img
                            src={initialSrc}
                            alt={`${rawExpansion} symbol`}
                            onError={handleError}
                          />
                        </span>
                      );
                    }

                    return (
                      <img
                        key={j}
                        src={initialSrc}
                        alt={`${rawExpansion} symbol`}
                        className="set-symbol"
                        onError={handleError}
                        style={{
                          height: getExpansionSymbolHeight(rawExpansion),
                          width: "auto",
                        }}
                      />
                    );
                  })}

                  {/* Trainer Kit Half Deck icons */}
                  {(() => {
                    const halfIcon = getHalfDeckIcon(
                      rawExpansion,
                      row["Series"],
                    );
                    if (!halfIcon) return null;

                    const baseName = rawExpansion;
                    const series = (row["Series"] || "").toUpperCase();

                    // EX Latios/Latias should be slightly smaller
                    const isEXLatiosLatias =
                      (baseName === "Latios Half Deck" ||
                        baseName === "Latias Half Deck") &&
                      series === "EX";

                    const size = isEXLatiosLatias ? "16px" : "20px";

                    return (
                      <img
                        src={halfIcon}
                        className="set-symbol"
                        style={{ height: size, width: "auto" }}
                      />
                    );
                  })()}

                  {rawExpansion}
                </td>

                {(() => {
                  const cardName = row["Card Name"] || "";

                  // Extract the base species name (strip ex, V, GX, etc.)
                  const baseName = cardName.split(/[\s-]/)[0]; // Good enough for 99.9%

                  // Lookup in the species array
                  const speciesIndex = POKEMON_SPECIES.indexOf(baseName);

                  const series = (row["Series"] || "").toLowerCase();
                  const lowerName = cardName.toLowerCase();

                  const skipCGVSymbols =
                    lowerName === "unown c" ||
                    lowerName === "unown g" ||
                    (lowerName === "unown v" && !series.includes("sw&sh"));

                  return (
                    <td
                      className="card-name"
                      data-html={DOMPurify.sanitize(
                        renderCardNameWithSymbols(cardName, row, {
                          skipCGVSymbols,
                        }),
                      )}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            renderCardNameWithSymbols(cardName, row, {
                              skipCGVSymbols,
                            }),
                          ),
                        }}
                      />
                    </td>
                  );
                })()}
                {renderCell(setNumber, "setNumber")}
                <td className="rarity">
                  {shouldUseRarityIcons && svRarityIcons[row["Rarity"]] ? (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <img
                        src={svRarityIcons[row["Rarity"]]}
                        alt={row["Rarity"]}
                        className="inline-symbol"
                        style={{ height: "18px" }}
                      />
                    </div>
                  ) : (
                    row["Rarity"]
                  )}
                </td>

                {renderCell(row["Category"], "category")}
                <td className="type">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        renderTypeWithSymbols(row["Type"]),
                      ),
                    }}
                  />
                </td>
                {renderCell(row["Variant"], "variant")}
                {renderCell(row["Release"], "release")}
                {renderCell(row["Notes"], "notes")}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  },
  (prevProps, nextProps) => {
    // ✅ RE-RENDER ONLY IF THE ACTUAL DATA SHOWN CHANGES
    return prevProps.displayedData === nextProps.displayedData;
  },
);

const SuggestionList = React.memo(function SuggestionList({
  visible,
  list,
  position,
  onSelect,
  highlightIndex,
}) {
  if (!visible || list.length === 0) return null;

  return ReactDOM.createPortal(
    <ul
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        width: position.width,
        background: "white",
        border: "1px solid #ddd",
        zIndex: 9999,
        listStyle: "none",
        margin: 0,
        padding: 0,
        maxHeight: "200px",
        overflowY: "auto",
      }}
    >
      {list.map((exp, i) => (
        <li
          key={exp}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "14px",
            background: i === highlightIndex ? "#e6f2ff" : "white",
          }}
          onMouseDown={() => onSelect(exp)}
        >
          {exp}
        </li>
      ))}
    </ul>,
    document.getElementById("floating-suggestions-root"),
  );
});

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pokemonId, setPokemonId] = useState(null);
  const [suggestionPos, setSuggestionPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const containerRef = useRef(null);
  const tableRef = useRef(null);
  const generateButtonRef = useRef(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const DISCORD_INVITE_URL = "https://discord.gg/qvV29kWW7B";

  const BASE_FONT_SIZE = 14;
  const fontSize = BASE_FONT_SIZE;
  const [activeSearch, setActiveSearch] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [suggestions, setSuggestions] = useState({
    list: [],
    visible: false,
  });
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const [dropdownSelection, setDropdownSelection] = useState("Card Name");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const updateSuggestionPos = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) {
        setSuggestionPos({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    if (suggestions.visible) {
      updateSuggestionPos();
      window.addEventListener("scroll", updateSuggestionPos, true);
      window.addEventListener("resize", updateSuggestionPos);
    }

    return () => {
      window.removeEventListener("scroll", updateSuggestionPos, true);
      window.removeEventListener("resize", updateSuggestionPos);
    };
  }, [suggestions.visible]);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1) Get short-lived token
        const tokenRes = await fetch("/api/token", { cache: "no-store" });
        if (!tokenRes.ok)
          throw new Error(`Token error! status: ${tokenRes.status}`);
        const tokenJson = await tokenRes.json();
        const token = tokenJson.token;

        // 2) Fetch cards using Authorization header
        const res = await fetch("/api/cards", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setData(data.cards);

        const cleanedExpansions = [
          ...new Set(
            data.cards
              .map((row) => row["Expansion"])
              .filter(Boolean)
              .map((exp) => exp.split(" (")[0].trim()),
          ),
        ].sort();

        setExpansionSuggestions(cleanedExpansions);
      } catch (err) {
        console.error("Error loading card data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    // Only run when the user is searching by Card Name and there is input
    if (dropdownSelection !== "Card Name" || !searchInput) {
      setSearchInput("");
      setPokemonId(null);
      return;
    }

    const slug = speciesToSlug(searchInput);
    if (!slug) {
      setPokemonId(null);
      return;
    }

    const controller = new AbortController();

    async function fetchSprite() {
      const candidates = [slug];
      const fallback = DEFAULT_SPECIES_FORMS[slug];
      if (fallback && fallback !== slug) candidates.push(fallback);

      for (const s of candidates) {
        try {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${s}`, {
            signal: controller.signal,
          });
          if (!res.ok) continue;

          const json = await res.json();
          setPokemonId(json.id);

          return;
        } catch (err) {
          if (err.name === "AbortError") return; // cancelled
          // otherwise try the next candidate
        }
      }

      setPokemonId(null);
    }

    fetchSprite();

    return () => controller.abort();
  }, [searchInput, dropdownSelection]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [suggestions.list]);

  useEffect(() => {
    if (inputRef.current && searchInput !== "") {
      // Highlight all text
      inputRef.current.select();
    }
  }, [dropdownSelection]);

  // Resize handler to adjust font size based on widest content in each column

  const displayedData = React.useMemo(() => {
    return searchPerformed ? filteredData : data;
  }, [searchPerformed, filteredData, data]);

  // If even ONE visible row is from a pre-uniform series, disable rarity icons
  const hasPreUniformRows = displayedData.some((row) => {
    const series = (row["Series"] || "").trim().toLowerCase();
    return !UNIFORM_RARITY_SERIES.has(series);
  });

  const shouldUseRarityIcons = !hasPreUniformRows;

  const handleSelectSuggestion = React.useCallback((exp) => {
    setSearchInput(exp);
    setSuggestions({ list: [], visible: false });
  }, []);

  // number of visible table columns
  const columnCount = 10;

  const latestReleaseDate = useMemo(() => {
    if (!data.length) return null;

    const dates = data
      .map((row) => row["Release"])
      .filter(Boolean)
      .map((str) => new Date(str))
      .filter((d) => !isNaN(d));

    if (!dates.length) return null;

    const latest = new Date(Math.max(...dates));
    return latest.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, [data]);

  useLayoutEffect(() => {
    if (!searchPerformed) return;
    if (!filteredData || filteredData.length === 0) return; // skip measuring when no rows
    if (
      !containerRef.current ||
      !tableRef.current ||
      displayedData.length === 0
    )
      return;

    const containerWidth = containerRef.current.clientWidth;

    const measureTable = async () => {
      const clone = tableRef.current.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.visibility = "hidden";
      clone.style.height = "auto";
      clone.style.width = "auto";
      clone.style.whiteSpace = "nowrap";
      clone.style.fontSize = BASE_FONT_SIZE + "px";
      clone.style.borderCollapse = "collapse";
      document.body.appendChild(clone);

      const colCount = clone.querySelectorAll("thead th").length;
      const maxColWidths = new Array(colCount).fill(0);
      const wrapperList = [];

      // Measure all columns except Card Name (col 2)
      // Measure all columns except Card Name (col 2)
      for (let colIndex = 0; colIndex < colCount; colIndex++) {
        if (colIndex === 2) continue; // Skip Card Name

        const th = clone.querySelector(`thead th:nth-child(${colIndex + 1})`);
        const tds = clone.querySelectorAll(
          `tbody tr td:nth-child(${colIndex + 1})`,
        );

        let maxWidth = 0;

        const measureHTMLWidth = (html, isHeader = false) => {
          const wrapper = document.createElement("div");
          wrapper.innerHTML = html;
          wrapper.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: nowrap;
      font-size: ${BASE_FONT_SIZE}px;
      font-family: inherit;
      font-weight: ${isHeader ? "bold" : "normal"};
      padding: 4px 8px;
      display: inline-block;
    `;
          document.body.appendChild(wrapper);
          const width = wrapper.offsetWidth;
          wrapper.remove();
          return width;
        };

        if (th) {
          maxWidth = Math.max(maxWidth, measureHTMLWidth(th.innerText, true));
        }

        // For expansion column: dynamically inject + wait for image load
        if (colIndex === 1) {
          const wrappers = [];

          tds.forEach((cell, rowIndex) => {
            const expansion = displayedData[rowIndex]?.["Expansion"] || "";
            const symbols = getSymbolsForExpansion(expansion);
            const baseSymbolsHTML = symbols
              .map((url) => {
                const h = getExpansionSymbolHeight(expansion);
                const { preferred, fallback } =
                  getPreferredExpansionSymbolSrc(url);
                const src = preferred || fallback || url;

                const isRect =
                  !!preferred ||
                  (typeof src === "string" &&
                    src.startsWith("/set-symbols/trimmed/"));

                if (isRect) {
                  // Match the fixed rectangle box used in the real table
                  return `<span class="rect-symbol-box" style="height:${h};width:34px;margin-right:0.375em;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;">
                <img src="${src}" style="height:100%;width:100%;object-fit:contain;display:block;"
                     onerror="if('${fallback}' && this.src!=='${fallback}') this.src='${fallback}';" />
              </span>`;
                }

                // Non-rectangle symbols: measure as normal img with height rule
                return `<img src="${src}" class="set-symbol" style="height:${h};width:auto;"
                 onerror="if('${fallback}' && this.src!=='${fallback}') this.src='${fallback}';" />`;
              })
              .join("");

            // 🔹 Half Deck icon (depends on Expansion + Series)
            const series = displayedData[rowIndex]?.["Series"] || "";
            const halfIcon = getHalfDeckIcon(expansion, series);
            const baseName = expansion;
            const cleanSeries = (series || "").toUpperCase();

            const isEXLatiosLatias =
              (baseName === "Latios Half Deck" ||
                baseName === "Latias Half Deck") &&
              cleanSeries === "EX";

            const size = isEXLatiosLatias ? "16px" : "20px";

            const halfIconHTML = halfIcon
              ? `<img src="${halfIcon}" class="set-symbol" style="height:${size};width:auto;" />`
              : "";

            const content = baseSymbolsHTML + halfIconHTML + expansion;

            const wrapper = document.createElement("div");
            wrapper.innerHTML = content;
            wrapper.style.position = "absolute";
            wrapper.style.visibility = "hidden";
            wrapper.style.whiteSpace = "nowrap";
            wrapper.style.fontSize = "14px";
            wrapper.style.fontFamily = "inherit";
            wrapper.style.padding = "4px 8px";
            document.body.appendChild(wrapper);
            wrappers.push(wrapper);
          });

          // Wait for all images to load
          const allImages = wrappers.flatMap((wrapper) =>
            Array.from(wrapper.querySelectorAll("img")),
          );

          await Promise.all(
            allImages.map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              });
            }),
          );

          // Measure wrappers
          wrappers.forEach((wrapper) => {
            const width = wrapper.offsetWidth;
            maxWidth = Math.max(maxWidth, width);
            wrapper.remove();
          });
        } else {
          // All other columns
          tds.forEach((cell, rowIndex) => {
            const content = cell.innerHTML;
            maxWidth = Math.max(maxWidth, measureHTMLWidth(content));
          });
        }

        maxColWidths[colIndex] = maxWidth + (colIndex === 1 ? 6 : 0);
      }

      // Measure Card Name (col 2) with symbols rendered
      const cardNameIndex = 2;
      const tds = clone.querySelectorAll(
        `tbody tr td:nth-child(${cardNameIndex + 1})`,
      );
      // Collect all card name wrappers first
      for (let rowIndex = 0; rowIndex < tds.length; rowIndex++) {
        const rawName = displayedData[rowIndex]["Card Name"] || "";
        const series = (displayedData[rowIndex]["Series"] || "").toLowerCase();
        const lowerName = rawName.toLowerCase();

        const skipCGVSymbols =
          lowerName === "unown c" ||
          lowerName === "unown g" ||
          (lowerName === "unown v" && !series.includes("sw&sh"));

        const html = renderCardNameWithSymbols(
          rawName,
          displayedData[rowIndex],
          { skipCGVSymbols },
        );

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        wrapper.className = "card-name-measure-wrapper";
        document.body.appendChild(wrapper);
        wrapperList.push(wrapper);
      }

      // ✅ Wait for all images in card name wrappers to load
      const allImages = wrapperList.flatMap((wrapper) =>
        Array.from(wrapper.querySelectorAll("img")),
      );
      await Promise.all(
        allImages.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );

      // ✅ Measure all wrapper widths after images are loaded
      wrapperList.forEach((wrapper) => {
        const width = wrapper.offsetWidth;
        maxColWidths[cardNameIndex] = Math.max(
          maxColWidths[cardNameIndex],
          width,
        );
        wrapper.remove();
      });

      // ✅ Remove cloned table after measuring
      document.body.removeChild(clone);

      // ✅ Give leftover space to Notes column (last column)
      const totalWidth = maxColWidths.reduce((a, b) => a + b, 0);
      const containerWidth = containerRef.current.clientWidth;
      const notesIndex = maxColWidths.length - 1;
      if (totalWidth < containerWidth) {
        maxColWidths[notesIndex] += containerWidth - totalWidth;
      }

      // Set CSS variables for widths
      maxColWidths.forEach((width, i) => {
        document.documentElement.style.setProperty(
          `--col-width-${i}`,
          `${width}px`,
        );
      });
      // console.log("Measured widths:", maxColWidths);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        measureTable();
      });
    });
  }, [searchPerformed, activeSearch, filteredData]);

  // Scroll table container to top AFTER measurements are done
  useEffect(() => {
    if (!searchPerformed) return;
    if (!filteredData || filteredData.length === 0) return;
    if (!containerRef.current) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        containerRef.current.scrollTo({
          top: 0,
          behavior: "instant",
        });
      });
    });
  }, [activeSearch]);

  if (loading) return <div>Loading...</div>;

  const handleSearch = () => {
    // 1) Work with a local snapshot of what the user typed (avoids async setState timing)
    let committed = searchInput.trim();
    let trimmedInput =
      dropdownSelection === "Card Name"
        ? normalizePokemonName(committed)
        : committed.toLowerCase();

    if (!trimmedInput) {
      setFilteredData([]);
      setActiveSearch(""); // committed term for UI
      setSearchPerformed(true); // still mark as performed to clear previous results
      return;
    }

    let filtered = data.filter((row) => {
      let fieldValue =
        dropdownSelection === "Card Name"
          ? normalizePokemonName(row[dropdownSelection] || "")
          : (row[dropdownSelection] || "").toLowerCase().trim();

      if (dropdownSelection === "Card Name") {
        if (trimmedInput === "porygon" && fieldValue.includes("porygon-z")) {
          return false;
        }

        return (
          fieldValue === trimmedInput ||
          fieldValue.startsWith(trimmedInput + " ") ||
          fieldValue.startsWith(trimmedInput + "-") ||
          fieldValue.startsWith(trimmedInput + ",") ||
          fieldValue.startsWith(trimmedInput + "'s ") ||
          fieldValue.includes(" " + trimmedInput + " ") ||
          fieldValue.includes(" " + trimmedInput + "-") ||
          fieldValue.includes(" " + trimmedInput + ",") ||
          fieldValue.includes(" " + trimmedInput + "'s ") ||
          fieldValue.endsWith(" " + trimmedInput) ||
          fieldValue.endsWith("-" + trimmedInput) ||
          fieldValue.endsWith(" " + trimmedInput + "'s") ||
          fieldValue.endsWith("-" + trimmedInput + "'s") ||
          fieldValue.includes("-" + trimmedInput + " ") ||
          fieldValue.includes("-" + trimmedInput + "'s ")
        );
      }

      if (dropdownSelection === "Expansion") {
        if (trimmedInput === "expedition base set") {
          return fieldValue === trimmedInput;
        }

        if (trimmedInput === "pokémon tcg classic") {
          // any expansion that starts with "pokémon tcg classic"
          return fieldValue.startsWith(trimmedInput);
        }

        if (trimmedInput === "my first battle") {
          return fieldValue.toLowerCase().startsWith("my first battle");
        }

        return (
          parseExpansionName(fieldValue).base.toLowerCase() ===
          parseExpansionName(committed).base.toLowerCase()
        );
      }

      // Default fallback
      return fieldValue === trimmedInput;
    });

    if (dropdownSelection === "Expansion") {
      let normalizedInput = trimmedInput;
      let skipSortExpansions = ["celebrations"];
      let shouldSkipSort = skipSortExpansions.some((name) =>
        normalizedInput.startsWith(name),
      );

      if (!shouldSkipSort) {
        filtered = filtered.map((item, index) => ({ ...item, __index: index }));

        const parseSetNumber = (raw) => {
          const s = (raw || "").trim();
          const rangeMatch = s.match(/^([A-Z]+)?(\d+)-(\d+)$/i);
          if (rangeMatch) {
            return {
              kind: "range",
              prefix: (rangeMatch[1] || "").toUpperCase(),
              start: parseInt(rangeMatch[2], 10),
              end: parseInt(rangeMatch[3], 10),
              raw: s,
            };
          }

          const singleMatch = s.match(/^([A-Z]+)?(\d{1,4})$/i);
          if (singleMatch) {
            return {
              kind: "single",
              prefix: (singleMatch[1] || "").toUpperCase(),
              num: parseInt(singleMatch[2], 10),
              raw: s,
            };
          }

          return { kind: "other", raw: s };
        };

        const cmpPrefix = (a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" });

        filtered.sort((a, b) => {
          const A = parseSetNumber(a["Set number"] || "");
          const B = parseSetNumber(b["Set number"] || "");

          // range vs single
          if (A.kind === "range" && B.kind === "single") {
            const p = cmpPrefix(A.prefix, B.prefix);
            if (p !== 0) return p;
            return A.end - B.num + 1; // keep original behavior
          }

          if (A.kind === "single" && B.kind === "range") {
            const p = cmpPrefix(A.prefix, B.prefix);
            if (p !== 0) return p;
            return A.num - B.end - 1;
          }

          // both ranges
          if (A.kind === "range" && B.kind === "range") {
            const p = cmpPrefix(A.prefix, B.prefix);
            if (p !== 0) return p;
            return A.start - B.start;
          }

          // both singles
          if (A.kind === "single" && B.kind === "single") {
            const p = cmpPrefix(A.prefix, B.prefix);
            if (p !== 0) return p;
            return A.num - B.num;
          }

          // fallback: numeric-aware locale compare of raw strings
          return (A.raw || "").localeCompare(B.raw || "", undefined, {
            numeric: true,
          });
        });

        filtered = filtered.map(({ __index, ...rest }) => rest);
      }
    }

    // 3) Commit everything atomically: data first → then “performed” flag → and UI labels
    setFilteredData(filtered); // must be BEFORE setSearchPerformed(true)
    setActiveSearch(committed); // keep a committed term for measuring/UI
    setSearchPerformed(true); // triggers measuring effect AFTER table renders
  };

  const handleDownloadCSV = () => {
    if (!filteredData.length) {
      alert("No filtered data to export.");
      return;
    }

    // 👇 Re-shape the data to match the visible columns
    const exportRows = filteredData.map((row) => ({
      Series: row["Series"] || "",
      Expansion: row["Expansion"] || "",
      "Card Name": (row["Card Name"] || "").replace(/\btex\b/gi, "ex"),
      "Set Number": `="${(row["Set number"] || "") + (row["Set size"] || "")}"`,
      Rarity: row["Rarity"] || "",
      Category: row["Category"] || "",
      Type: row["Type"] || "",
      Variant: row["Variant"] || "",
      Release: row["Release"] || "",
      Notes: row["Notes"] || "",
    }));

    // 🧼 Safe filename from search input
    const raw = searchInput || "pokemon";
    const searchTerm = raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "");

    const fieldPrefix =
      confirmedSearchField === "Card Name"
        ? searchTerm
        : confirmedSearchField === "Expansion"
          ? searchTerm
          : "pokemon";

    const fileName = `${fieldPrefix}_masterlist.csv`;

    // 🧾 Create CSV with semicolon delimiter
    const csv = Papa.unparse(exportRows, {
      delimiter: ";",
    });

    // 💾 Download logic
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const minWidths = [
    58, // Series
    85, // Expansion
    91, // Card Name
    95, // Set Number
    56, // Rarity
    77, // Category
    50, // Type
    65, // Variant
    69, // Release
    150, // Notes
  ];

  return (
    <>
      <style>{`
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
        font-family: system-ui, sans-serif;
        background-color: white;
        color: #000;
      }

    :root {
      --bottom-bar-height: 30px;
    }

      /* ✅ STICKY: wraps all controls */
      /* ---------- TOP BAR: single-line, no wrap, no horizontal scroll ---------- */
.sticky-top-container {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  isolation: isolate;
  contain: paint;
  backface-visibility: hidden;

  /* single-line behavior */
  display: flex;
  align-items: center;    /* vertical centering of controls */
  justify-content: flex-start;
  gap: 12px;

  /* keep it visually stable — allow flexible shrinking but keep a baseline */
  min-height: 64px;       /* ensures enough vertical space for images */
  padding: 0 16px;        /* horizontal padding only (no vertical padding) */
  margin-right: -8px;

  /* prevent the top-bar itself from causing page horizontal scroll */
  left: 0;
  right: 0;
  width: auto;
  box-sizing: border-box;
  overflow: visible;      /* children will be truncated, not clipped */
}

/* Force one row: children do not wrap */
.search-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;      /* CRITICAL: prevent wrapping to new lines */
  width: 100%;
  box-sizing: border-box;
  white-space: nowrap;    /* ensure text nodes don't wrap inside children */
  overflow: visible;
}

/* By default, prevent children from auto-growing to push layout */
.sticky-top-container > *,
.search-bar-wrapper > * {
  flex: 0 0 auto;         /* do not grow; shrink if necessary */
  min-width: 0;           /* allow children to shrink below their content width */
}

/* Make the text input flexible so it can take remaining space but also shrink */
.search-bar-wrapper input[type="text"] {
  flex: 1 1 auto;             /* ✅ flexible: takes leftover space */
  min-width: 160px;           /* ✅ can shrink reasonably */
  max-width: none;            /* ✅ no artificial ceiling */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Select and buttons should be compact but shrink if needed */
.search-bar-wrapper select,
.search-bar-wrapper button {
  flex: 0 1 auto;
  min-width: 40px;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Badge / small status items (latestRelease etc.) */
.sticky-top-container > div,
.search-bar-wrapper > div {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Image sizing: always fill the top-bar vertical space without stretching horizontally */
.sticky-top-container img,
.search-bar-wrapper img {
  height: 60px !important;
  width: auto;
  object-fit: contain;
  display: block;
  flex: 0 0 auto;
  margin: 2px 0;              /* ✅ Adds vertical margin */
}

/* If you have a container that wraps the image (like we used), ensure it doesn't force extra height */
.sticky-top-container .img-wrapper,
.search-bar-wrapper .img-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 0 0 auto;
}

/* Small safety: prevent the top-level body from producing a horizontal scrollbar due to the top bar */
html, body {
  box-sizing: border-box;
  overflow-x: hidden;    /* optional: hides any accidental page-level horizontal overflow */
}

      /* ✅ Scrollable area for table */
      .table-container {
        height: 100vh;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        background-color: white;
        padding-right: 8px;
        padding-bottom: var(--bottom-bar-height);
      }

      /* ✅ Prevent horizontal overflow */
      .table-scroll-wrapper {
        overflow-x: visible;
        width: 100%;
        box-sizing: border-box;
      }
      
      .sticky-bottom-container {
        position: fixed;
        left: 0;
        bottom: 0;
        width: calc(100vw - 16px);
        z-index: 1000;
        height: var(--bottom-bar-height);
        background-color: white;
        box-shadow: 0 -2px 4px rgba(0,0,0,0.08);
      }
      
      .bottom-bar-inner {
        height: 100%;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        font-size: 11px;
        color: #777;
        white-space: nowrap;
      }

      .bottom-disclaimer {
        grid-column: 2;
        text-align: center;
      }

      .bottom-total {
        grid-column: 3;
        justify-self: end;
        padding-right: 12px;
        opacity: 0.85;
      }

      /* ✅ Table styles */
      table {
        width: 100%;
        max-width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 14px;
        white-space: nowrap;
      }

      /* ✅ Sticky table header */
      thead th {
        position: sticky;
        top: 64px; /* Adjust this if sticky-top-container changes height */
        background-color: #f0f0f0;
        z-index: 25;
        padding: 4px 8px;
        height: 30px;
        margin-right: -8px;
        box-shadow: inset -1px 0 0 #999, inset 0 -2px 0 #999;
        text-align: left;
      }

      /* ✅ Table cells */
      tbody td {
        border-bottom: 1px solid #ddd;
        box-shadow: inset -1px 0 0 #eee;
        padding: 4px 8px;
        text-align: left;
        max-width: 100%;
      }

      .table-layer {
        /* Keep the table in its own raster/compositing box */
        contain: layout paint size;
        backface-visibility: hidden;
        transform: translateZ(0);
        will-change: transform;
      }

      tbody tr:hover {
        background-color: #eee;
      }

      td.notes {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      button.pressed {
        transform: scale(0.96);
        background-color: #ececec;
        transition: all 0.12s ease;
      }

      /* ✅ Column-specific widths */
      td:nth-child(1),
      td:nth-child(2),
      td:nth-child(3),
      td:nth-child(4) {
        width: var(--col-width-0);
        max-width: var(--col-width-0);
        white-space: nowrap;
        overflow: visible;
        text-overflow: unset;
      }

      td:nth-child(5) { width: var(--col-width-4); }
      td:nth-child(6) { width: var(--col-width-5); }
      td:nth-child(7) { width: var(--col-width-6); }
      td:nth-child(8) { width: var(--col-width-7); }
      td:nth-child(9) {
        width: var(--col-width-8);
        text-align: right;
      }
      td:nth-child(10) {
        width: var(--col-width-9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ✅ Alignment helpers */
      td.setNumber {
        text-align: right;
      }
      td.expansion {
        padding: 4px 12px;
      }
      td.type .type-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4px;
        height: 100%;
      }

      .set-symbol {
        height: 18px;       /* NEW: larger, clearer, consistent */
        width: auto;
        vertical-align: middle;
        display: inline-block;
        margin-right: 0.375em;
      }

      .rect-symbol-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 18px;      /* the uniform rectangle height */
        width: 34px;       /* the uniform rectangle width (tweak later if you want) */
        margin-right: 0.375em;
        vertical-align: middle;
      }

      .rect-symbol-box img {
        height: 100%;
        width: 100%;
        object-fit: contain;
        display: block;
        image-rendering: -webkit-optimize-contrast;
        transform: translateZ(0);
      }

      .inline-symbol {
        height: 1em;        /* KEEP: card-name icons still scale with text */
        width: auto;
        margin-right: 0.25em;
        vertical-align: middle;
        display: inline-block;
      }

      /* ✅ Invisible card measurement span */
      .card-name-measure-wrapper {
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        font-size: 14px;
        font-family: inherit;
        padding: 4px 8px;
        display: inline-block;
      }

      /* ✅ Inputs and buttons */
      input[type="text"],
      select {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 6px 8px;
        font-size: 14px;
        background-color: white;
        outline: none;
        transition: border-color 0.2s ease;
      }
      input[type="text"]:focus,
      select:focus {
        border-color: #0070f3;
      }

      button {
        padding: 6px 14px;
        background-color: #f5f5f5;
        border: 1px solid #ccc;
        border-radius: 5px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.15);
        transition: all 0.1s ease-in-out;
      }
      button:hover {
        background-color: #eaeaea;
      }
      button:active {
        box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.2);
        transform: translateY(1px);
      }

      `}</style>

      <div className="table-container" ref={containerRef}>
        <div className="sticky-top-container">
          {/* <div className="search-bar-wrapper"> */}
          <label htmlFor="field-select" style={{ marginRight: "8px" }}>
            Create for:
          </label>
          <SearchFieldDropdown
            value={dropdownSelection}
            onChange={(newValue) => setDropdownSelection(newValue)}
            options={["Card Name", "Expansion"]}
          />
          <SearchField
            id="search-field"
            value={searchInput}
            onChange={setSearchInput}
            dataset={dropdownSelection}
            placeholder={`Enter Exact ${dropdownSelection}`}
          />
          {/* </div> */}

          <button ref={generateButtonRef} onClick={handleSearch}>
            Generate
          </button>

          {searchPerformed &&
            (() => {
              const isHalfDeck =
                dropdownSelection === "Expansion" &&
                searchInput.endsWith("Half Deck");

              return (
                <div
                  style={{
                    height: "64px",
                    marginLeft: "12px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {/* Expansion logo — skipped for Half Decks */}
                  {dropdownSelection === "Expansion" &&
                    searchInput &&
                    !isHalfDeck && (
                      <img
                        src={getLogoForExpansion(searchInput)}
                        alt={`${searchInput} logo`}
                        style={{
                          height: "100%",
                          maxWidth: "200px",
                          objectFit: "contain",
                        }}
                      />
                    )}

                  {/* Pokémon sprite fallback logic */}
                  {dropdownSelection === "Card Name" && pokemonId && (
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`}
                      alt={searchInput}
                      style={{
                        height: "100%",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                </div>
              );
            })()}

          <span
            style={{
              marginLeft: "12px",
              fontWeight: 500,
              color: "#555",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: "#f1f1f1",
            }}
          >
            {searchPerformed
              ? displayedData.length === 0
                ? "No results"
                : `${displayedData.length} card${displayedData.length !== 1 ? "s" : ""}`
              : ""}
          </span>

          <button
            onClick={handleDownloadCSV}
            title="Save as .csv"
            style={{ marginLeft: "12px" }}
          >
            Export
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              marginLeft: "auto",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {latestReleaseDate && (
              <div
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#eafbe7", // ✅ soft green background
                  border: "1px solid #b6deb3", // ✅ soft green border
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#2e5e2a", // ✅ darker green text
                  whiteSpace: "nowrap",
                }}
              >
                Up to date: {latestReleaseDate}
              </div>
            )}

            <span
              style={{
                fontSize: "13px",
                color: "#555",
                fontStyle: "italic",
                whiteSpace: "nowrap",
              }}
            >
              Missing cards, wrong data, bugs, or feature discussion →
            </span>

            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                backgroundColor: "#5865F2",
                color: "#fff",
                border: "1px solid #4c59d4",
                fontWeight: "bold",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                transition: "transform 0.1s ease, box-shadow 0.1s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Join Discord
            </a>
          </div>
        </div>
      </div>
      <div className="table-scroll-wrapper">
        {searchPerformed && (
          <CardTable
            displayedData={displayedData}
            confirmedSearchInput={searchInput}
            confirmedSearchField={dropdownSelection}
            tableRef={tableRef}
            columnCount={columnCount}
            minWidths={minWidths}
            shouldUseRarityIcons={shouldUseRarityIcons}
          />
        )}
      </div>
      <div className="sticky-bottom-container">
        <div className="bottom-bar-inner">
          <div className="bottom-disclaimer">
            This is a fan-made TCG database tool. Not affiliated with, endorsed
            or sponsored by Nintendo, The Pokémon Company or Creatures Inc.
          </div>

          <div className="bottom-total">
            Total cards: {data.length.toLocaleString("en-US")}
          </div>
        </div>
      </div>
      <div
        id="measure-container"
        style={{
          position: "absolute",
          visibility: "hidden",
          height: "auto",
          width: "auto",
          whiteSpace: "nowrap",
          fontSize: `${BASE_FONT_SIZE}px`,
          fontFamily: "inherit",
          fontWeight: "normal",
          padding: "4px 8px",
        }}
      ></div>
      <div
        id="floating-suggestions-root"
        style={{ position: "absolute", top: 0, left: 0 }}
      ></div>
    </>
  );
}

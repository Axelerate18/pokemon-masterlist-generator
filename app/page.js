"use client";

import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import Papa from "papaparse";
import DOMPurify from "dompurify";

function waitForAllImagesToLoad(images) {
  return Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
}

// Maps clean expansion names to set symbol URLs
const setSymbols = {
  "Base Set": "https://images.pokemontcg.io/base1/symbol.png",
  Jungle: "https://images.pokemontcg.io/base2/symbol.png",
  Fossil: "https://images.pokemontcg.io/base3/symbol.png",
  "Base Set 2": "https://images.pokemontcg.io/base4/symbol.png",
  "Team Rocket": "https://images.pokemontcg.io/base5/symbol.png",
  "Black Star Promo": "https://images.pokemontcg.io/basep/symbol.png",
  "Gym Heroes": "https://images.pokemontcg.io/gym1/symbol.png",
  "Gym Challenge": "https://images.pokemontcg.io/gym2/symbol.png",
  "Neo Genesis": "https://images.pokemontcg.io/neo1/symbol.png",
  "Neo Discovery": "https://images.pokemontcg.io/neo2/symbol.png",
  "Neo Revelation": "https://images.pokemontcg.io/neo3/symbol.png",
  "Neo Destiny": "https://images.pokemontcg.io/neo4/symbol.png",
  "Legendary Collection": "https://images.pokemontcg.io/base6/symbol.png",
  "Expedition Base Set": "https://images.pokemontcg.io/ecard1/symbol.png",
  Aquapolis: "https://images.pokemontcg.io/ecard2/symbol.png",
  Skyridge: "https://images.pokemontcg.io/ecard3/symbol.png",
  "Ruby & Sapphire": "https://images.pokemontcg.io/ex1/symbol.png",
  Sandstorm: "https://images.pokemontcg.io/ex2/symbol.png",
  Dragon: "https://images.pokemontcg.io/ex3/symbol.png",
  "Team Magma vs Team Aqua": "https://images.pokemontcg.io/ex4/symbol.png",
  "Hidden Legends": "https://images.pokemontcg.io/ex5/symbol.png",
  "FireRed & LeafGreen": "https://images.pokemontcg.io/ex6/symbol.png",
  "Team Rocket Returns": "https://images.pokemontcg.io/ex7/symbol.png",
  Deoxys: "https://images.pokemontcg.io/ex8/symbol.png",
  Emerald: "https://images.pokemontcg.io/ex9/symbol.png",
  "Unseen Forces": "https://images.pokemontcg.io/ex10/symbol.png",
  "Delta Species": "https://images.pokemontcg.io/ex11/symbol.png",
  "Legend Maker": "https://images.pokemontcg.io/ex12/symbol.png",
  "Holon Phantoms": "https://images.pokemontcg.io/ex13/symbol.png",
  "Crystal Guardians": "https://images.pokemontcg.io/ex14/symbol.png",
  "Dragon Frontiers": "https://images.pokemontcg.io/ex15/symbol.png",
  "Power Keepers": "https://images.pokemontcg.io/ex16/symbol.png",
  "POP Series 1": "https://images.pokemontcg.io/pop1/symbol.png",
  "POP Series 2": "https://images.pokemontcg.io/pop2/symbol.png",
  "POP Series 3": "https://images.pokemontcg.io/pop3/symbol.png",
  "POP Series 4": "https://images.pokemontcg.io/pop4/symbol.png",
  "POP Series 5": "https://images.pokemontcg.io/pop5/symbol.png",
  "POP Series 6": "https://images.pokemontcg.io/pop6/symbol.png",
  "POP Series 7": "https://images.pokemontcg.io/pop7/symbol.png",
  "POP Series 8": "https://images.pokemontcg.io/pop8/symbol.png",
  "POP Series 9": "https://images.pokemontcg.io/pop9/symbol.png",
  "Diamond & Pearl": "https://images.pokemontcg.io/dp1/symbol.png",
  "Mysterious Treasures": "https://images.pokemontcg.io/dp2/symbol.png",
  "Secret Wonders": "https://images.pokemontcg.io/dp3/symbol.png",
  "Great Encounters": "https://images.pokemontcg.io/dp4/symbol.png",
  "Majestic Dawn": "https://images.pokemontcg.io/dp5/symbol.png",
  "Legends Awakened": "https://images.pokemontcg.io/dp6/symbol.png",
  "Stormfront": "https://images.pokemontcg.io/dp7/symbol.png",
  "Platinum": "https://images.pokemontcg.io/pl1/symbol.png",
  "Rising Rivals": "https://images.pokemontcg.io/pl2/symbol.png",
  "Supreme Victors": "https://images.pokemontcg.io/pl3/symbol.png",
  "Arceus": "https://images.pokemontcg.io/pl4/symbol.png",
  "HeartGold & SoulSilver": "https://images.pokemontcg.io/hgss1/symbol.png",
  "Unleashed": "https://images.pokemontcg.io/hgss2/symbol.png",
  "Undaunted": "https://images.pokemontcg.io/hgss3/symbol.png",
  "Triumphant": "https://images.pokemontcg.io/hgss4/symbol.png",
  "Call of Legends": "https://images.pokemontcg.io/col1/symbol.png",
  "Southern Islands": "https://images.pokemontcg.io/si1/symbol.png",
  "Rumble": "https://images.pokemontcg.io/ru1/symbol.png",
  "Black & White": "https://images.pokemontcg.io/bw1/symbol.png",
  "Emerging Powers": "https://images.pokemontcg.io/bw2/symbol.png",
  "Noble Victories": "https://images.pokemontcg.io/bw3/symbol.png",
  "Next Destinies": "https://images.pokemontcg.io/bw4/symbol.png",
  "Dark Explorers": "https://images.pokemontcg.io/bw5/symbol.png",
  "Dragons Exalted": "https://images.pokemontcg.io/bw6/symbol.png",
  "Boundaries Crossed": "https://images.pokemontcg.io/bw7/symbol.png",
  "Plasma Storm": "https://images.pokemontcg.io/bw8/symbol.png",
  "Plasma Freeze": "https://images.pokemontcg.io/bw9/symbol.png",
  "Plasma Blast": "https://images.pokemontcg.io/bw10/symbol.png",
  "Legendary Treasures": "https://images.pokemontcg.io/bw11/symbol.png",
  "Best of Game": "https://images.pokemontcg.io/bp/symbol.png",
  "McDonald's Collection 2011": "https://images.pokemontcg.io/mcd11/symbol.png",
  "McDonald's Collection 2012": "https://images.pokemontcg.io/mcd12/symbol.png",
  "McDonald's Collection 2014": "https://images.pokemontcg.io/mcd14/symbol.png",
  "McDonald's Collection 2015": "https://images.pokemontcg.io/mcd15/symbol.png",
  "McDonald's Collection 2016": "https://images.pokemontcg.io/mcd16/symbol.png",
  "McDonald's Collection 2017": "https://images.pokemontcg.io/mcd17/symbol.png",
  "McDonald's Collection 2018": "https://images.pokemontcg.io/mcd18/symbol.png",
  "McDonald's Collection 2019": "https://images.pokemontcg.io/mcd19/symbol.png",
  "McDonald's Collection 2021": "https://images.pokemontcg.io/mcd21/symbol.png",
  "McDonald's Collection 2022": "https://images.pokemontcg.io/mcd22/symbol.png",
  "Pokémon Futsal": "https://images.pokemontcg.io/fut20/symbol.png",
  "Kalos Starter Set": "https://images.pokemontcg.io/xy0/symbol.png",
  "XY": "https://images.pokemontcg.io/xy1/symbol.png",
  "Flashfire": "https://images.pokemontcg.io/xy2/symbol.png",
  "Furious Fists": "https://images.pokemontcg.io/xy3/symbol.png",
  "Phantom Forces": "https://images.pokemontcg.io/xy4/symbol.png",
  "Primal Clash": "https://images.pokemontcg.io/xy5/symbol.png",
  "Roaring Skies": "https://images.pokemontcg.io/xy6/symbol.png",
  "Ancient Origins": "https://images.pokemontcg.io/xy7/symbol.png",
  "BREAKthrough": "https://images.pokemontcg.io/xy8/symbol.png",
  "BREAKpoint": "https://images.pokemontcg.io/xy9/symbol.png",
  "Fates Collide": "https://images.pokemontcg.io/xy10/symbol.png",
  "Steam Siege": "https://images.pokemontcg.io/xy11/symbol.png",
  "Evolutions": "https://images.pokemontcg.io/xy12/symbol.png",
  "Double Crisis": "https://images.pokemontcg.io/dc1/symbol.png",
  "Generations": "https://images.pokemontcg.io/g1/symbol.png",
  "Dragon Vault": "https://images.pokemontcg.io/dv1/symbol.png",
  "Sun & Moon": "https://images.pokemontcg.io/sm1/symbol.png",
  "Guardians Rising": "https://images.pokemontcg.io/sm2/symbol.png",
  "Burning Shadows": "https://images.pokemontcg.io/sm3/symbol.png",
  "Crimson Invasion": "https://images.pokemontcg.io/sm4/symbol.png",
  "Ultra Prism": "https://images.pokemontcg.io/sm5/symbol.png",
  "Forbidden Light": "https://images.pokemontcg.io/sm6/symbol.png",
  "Celestial Storm": "https://images.pokemontcg.io/sm7/symbol.png",
  "Lost Thunder": "https://images.pokemontcg.io/sm8/symbol.png",
  "Team Up": "https://images.pokemontcg.io/sm9/symbol.png",
  "Unbroken Bonds": "https://images.pokemontcg.io/sm10/symbol.png",
  "Unified Minds": "https://images.pokemontcg.io/sm11/symbol.png",
  "Cosmic Eclipse": "https://images.pokemontcg.io/sm12/symbol.png",
  "Hidden Fates": "https://images.pokemontcg.io/sm115/symbol.png",
  "Shining Legends": "https://images.pokemontcg.io/sm35/symbol.png",
  "Dragon Majesty": "https://images.pokemontcg.io/sm75/symbol.png",
  "Detective Pikachu": "https://images.pokemontcg.io/det1/symbol.png",
  "Sword & Shield": "https://images.pokemontcg.io/swsh1/symbol.png",
  "Rebel Clash": "https://images.pokemontcg.io/swsh2/symbol.png",
  "Darkness Ablaze": "https://images.pokemontcg.io/swsh3/symbol.png",
  "Champion's Path": "https://images.pokemontcg.io/swsh35/symbol.png",
  "Vivid Voltage": "https://images.pokemontcg.io/swsh4/symbol.png",
  "Shining Fates": "https://images.pokemontcg.io/swsh45/symbol.png",
  "Battle Styles": "https://images.pokemontcg.io/swsh5/symbol.png",
  "Chilling Reign": "https://images.pokemontcg.io/swsh6/symbol.png",
  "Evolving Skies": "https://images.pokemontcg.io/swsh7/symbol.png",
  "Celebrations": "https://images.pokemontcg.io/cel25/symbol.png",
  "Fusion Strike": "https://images.pokemontcg.io/swsh8/symbol.png",
  "Brilliant Stars": "https://images.pokemontcg.io/swsh9/symbol.png",
  "Astral Radiance": "https://images.pokemontcg.io/swsh10/symbol.png",
  "Lost Origin": "https://images.pokemontcg.io/swsh11/symbol.png",
  "Silver Tempest": "https://images.pokemontcg.io/swsh12/symbol.png",
  "Pokémon GO": "https://images.pokemontcg.io/pgo/symbol.png",
  "Crown Zenith": "https://images.pokemontcg.io/swsh12pt5/symbol.png",
  "Shiny Vault": "https://images.pokemontcg.io/sma/symbol.png",
  "Hidden Fates": "https://images.pokemontcg.io/sm115/symbol.png", // Ensure this is added too
};

const setLogos = Object.fromEntries(
  Object.entries(setSymbols).map(([name, symbolUrl]) => {
    const logoUrl = symbolUrl.replace("/symbol.png", "/logo.png");
    return [name, logoUrl];
  })
);

function getSymbolsForExpansion(expansionName) {
  const name = expansionName.trim();

  if (/black star promo/i.test(name)) {
    return [setSymbols["Black Star Promo"]].filter(Boolean);
  }

  // Special case: show both Hidden Fates and Shiny Vault symbols
  if (name === "Hidden Fates (Shiny Vault)") {
    return [
      setSymbols["Hidden Fates"],
      setSymbols["Shiny Vault"]
    ].filter(Boolean);
  }

  // Special case: treat Shining Fates (Shiny Vault) as normal Shining Fates
  if (name === "Shining Fates (Shiny Vault)") {
    return [setSymbols["Shining Fates"]].filter(Boolean);
  }
  // Handle expansions that contain one of the ignore suffixes
  const IGNORE_SUFFIXES = [
    "(E)", "(P)", "(WC)", "(TK)", "(BA)", "(Classic Collection)",
    "(Trainer Gallery)", "(ToT", "(PPS", "(Galarian Gallery)", "(Shiny Vault)"
  ];

  const ignoreSuffixMatch = IGNORE_SUFFIXES.find(suffix => name.includes(suffix));
  if (ignoreSuffixMatch) {
    const baseName = name.split(" (")[0];
    return [setSymbols[baseName]].filter(Boolean);
  }

  // Special case: if name ends in (A), add Shiny Vault after expansion symbol
  if (/\(A\)$/.test(name)) {
    const baseName = name.replace(/\s*\(A\)$/, "");
    return [setSymbols[baseName], setSymbols["Shiny Vault"]].filter(Boolean);
  }

  // Default case
  return [setSymbols[name]].filter(Boolean);
}
function getLogoForExpansion(expansionName) {
  const name = expansionName.trim();

  if (/black star promo/i.test(name)) {
    return setLogos["Black Star Promo"];
  }

  const IGNORE_SUFFIXES = [
    "(E)", "(P)", "(WC)", "(TK)", "(BA)", "(Classic Collection)",
    "(Trainer Gallery)", "(ToT", "(PPS", "(Galarian Gallery)", "(Shiny Vault)"
  ];

  const matchedSuffix = IGNORE_SUFFIXES.find((suffix) =>
    name.includes(suffix)
  );
  if (matchedSuffix) {
    const baseName = name.split(" (")[0].trim();
    return setLogos[baseName];
  }

  return setLogos[name] || null;
}

function extractPokemonName(cardName) {
  return cardName
    .replace(/\b(Mega|Shiny|EX|GX|VSTAR|VMAX|BREAK|LEGEND|Prism Star|V-UNION|G|GL|C|FB|E4|Lv\.X|δ|STAR|Promo|Forme|Basic|Restored)\b/gi, "")
    .replace(/[^\w\s-]/gi, "") // keep letters, spaces, and hyphens
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-"); // turn spaces into hyphens
}

const csvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRcbbI3WUWbmjXYay0BQKF7wJ5kR8RoHIXQoUbH4yWSzySeGib6VGtx_xSp7BLnVuF_7oOrnYi_sJfh/pub?gid=0&single=true&output=csv";

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmedSearchInput, setConfirmedSearchInput] = useState("");
  const [confirmedSearchField, setConfirmedSearchField] = useState("");
  const [pokemonId, setPokemonId] = useState(null);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);

  const containerRef = useRef(null);
  const tableRef = useRef(null);
  const inputRef = useRef(null);

  // Base font size in px
  const BASE_FONT_SIZE = 14;
  const fontSize = BASE_FONT_SIZE;
  const [searchField, setSearchField] = useState("Card Name");
  const [searchInput, setSearchInput] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [expansionSuggestions, setExpansionSuggestions] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [matchingSuggestions, setMatchingSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
  if (searchPerformed && searchField === "Card Name" && confirmedSearchInput) {
    const name = extractPokemonName(confirmedSearchInput);

    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => {
        setPokemonId(data.id); // Save the ID for rendering image
      })
      .catch(() => setPokemonId(null)); // Fallback if name is invalid
  }
}, [searchPerformed, confirmedSearchInput, searchField]);

useEffect(() => {
  const updateDropdownPos = () => {
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) {
      setDropdownTop(rect.bottom + window.scrollY);
      setDropdownLeft(rect.left + window.scrollX);
    }
  };

  if (showSuggestions) {
    updateDropdownPos();
    window.addEventListener("scroll", updateDropdownPos, true);
    window.addEventListener("resize", updateDropdownPos);
  }

  return () => {
    window.removeEventListener("scroll", updateDropdownPos, true);
    window.removeEventListener("resize", updateDropdownPos);
  };
}, [showSuggestions]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(csvUrl);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        setData(parsed.data);
       const cleanedExpansions = [...new Set(
  parsed.data
    .map(row => row["Expansion"])
    .filter(Boolean)
    .map(exp => exp.split(" (")[0].trim()) // remove (E), (P), etc.
)].sort();

setExpansionSuggestions(cleanedExpansions);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching CSV:", error);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Resize handler to adjust font size based on widest content in each column

 const displayedData = searchPerformed ? filteredData : data;

  useLayoutEffect(() => {
  if (!containerRef.current || !tableRef.current || displayedData.length === 0) return;

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
  const tds = clone.querySelectorAll(`tbody tr td:nth-child(${colIndex + 1})`);

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
    const symbolHTML = symbols.map(url => `<img src="${url}" class="set-symbol" />`).join("");
    const content = symbolHTML + expansion;

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
  const allImages = wrappers.flatMap(wrapper =>
    Array.from(wrapper.querySelectorAll("img"))
  );

  await Promise.all(
    allImages.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  // Measure wrappers
  wrappers.forEach(wrapper => {
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
  const tds = clone.querySelectorAll(`tbody tr td:nth-child(${cardNameIndex + 1})`);
  // Collect all card name wrappers first
for (let rowIndex = 0; rowIndex < tds.length; rowIndex++) {
  const rawName = displayedData[rowIndex]["Card Name"] || "";
  const series = (displayedData[rowIndex]["Series"] || "").toLowerCase();
const lowerName = rawName.toLowerCase();

  const skipCGVSymbols =
    lowerName === "unown c" ||
    lowerName === "unown g" ||
    (lowerName === "unown v" && !series.includes("sw&sh"));

  const html = renderCardNameWithSymbols(rawName, displayedData[rowIndex], { skipCGVSymbols });

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  wrapper.className = "card-name-measure-wrapper";
  document.body.appendChild(wrapper);
  wrapperList.push(wrapper);
}

// ✅ Wait for all images in card name wrappers to load
const allImages = wrapperList.flatMap(wrapper => Array.from(wrapper.querySelectorAll("img")));
await Promise.all(
  allImages.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  })
);

// ✅ Measure all wrapper widths after images are loaded
wrapperList.forEach(wrapper => {
  const width = wrapper.offsetWidth;
  maxColWidths[cardNameIndex] = Math.max(maxColWidths[cardNameIndex], width);
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
    document.documentElement.style.setProperty(`--col-width-${i}`, `${width}px`);
  });

  console.log("Measured widths:", maxColWidths);
};

   requestAnimationFrame(() => {
    console.log("Calling measureTable via RAF, rows:", displayedData.length);
    measureTable();
  });
 
}, [displayedData]);

  if (loading) return <div>Loading...</div>;

function renderCardNameWithSymbols(cardName, row = {}, overrideSymbolFlags = {}) {

  if (!cardName) return "";

  const symbolMap = {
    "GoldStar": "/icons/GoldStar.png",
    "EX": "/icons/EX_BW_XY.png",   // uppercase EX only
    "BREAK": "/icons/Break.png",
    "uGX": "/icons/GX_red.png",
    "GX": "/icons/GX_blue.png",
    "LEGEND": "/icons/Legend.png",
    "Mega": "/icons/Mega.png",
    "PrismStar": "/icons/Prism_Star.png",
    "V-union": "/icons/V-union.png",
    "Vmax": "/icons/Vmax.png",
    "Vstar": "/icons/Vstar.png",
    "V": "/icons/V.png",
    "C": "/icons/C.png",
    "E4": "/icons/E4.png",
    "FB": "/icons/FB.png",
    "G": "/icons/G.png",
    "GL": "/icons/GL.png",
  };

    const series = (row["Series"] || "").toLowerCase();
const lowerName = (cardName || "").toLowerCase();

const skipSymbols =
  overrideSymbolFlags.skipCGVSymbols ||
  lowerName === "unown c" ||
  lowerName === "unown g" ||
  (lowerName === "unown v" && !series.includes("sw&sh"));

  const sortedKeys = Object.keys(symbolMap).sort((a, b) => b.length - a.length);

  let processed = cardName;

  sortedKeys.forEach((key) => {
  if (skipSymbols && ["C", "G", "V"].includes(key)) {
    return; // skip these 3 if flag is set
  }
  const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(?<![\\w-])${escapedKey}(?![\\w-])`, "g");
  const imgTag = `<img src="${symbolMap[key]}" class="inline-symbol" alt="${key} icon" />`;
  processed = processed.replace(regex, imgTag);
});

  return processed;
}

function renderTypeWithSymbols(typeText) {
  if (!typeText) return "";

  const typeIcons = {
    Grass: "https://archives.bulbagarden.net/media/upload/thumb/2/2e/Grass-attack.png/30px-Grass-attack.png",
    Fire: "https://archives.bulbagarden.net/media/upload/thumb/a/ad/Fire-attack.png/30px-Fire-attack.png",
    Water: "https://archives.bulbagarden.net/media/upload/thumb/1/11/Water-attack.png/30px-Water-attack.png",
    Lightning: "https://archives.bulbagarden.net/media/upload/thumb/0/04/Lightning-attack.png/30px-Lightning-attack.png",
    Psychic: "https://archives.bulbagarden.net/media/upload/thumb/e/ef/Psychic-attack.png/30px-Psychic-attack.png",
    Fighting: "https://archives.bulbagarden.net/media/upload/thumb/4/48/Fighting-attack.png/30px-Fighting-attack.png",
    Darkness: "https://archives.bulbagarden.net/media/upload/thumb/a/ab/Darkness-attack.png/30px-Darkness-attack.png",
    Metal: "https://archives.bulbagarden.net/media/upload/thumb/6/64/Metal-attack.png/30px-Metal-attack.png",
    Fairy: "https://archives.bulbagarden.net/media/upload/thumb/4/40/Fairy-attack.png/30px-Fairy-attack.png",
    Dragon: "https://archives.bulbagarden.net/media/upload/thumb/8/8a/Dragon-attack.png/30px-Dragon-attack.png",
    Colorless: "https://archives.bulbagarden.net/media/upload/thumb/1/1d/Colorless-attack.png/30px-Colorless-attack.png",
    Rainbow: "https://archives.bulbagarden.net/media/upload/d/dd/Rainbow-attack.png"
  };

  let types = [];

  if (typeText.startsWith("Dual ")) {
    types = typeText.replace("Dual ", "").split("/");
  } else {
    types = [typeText];
  }

  return `
  <div class="type-wrapper">
    ${types
      .map(type => {
        const src = typeIcons[type.trim()];
        return src
          ? `<img src="${src}" alt="${type}" title="${type}" style="height: 16px;" />`
          : type;
      })
      .join("")}
  </div>
`;
}

  const handleSearch = () => {
  const trimmedInput = searchInput.trim().toLowerCase();
  if (!trimmedInput) {
    setFilteredData([]);
    return;
  }

  const IGNORE_SUFFIXES = [
    "(E)", "(P)", "(WC)", "(TK)", "(BA)", "(Classic Collection)", 
    "(Trainer Gallery)", "(ToT", "(PPS", "(Galarian Gallery)", "(Shiny Vault)"
  ];

  function stripSuffix(expansionName) {
    expansionName = expansionName.toLowerCase().trim();
    for (const suffix of IGNORE_SUFFIXES) {
      if (expansionName.endsWith(suffix.toLowerCase())) {
        return expansionName.slice(0, -suffix.length).trim();
      }
    }
    return expansionName;
  }

  let filtered = data.filter((row) => {
    const fieldValue = (row[searchField] || "").toLowerCase().trim();

    if (searchField === "Card Name") {
      const regex = new RegExp(`\\b${trimmedInput}\\b`, "i");
      return regex.test(fieldValue);
    }

    if (searchField === "Expansion") {
      if (trimmedInput === "expedition base set") {
        return fieldValue === trimmedInput;
      }
      const baseFieldValue = stripSuffix(fieldValue);
      const baseInput = stripSuffix(trimmedInput);

      return baseFieldValue === baseInput;
    }

    // Default fallback
    return fieldValue === trimmedInput;
  });

    if (searchField === "Expansion") {
  const normalizedInput = searchInput.toLowerCase().trim();
  const skipSortExpansions = ["celebrations"];

  const shouldSkipSort = skipSortExpansions.some(name => normalizedInput.startsWith(name));

  if (!shouldSkipSort) {
    filtered = filtered.map((item, index) => ({ ...item, __index: index }));

    filtered.sort((a, b) => {
      const aRaw = a["Set number"] || "";
      const bRaw = b["Set number"] || "";

      const numOnly = /^\d+$/;

      const isANumeric = numOnly.test(aRaw);
      const isBNumeric = numOnly.test(bRaw);

      if (isANumeric && isBNumeric) {
        return parseInt(aRaw, 10) - parseInt(bRaw, 10);
      }

      if (isANumeric) return -1;
      if (isBNumeric) return 1;

      const aMatch = aRaw.match(/^([A-Z]+)?(\d+)$/i);
      const bMatch = bRaw.match(/^([A-Z]+)?(\d+)$/i);

      if (aMatch && bMatch) {
        const [, aPrefix = "", aNum] = aMatch;
        const [, bPrefix = "", bNum] = bMatch;

        const prefixCompare = aPrefix.localeCompare(bPrefix);
        if (prefixCompare !== 0) return prefixCompare;

        return parseInt(aNum, 10) - parseInt(bNum, 10);
      }

      return a.__index - b.__index;
    });

    filtered = filtered.map(({ __index, ...rest }) => rest);
  }
}

  setConfirmedSearchInput(searchInput.trim());
  setConfirmedSearchField(searchField);
  setFilteredData(filtered);
  setSearchPerformed(true);
} // 👈 THIS closing brace is easy to miss!

const minWidths = [
  58,  // Series
  85, // Expansion
  91, // Card Name
  95,  // Set Number
  56,  // Rarity
  77,  // Category
  50,  // Type
  65,  // Variant
  69,  // Release
  150, // Notes
];

  return (
    <>
      <style>{`
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow-x: hidden;
        overflow: hidden; /* prevent body scroll which causes double scrollbars */
        color: #000;
        background-color: #fff;
        font-family: var(--font-geist-sans, system-ui, sans-serif);
      }
      td {
        color: inherit; /* ensure table cells don't override it */
      }

      .search-bar-wrapper {
        display: flex;
        align-items: center;
        z-index: 1001;
        justify-content: flex-start;
        padding: 20px 16px;
        height: 60px; /* adjust as needed */
        overflow-y: hidden;
      }
        @media (max-width: 600px) {
      .search-bar-wrapper {
        flex-wrap: wrap;
        gap: 12px;
        height: auto;
        padding: 12px;
      }

      .search-bar-wrapper > * {
        flex: 1 1 100%;
      }
    }
       .table-container {
  width: 100%;
  box-sizing: border-box;
  background-color: white;
  padding: 0 8px 1px 0;
}

      .sticky-top-container {
  width: 100%;
  position: sticky;
  top: 0;
  background: white;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
  margin-left: 0;
}

/* 🧠 Only apply layout trick on mobile to stretch edge-to-edge */
@media (max-width: 600px) {
  .sticky-top-container {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(-50vw + 50%);
  }
}


        .table-scroll-wrapper {
          overflow-x: auto;
          max-width: 100vw;
        }

        table {
          border-collapse: collapse;
          min-width: 100%;
          table-layout: fixed; /* ✅ forces column widths */
          font-size: 14px;
          white-space: nowrap;
          max-width: 100%;
        }

        thead th {
          position: sticky;
          top: 62px;
          background-color: #f0f0f0;
          z-index: 25; /* On top of sticky-top-container */
          box-shadow: inset 0 -2px 0 #999; /* Acts like bottom border */
          border-bottom: none; /* Prevents overlap issues */
          box-shadow: inset -1px 0 0 #999, inset 0 -2px 0 #999;
          padding: 4px 8px;
          text-align: left;
          height: 30px; /* 👈 ensure consistent height (adjust if needed) */
        }

        tbody td {
        border-bottom: 1px solid #ddd;
        box-shadow: inset -1px 0 0 #eee;
        padding: 4px 8px;
        text-align: left;
        max-width: 100%;
      }
        tbody tr:hover {
          background-color: #eee;
        }
        .empty-cell {
          background-color: #e2e2e2;
          color: transparent;
        }
        td.notes {
  width: auto; /* Important: let it stretch */
}
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
td:nth-child(1), /* Series */
td:nth-child(2), /* Expansion */
td:nth-child(3), /* Card Name */
td:nth-child(4)  /* Set Number */ {
  width: var(--col-width-0);
  max-width: var(--col-width-0);
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  padding: 4px 8px;
}

td:nth-child(5) { width: var(--col-width-4); }  /* Rarity */
td:nth-child(6) { width: var(--col-width-5); }  /* Category */
td:nth-child(7) { width: var(--col-width-6); }  /* Type */
td:nth-child(8) { width: var(--col-width-7); }  /* Variant */
td:nth-child(9) {
  width: var(--col-width-8);
  text-align: right;
}

td:nth-child(10) { /* Notes column */
  width: var(--col-width-9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

        td.setNumber {
          text-align: right;
        }
        td.setNumber,
        td.rarity,
        td.series,
        td.category,
        td.type,
        td.variant,
        td.release {
          max-width: none;
          overflow: visible;
          text-overflow: unset;
          vertical-align: middle;
        }
        td.expansion {
          padding: 4px 12px; /* increase right padding */
        }
        td.type {
          padding: 4px 8px;
          vertical-align: middle; /* keep row alignment consistent */
        }

        td.type .type-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          height: 100%;
        }
        .set-symbol {
          height: 1em; /* scale with font size */
          vertical-align: middle;
          margin-right: 0.375em; /* 6px @ 16px font */
          display: inline-block;
        }
          .inline-symbol {
          height: 1em;
          width: auto; /* Maintain natural aspect ratio */
          vertical-align: middle;
          display: inline-block;
          margin-right: 0.25em; /* Spacing between symbol and text */
        }

        .card-name-measure-wrapper {
          position: absolute;
          visibility: hidden;
          white-space: nowrap;
          font-size: 14px;
          font-family: inherit;
          padding: 4px 8px;
          display: inline-block;
        }

        .card-name-measure-wrapper img.inline-symbol {
          height: 1em;
          margin-right: 0.25em;
          vertical-align: middle;
        }
          select,
          input[type="text"] {
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 6px 8px;
            font-size: 14px;
            background-color: white;
            outline: none;
            box-shadow: none;
            transition: border-color 0.2s ease;
          }

          select:focus,
          input[type="text"]:focus {
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
    <div className="table-scroll-wrapper">
  <div className="sticky-top-container"> 
    <div className="search-bar-wrapper">
  <label htmlFor="field-select" style={{ marginRight: "8px" }}>Search by:</label>

<select
  id="field-select"
  value={searchField}
  onChange={(e) => setSearchField(e.target.value)}
  style={{ marginRight: "12px" }}
>
  <option value="Card Name">Pokémon</option>
  <option value="Expansion">Expansion</option>
</select>

{/* 🧠 Wrap just input and dropdown in their own positioning block */}
<div style={{ position: "relative", display: "inline-block" }}>
  <input
    ref={inputRef}
    type="text"
    value={searchInput}
    onChange={(e) => {
  const value = e.target.value;
  setSearchInput(value);

  if (searchField === "Expansion" && value.length >= 2) {
    const matches = expansionSuggestions.filter((exp) =>
      exp.toLowerCase().includes(value.toLowerCase())
    );
    setMatchingSuggestions(matches);
    setShowSuggestions(true);
  } else {
    setMatchingSuggestions([]);
    setShowSuggestions(false);
  }
}}

    placeholder={`Enter exact ${searchField}`}
    style={{ marginRight: "12px", padding: "4px" }}
    onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
  />

  {showSuggestions && matchingSuggestions.length > 0 &&
  ReactDOM.createPortal(
    <ul style={{
      position: "absolute",
      top: `${dropdownTop}px`,
      left: `${dropdownLeft}px`,
      zIndex: 99999,
      backgroundColor: "white",
      border: "1px solid #ccc",
      borderRadius: "4px",
      marginTop: "2px",
      listStyle: "none",
      padding: 0,
      maxHeight: "150px",
      overflowY: "auto",
      width: inputRef.current?.offsetWidth || "200px",
      fontSize: "14px",
      fontFamily: "inherit",
      boxSizing: "border-box",
    }}>
      {matchingSuggestions.map((suggestion, index) => (
        <li
          key={index}
          onClick={() => {
            setSearchInput(suggestion);
            setShowSuggestions(false);
          }}
          style={{
            padding: "4px 8px",
            margin: 0,
            lineHeight: "1.5",
            cursor: "pointer",
            borderBottom: "1px solid #eee"
          }}
        >
          {suggestion}
        </li>
      ))}
    </ul>,
    document.getElementById("floating-suggestions-root")
  )
}

</div>

<button onClick={handleSearch}>Search</button>

{searchPerformed && confirmedSearchField === "Expansion" && confirmedSearchInput && (
  <div style={{
    height: "36px",
    marginLeft: "12px",
    display: "flex",
    alignItems: "center"
  }}>
    <img
      src={getLogoForExpansion(confirmedSearchInput)}
      alt={`${confirmedSearchInput} logo`}
      style={{
        height: "100%",
        maxWidth: "200px",
        objectFit: "contain"
      }}
    />
  </div>
)}

{searchPerformed && confirmedSearchField === "Card Name" && pokemonId && (
  <div style={{
    height: "64px",
    marginLeft: "12px",
    display: "flex",
    alignItems: "center"
  }}>
    <img
      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`}
      alt={confirmedSearchInput}
      style={{
        height: "100%",
        objectFit: "contain"
      }}
      onError={(e) => {
        e.target.style.display = "none"; // Hide if not found
      }}
    />
  </div>
)}

<span style={{
  marginLeft: "12px",
  fontWeight: 500,
  color: "#555",
  padding: "4px 8px",
  borderRadius: "4px",
  backgroundColor: "#f1f1f1"
}}>
  {searchPerformed
    ? displayedData.length === 0
      ? "No results"
      : `${displayedData.length} card${displayedData.length !== 1 ? "s" : ""}`
    : ""}
</span>

  </div>
</div>
        {searchPerformed && (
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
      {filteredData.map((row, i) => {
        const setNumber = (row["Set number"] || "") + (row["Set size"] || "");

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
              {getSymbolsForExpansion(rawExpansion).map((url, j) => (
                <img
                  key={j}
                  src={url}
                  alt={`${rawExpansion} symbol`}
                  className="set-symbol"
                />
              ))}
              {rawExpansion}
            </td>
            {(() => {
              const cardName = row["Card Name"] || "";
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
                    renderCardNameWithSymbols(cardName, row, { skipCGVSymbols })
                  )}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        renderCardNameWithSymbols(cardName, row, {
                          skipCGVSymbols,
                        })
                      ),
                    }}
                  />
                </td>
              );
            })()}
            {renderCell(setNumber, "setNumber")}
            {renderCell(row["Rarity"], "rarity")}
            {renderCell(row["Category"], "category")}
            <td className="type">
              <span
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    renderTypeWithSymbols(row["Type"])
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
)}
        </div>
      </div>
      <div id="measure-container" style={{
  position: "absolute",
  visibility: "hidden",
  height: "auto",
  width: "auto",
  whiteSpace: "nowrap",
  fontSize: `${BASE_FONT_SIZE}px`,
  fontFamily: "inherit",
  fontWeight: "normal",
  padding: "4px 8px"
}}></div>
<div id="floating-suggestions-root" style={{ position: "absolute", top: 0, left: 0 }}></div>

    </>
  );
}

"use client";

import React, { useEffect, useState, useRef, useLayoutEffect, useMemo } from "react";
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

// ---------------------------
// STATIC LIST OF POKÉMON SPECIES (for Card Name suggestions)
// ---------------------------
const POKEMON_SPECIES = [
  "Bulbasaur","Ivysaur","Venusaur","Charmander","Charmeleon","Charizard",
  "Wartortle","Blastoise","Caterpie","Metapod","Butterfree","Weedle","Kakuna",
  "Beedrill","Pidgey","Pidgeotto","Pidgeot","Rattata","Raticate","Spearow",
  "Fearow","Ekans","Arbok","Pikachu","Raichu","Sandshrew","Sandslash",
  "Nidoran♀","Nidorina","Nidoqueen","Nidoran♂","Nidorino","Nidoking","Clefairy",
  "Clefable","Vulpix","Ninetales","Jigglypuff","Wigglytuff","Zubat","Golbat",
  "Oddish","Gloom","Vileplume","Paras","Parasect","Venonat","Venomoth",
  "Diglett","Dugtrio","Meowth","Persian","Psyduck","Golduck","Mankey",
  "Primeape","Growlithe","Arcanine","Poliwag","Poliwhirl","Poliwrath","Abra",
  "Kadabra","Alakazam","Machop","Machoke","Machamp","Bellsprout","Weepinbell",
  "Victreebel","Tentacool","Tentacruel","Geodude","Graveler","Golem","Ponyta",
  "Rapidash","Slowpoke","Slowbro","Magnemite","Magneton","Farfetch'd","Doduo",
  "Dodrio","Seel","Dewgong","Grimer","Muk","Shellder","Cloyster","Gastly",
  "Haunter","Gengar","Onix","Drowzee","Hypno","Krabby","Kingler","Voltorb",
  "Electrode","Exeggcute","Exeggutor","Cubone","Marowak","Hitmonlee",
  "Hitmonchan","Lickitung","Koffing","Squirtle","Weezing","Rhyhorn","Rhydon",
  "Chansey","Tangela","Kangaskhan","Horsea","Seadra","Goldeen","Seaking",
  "Staryu","Starmie","Mr. Mime","Scyther","Jynx","Electabuzz","Magmar","Pinsir",
  "Tauros","Magikarp","Gyarados","Lapras","Ditto","Eevee","Vaporeon","Jolteon",
  "Flareon","Porygon","Omanyte","Omastar","Kabuto","Kabutops","Aerodactyl",
  "Snorlax","Articuno","Zapdos","Moltres","Dratini","Dragonair","Dragonite",
  "Mewtwo","Mew","Chikorita","Bayleef","Meganium","Cyndaquil","Quilava",
  "Typhlosion","Totodile","Croconaw","Feraligatr","Sentret","Furret","Hoothoot",
  "Noctowl","Ledyba","Ledian","Spinarak","Ariados","Crobat","Chinchou",
  "Lanturn","Pichu","Cleffa","Igglybuff","Togepi","Togetic","Natu","Xatu",
  "Mareep","Flaaffy","Ampharos","Bellossom","Marill","Azumarill","Sudowoodo",
  "Politoed","Hoppip","Skiploom","Jumpluff","Aipom","Sunkern","Sunflora",
  "Yanma","Wooper","Quagsire","Espeon","Umbreon","Murkrow","Slowking",
  "Misdreavus","Unown","Wobbuffet","Girafarig","Pineco","Forretress",
  "Dunsparce","Gligar","Steelix","Snubbull","Granbull","Qwilfish","Scizor",
  "Shuckle","Heracross","Sneasel","Teddiursa","Ursaring","Slugma","Magcargo",
  "Swinub","Piloswine","Corsola","Remoraid","Octillery","Delibird","Mantine",
  "Skarmory","Houndour","Houndoom","Kingdra","Phanpy","Donphan","Porygon2",
  "Stantler","Smeargle","Tyrogue","Hitmontop","Smoochum","Elekid","Magby",
  "Miltank","Blissey","Raikou","Entei","Suicune","Larvitar","Pupitar",
  "Tyranitar","Lugia","Ho-oh","Celebi","Treecko","Grovyle","Sceptile",
  "Torchic","Combusken","Blaziken","Mudkip","Marshtomp","Swampert","Poochyena",
  "Mightyena","Zigzagoon","Linoone","Wurmple","Silcoon","Beautifly","Cascoon",
  "Dustox","Lotad","Lombre","Ludicolo","Seedot","Nuzleaf","Shiftry","Taillow",
  "Swellow","Wingull","Pelipper","Ralts","Kirlia","Gardevoir","Surskit",
  "Masquerain","Shroomish","Breloom","Slakoth","Vigoroth","Slaking","Nincada",
  "Ninjask","Shedinja","Whismur","Loudred","Exploud","Makuhita","Hariyama",
  "Azurill","Nosepass","Skitty","Delcatty","Sableye","Mawile","Aron","Lairon",
  "Aggron","Meditite","Medicham","Electrike","Manectric","Plusle","Minun",
  "Volbeat","Illumise","Roselia","Gulpin","Swalot","Carvanha","Sharpedo",
  "Wailmer","Wailord","Numel","Camerupt","Torkoal","Spoink","Grumpig","Spinda",
  "Trapinch","Vibrava","Flygon","Cacnea","Cacturne","Swablu","Altaria",
  "Zangoose","Seviper","Lunatone","Solrock","Barboach","Whiscash","Corphish",
  "Crawdaunt","Baltoy","Claydol","Lileep","Cradily","Anorith","Armaldo",
  "Feebas","Milotic","Castform","Kecleon","Shuppet","Banette","Duskull",
  "Dusclops","Tropius","Chimecho","Absol","Wynaut","Snorunt","Glalie","Spheal",
  "Sealeo","Walrein","Clamperl","Huntail","Gorebyss","Relicanth","Luvdisc",
  "Bagon","Shelgon","Salamence","Beldum","Metang","Metagross","Regirock",
  "Regice","Registeel","Latias","Latios","Kyogre","Groudon","Rayquaza",
  "Jirachi","Deoxys","Turtwig","Grotle","Torterra","Chimchar","Monferno",
  "Infernape","Piplup","Prinplup","Empoleon","Starly","Staravia","Staraptor",
  "Bidoof","Bibarel","Kricketot","Kricketune","Shinx","Luxio","Luxray","Budew",
  "Roserade","Cranidos","Rampardos","Shieldon","Bastiodon","Burmy","Wormadam",
  "Mothim","Combee","Vespiquen","Pachirisu","Buizel","Floatzel","Cherubi",
  "Cherrim","Shellos","Gastrodon","Ambipom","Drifloon","Drifblim","Buneary",
  "Lopunny","Mismagius","Honchkrow","Glameow","Purugly","Chingling","Stunky",
  "Skuntank","Bronzor","Bronzong","Bonsly","Mime Jr.","Happiny","Chatot",
  "Spiritomb","Gible","Gabite","Garchomp","Munchlax","Riolu","Lucario",
  "Hippopotas","Hippowdon","Skorupi","Drapion","Croagunk","Toxicroak",
  "Carnivine","Finneon","Lumineon","Mantyke","Snover","Abomasnow","Weavile",
  "Magnezone","Lickilicky","Rhyperior","Tangrowth","Electivire","Magmortar",
  "Togekiss","Yanmega","Leafeon","Glaceon","Gliscor","Mamoswine","Porygon-Z",
  "Gallade","Probopass","Dusknoir","Froslass","Rotom","Uxie","Mesprit","Azelf",
  "Dialga","Palkia","Heatran","Regigigas","Giratina","Cresselia","Phione",
  "Manaphy","Darkrai","Shaymin","Arceus","Victini","Snivy","Servine",
  "Serperior","Tepig","Pignite","Emboar","Oshawott","Dewott","Samurott",
  "Patrat","Watchog","Lillipup","Herdier","Stoutland","Purrloin","Liepard",
  "Pansage","Simisage","Pansear","Simisear","Panpour","Simipour","Munna",
  "Musharna","Pidove","Tranquill","Unfezant","Blitzle","Zebstrika","Roggenrola",
  "Boldore","Gigalith","Woobat","Swoobat","Drilbur","Excadrill","Audino",
  "Timburr","Gurdurr","Conkeldurr","Tympole","Palpitoad","Seismitoad","Throh",
  "Sawk","Sewaddle","Swadloon","Leavanny","Venipede","Whirlipede","Scolipede",
  "Cottonee","Whimsicott","Petilil","Lilligant","Basculin","Sandile","Krokorok",
  "Krookodile","Darumaka","Darmanitan","Maractus","Dwebble","Crustle","Scraggy",
  "Scrafty","Sigilyph","Yamask","Cofagrigus","Tirtouga","Carracosta","Archen",
  "Archeops","Trubbish","Garbodor","Zorua","Zoroark","Minccino","Cinccino",
  "Gothita","Gothorita","Gothitelle","Solosis","Duosion","Reuniclus","Ducklett",
  "Swanna","Vanillite","Vanillish","Vanilluxe","Deerling","Sawsbuck","Emolga",
  "Karrablast","Escavalier","Foongus","Amoonguss","Frillish","Jellicent",
  "Alomomola","Joltik","Galvantula","Ferroseed","Ferrothorn","Klink","Klang",
  "Klinklang","Tynamo","Eelektrik","Eelektross","Elgyem","Beheeyem","Litwick",
  "Lampent","Chandelure","Axew","Fraxure","Haxorus","Cubchoo","Beartic",
  "Cryogonal","Shelmet","Accelgor","Stunfisk","Mienfoo","Mienshao","Druddigon",
  "Golett","Golurk","Pawniard","Bisharp","Bouffalant","Rufflet","Braviary",
  "Vullaby","Mandibuzz","Heatmor","Durant","Deino","Zweilous","Hydreigon",
  "Larvesta","Volcarona","Cobalion","Terrakion","Virizion","Tornadus",
  "Thundurus","Reshiram","Zekrom","Landorus","Kyurem","Keldeo","Meloetta",
  "Genesect","Chespin","Quilladin","Chesnaught","Fennekin","Braixen","Delphox",
  "Froakie","Frogadier","Greninja","Bunnelby","Diggersby","Fletchling",
  "Fletchinder","Talonflame","Scatterbug","Spewpa","Vivillon","Litleo","Pyroar",
  "Flabébé","Floette","Florges","Skiddo","Gogoat","Pancham","Pangoro","Furfrou",
  "Espurr","Meowstic","Honedge","Doublade","Aegislash","Spritzee","Aromatisse",
  "Swirlix","Slurpuff","Inkay","Malamar","Binacle","Barbaracle","Skrelp",
  "Dragalge","Clauncher","Clawitzer","Helioptile","Heliolisk","Tyrunt",
  "Tyrantrum","Amaura","Aurorus","Sylveon","Hawlucha","Dedenne","Carbink",
  "Goomy","Sliggoo","Goodra","Klefki","Phantump","Trevenant","Pumpkaboo",
  "Gourgeist","Bergmite","Avalugg","Noibat","Noivern","Xerneas","Yveltal",
  "Zygarde","Diancie","Hoopa","Volcanion","Rowlet","Dartrix","Decidueye",
  "Litten","Torracat","Incineroar","Popplio","Brionne","Primarina","Pikipek",
  "Trumbeak","Toucannon","Yungoos","Gumshoos","Grubbin","Charjabug","Vikavolt",
  "Crabrawler","Crabominable","Oricorio","Cutiefly","Ribombee","Rockruff",
  "Lycanroc","Wishiwashi","Mareanie","Toxapex","Mudbray","Mudsdale","Dewpider",
  "Araquanid","Fomantis","Lurantis","Morelull","Shiinotic","Salandit",
  "Salazzle","Stufful","Bewear","Bounsweet","Steenee","Tsareena","Comfey",
  "Oranguru","Passimian","Wimpod","Golisopod","Sandygast","Palossand",
  "Pyukumuku","Type: Null","Silvally","Minior","Komala","Turtonator",
  "Togedemaru","Mimikyu","Bruxish","Drampa","Dhelmise","Jangmo-o","Hakamo-o",
  "Kommo-o","Tapu Koko","Tapu Lele","Tapu Bulu","Tapu Fini","Cosmog","Cosmoem",
  "Solgaleo","Lunala","Nihilego","Buzzwole","Pheromosa","Xurkitree",
  "Celesteela","Kartana","Guzzlord","Necrozma","Magearna","Marshadow",
  "Poipole","Naganadel","Stakataka","Blacephalon","Zeraora","Meltan",
  "Melmetal","Grookey","Thwackey","Rillaboom","Scorbunny","Raboot","Cinderace",
  "Sobble","Drizzile","Inteleon","Skwovet","Greedent","Rookidee","Corvisquire",
  "Corviknight","Blipbug","Dottler","Orbeetle","Nickit","Thievul","Gossifleur",
  "Eldegoss","Wooloo","Dubwool","Chewtle","Drednaw","Yamper","Boltund",
  "Rolycoly","Carkol","Coalossal","Applin","Flapple","Appletun","Silicobra",
  "Sandaconda","Cramorant","Arrokuda","Barraskewda","Toxel","Toxtricity",
  "Sizzlipede","Centiskorch","Clobbopus","Grapploct","Sinistea","Polteageist",
  "Hatenna","Hattrem","Hatterene","Impidimp","Morgrem","Grimmsnarl","Obstagoon",
  "Perrserker","Cursola","Sirfetch'd","Mr. Rime","Runerigus","Milcery",
  "Alcremie","Falinks","Pincurchin","Snom","Frosmoth","Stonjourner","Eiscue",
  "Indeedee","Morpeko","Cufant","Copperajah","Dracozolt","Arctozolt","Dracovish",
  "Arctovish","Duraludon","Dreepy","Drakloak","Dragapult","Zacian","Zamazenta",
  "Eternatus","Kubfu","Urshifu","Zarude","Regieleki","Regidrago","Glastrier",
  "Spectrier","Calyrex","Wyrdeer","Kleavor","Ursaluna","Basculegion",
  "Sneasler","Overqwil","Enamorus","Sprigatito","Floragato","Meowscarada",
  "Fuecoco","Crocalor","Skeledirge","Quaxly","Quaxwell","Quaquaval","Lechonk",
  "Oinkologne","Tarountula","Spidops","Nymble","Lokix","Pawmi","Pawmo","Pawmot",
  "Tandemaus","Maushold","Fidough","Dachsbun","Smoliv","Dolliv","Arboliva",
  "Squawkabilly","Nacli","Naclstack","Garganacl","Charcadet","Armarouge",
  "Ceruledge","Tadbulb","Bellibolt","Wattrel","Kilowattrel","Maschiff",
  "Mabosstiff","Shroodle","Grafaiai","Bramblin","Brambleghast","Toedscool",
  "Toedscruel","Klawf","Capsakid","Scovillain","Rellor","Rabsca","Flittle",
  "Espathra","Tinkatink","Tinkatuff","Tinkaton","Wiglett","Wugtrio","Bombirdier",
  "Finizen","Palafin","Varoom","Revavroom","Cyclizar","Orthworm","Glimmet",
  "Glimmora","Greavard","Houndstone","Flamigo","Cetoddle","Cetitan","Veluza",
  "Dondozo","Tatsugiri","Annihilape","Clodsire","Farigiraf","Dudunsparce",
  "Kingambit","Great Tusk","Scream Tail","Brute Bonnet","Flutter Mane",
  "Slither Wing","Sandy Shocks","Iron Treads","Iron Bundle","Iron Hands",
  "Iron Jugulis","Iron Moth","Iron Thorns","Frigibax","Arctibax","Baxcalibur",
  "Gimmighoul","Gholdengo","Wo-Chien","Chien-Pao","Ting-Lu","Chi-Yu",
  "Roaring Moon","Iron Valiant","Koraidon","Miraidon","Walking Wake",
  "Iron Leaves","Dipplin","Poltchageist","Sinistcha","Okidogi","Munkidori",
  "Fezandipiti","Ogerpon","Archaludon","Hydrapple","Gouging Fire","Raging Bolt",
  "Iron Boulder","Iron Crown","Terapagos","Pecharunt"
];

// Turn a display name into a PokeAPI slug
const speciesToSlug = (name) =>
  name
    .toLowerCase()
    .replace(/['.]/g, "")   // Mr. Mime → mr mime, Farfetch'd → farfetchd
    .replace(/[:]/g, "")    // Type: Null → type null
    .replace(/\s+/g, "-");  // spaces → hyphens

// Cutoff: first Pokémon introduced in Scarlet & Violet
const SV_CUTOFF_SPECIES = "Sprigatito";

// Compute index once
const svCutoffIndex = POKEMON_SPECIES.indexOf(SV_CUTOFF_SPECIES);

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
  "McDonald's Collection 2023": "https://images.pokemontcg.io/mcd23/symbol.png",
  "McDonald's Collection 2024": "https://images.pokemontcg.io/mcd24/symbol.png",
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
  "Hidden Fates": "https://images.pokemontcg.io/sm115/symbol.png",
  "Scarlet & Violet": "https://images.pokemontcg.io/sv1/symbol.png",
  "Paldea Evolved": "https://images.pokemontcg.io/sv2/symbol.png",
  "Obsidian Flames": "https://images.pokemontcg.io/sv3/symbol.png",
  "151": "https://images.pokemontcg.io/sv3pt5/symbol.png",
  "Paradox Rift": "https://images.pokemontcg.io/sv4/symbol.png",
  "Paldean Fates": "https://images.pokemontcg.io/sv4pt5/symbol.png",
  "Temporal Forces": "https://images.pokemontcg.io/sv5/symbol.png",
  "Twilight Masquerade": "https://images.pokemontcg.io/sv6/symbol.png",
  "Shrouded Fable": "https://images.pokemontcg.io/sv6pt5/symbol.png",
  "Stellar Crown": "https://images.pokemontcg.io/sv7/symbol.png",
  "Surging Sparks": "https://images.pokemontcg.io/sv8/symbol.png",
  "Prismatic Evolutions": "https://images.pokemontcg.io/sv8pt5/symbol.png",
  "Journey Together": "https://images.pokemontcg.io/sv9/symbol.png",
  "Destined Rivals": "https://images.pokemontcg.io/sv10/symbol.png",
  "Black Bolt": "https://images.pokemontcg.io/zsv10pt5/symbol.png",
  "White Flare": "https://images.pokemontcg.io/rsv10pt5/symbol.png",
  "Mega Evolution": "https://images.pokemontcg.io/me1/symbol.png",
  "Phantasmal Flames": "https://images.pokemontcg.io/me2/symbol.png"
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
    code.startsWith("sv") || code.startsWith("me") || code.startsWith("mcd");

  if (!isRectangleStyle) return { preferred: null, fallback: originalUrl };

  return {
    preferred: `/set-symbols/trimmed/${code}.png`,
    fallback: originalUrl,
  };
}

const setLogos = Object.fromEntries(
  Object.entries(setSymbols).map(([name, symbolUrl]) => {
    const logoUrl = symbolUrl.replace("/symbol.png", "/logo.png");
    return [name, logoUrl];
  })
);

const EXPANSION_VARIANT_ICONS = {
  // Pokémon TCG Classic
  "Pokémon TCG Classic (Venusaur)": "/icons/TCG_Classic_Venusaur.png",
  "Pokémon TCG Classic (Charizard)": "/icons/TCG_Classic_Charizard.png",
  "Pokémon TCG Classic (Blastoise)": "/icons/TCG_Classic_Blastoise.png",
};

// Half Deck icons that are unique (one era only)
const HALF_DECK_ICONS = {
  "Sylveon Half Deck": "/icons/Sylveon_Half_Deck.png",
  "Zoroark Half Deck": "/icons/Zoroark_Half_Deck.png",
  "Pikachu Libre Half Deck": "/icons/Pikachu_Libre_Half_Deck.png",
  "Alolan Raichu Half Deck": "/icons/Alolan_Raichu_Half_Deck.png",
  "Lycanroc Half Deck": "/icons/Lycanroc_Half_Deck.png",
  "Suicune Half Deck": "/icons/Suicune_Half_Deck.png",
  "Wigglytuff Half Deck": "/icons/Wigglytuff_Half_Deck.png",
  "Bisharp Half Deck": "/icons/Bisharp_Half_Deck.png",
  "Excadrill Half Deck": "/icons/Excadrill_Half_Deck.png",
  "Gyarados Half Deck": "/icons/Gyarados_Half_Deck.png",
  "Raichu Half Deck": "/icons/Raichu_Half_Deck.png",
  "Lucario Half Deck": "/icons/Lucario_Half_Deck.png",
  "Manaphy Half Deck": "/icons/Manaphy_Half_Deck.png",
  "Noivern Half Deck": "/icons/Noivern_Half_Deck.png",
  "Minun Half Deck": "/icons/Minun_Half_Deck.png",
  "Plusle Half Deck": "/icons/Plusle_Half_Deck.png",
};

// Half Decks that exist in both EX and XY eras
const HALF_DECK_ICONS_BY_SERIES = {
  "Latios Half Deck": {
    EX: "/icons/Latios_EX_Half_Deck.png",
    XY: "/icons/Latios_XY_Half_Deck.png",
  },
  "Latias Half Deck": {
    EX: "/icons/Latias_EX_Half_Deck.png",
    XY: "/icons/Latias_XY_Half_Deck.png",
  },
};

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
  "Base Set 2",     // ← but we will EXEMPT this one later
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
  "Skyridge"
]);

const RECT_SYMBOL_HEIGHT_PX = 14;  // visual height of rectangle-style symbols
const RECT_SYMBOL_WIDTH_PX = 24;   // visual width of rectangle-style symbols

function getSymbolsForExpansion(expansionName) {
  const name = (expansionName || "").trim();
  const baseName = name.split(" (")[0].trim(); // strips (PP), (P), (E), etc.

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
    "(E)", "(P)", "(A)", "(WC)", "(TK)", "(BA)", "(Classic Collection)", 
    "(Trainer Gallery)", "(ToT)", "(PP)", "(Galarian Gallery)", "(Shiny Vault)"
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

  if (/^pokémon tcg classic/i.test(name)) {
    return "/icons/TCG_Classic_Logo.png";
  }

  if (/^my first battle/i.test(name)) {
    return "/icons/My_First_Battle_Logo.png";
  }

  const IGNORE_SUFFIXES = [
    "(E)", "(P)", "(A)", "(WC)", "(TK)", "(BA)", "(Classic Collection)", 
    "(Trainer Gallery)", "(ToT)", "(PP)", "(Galarian Gallery)", "(Shiny Vault)"
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

  // Scarlet & Violet rarity icons
const svRarityIcons = {
  "Common": "/icons/Rarity_C.png",
  "Uncommon": "/icons/Rarity_U.png",
  "Rare": "/icons/Rarity_R.png",
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
};

function renderCardNameWithSymbols(cardName, row = {}, overrideSymbolFlags = {}) {

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
    "blacephalon"
  ];

  // Normalize name for checking
  const baseName = lower.replace(/-gx| ex| vstar| vmax| etc./g, "").trim();

  // Detect if this is an Ultra Beast card
  const isUltraBeast = ultraBeasts.some(ub => baseName.includes(ub));

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
      .map(t => {
        const src = typeIcons[t];
        if (!src) return "";
        return `<img src="${src}" class="inline-symbol" alt="${t} energy" />`;
      })
      .join("");
  }

  // Map of exact card names → base label + energy types
  const energyCardMap = {
    
    // Blend Energy
    "blend energy grpd": { base: "Blend Energy", types: ["Grass", "Fire", "Psychic", "Darkness"] },
    "blend energy wlfm": { base: "Blend Energy", types: ["Water", "Lightning", "Fighting", "Metal"] },

    // Unit Energy
    "unit energy grw": { base: "Unit Energy", types: ["Grass", "Fire", "Water"] },
    "unit energy lpm": { base: "Unit Energy", types: ["Lightning", "Psychic", "Metal"] },
    "unit energy fdy": { base: "Unit Energy", types: ["Fighting", "Darkness", "Fairy"] },
  };

  const energyConfig = energyCardMap[lower];

  if (energyConfig) {
    // Return *only* the hardcoded energy rendering for these cards
    // This avoids triggering GL / G / C / V Pokémon badge logic
    return `${energyConfig.base} ${energy(energyConfig.types)}`;
  }

    const symbolMap = {
    "GoldStar": "/icons/GoldStar.png",
    "EX": "/icons/EX_BW_XY.png",   // uppercase EX only
    "BREAK": "/icons/Break.png",
    GX: isUltraBeastGX ? "/icons/GX_red.png" : "/icons/GX_blue.png",
    "LEGEND": "/icons/Legend.png",
    "Mega": "/icons/Mega.png",
    "PrismStar": "/icons/Prism_Star.png",
    "V-Union": "/icons/V-union.png",
    "Vmax": "/icons/Vmax.png",
    "Vstar": "/icons/Vstar.png",
    "V": "/icons/V.png",
    "C": "/icons/C.png",
    "E4": "/icons/E4.png",
    "FB": "/icons/FB.png",
    "G": "/icons/G.png",
    "GL": "/icons/GL.png",
  };

  // Normalized series info
  const seriesRaw = row["Series"] || "";
  const series = seriesRaw.toLowerCase();
  const seriesCode = seriesRaw.trim().toUpperCase();
  const isSV = series.includes("s&v");

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

  // --- Scarlet & Violet ex symbol logic ---
  if (isSV && /\bex\b/.test(lowerName)) {
    const imgTag = `<img src="/icons/ex_SV.png" class="inline-symbol" alt="ex icon" />`;
    processed = processed.replace(/\bex\b/g, imgTag);
    return processed;
  }

  // --- Mega Evolution ex symbol logic (ME series + "Mega" + "ex") ---
  const isMESeries = seriesCode === "ME";
  const hasMegaWord = /\bmega\b/.test(lowerName);
  const hasExToken = /\bex\b/.test(lowerName);

  if (isMESeries && hasMegaWord && hasExToken) {
    const imgTag = `<img src="/icons/ex_ME.png" class="inline-symbol" alt="mega ex icon" />`;
    // Replace the "ex" token with the new Mega Evolution ex icon
    processed = processed.replace(/\bex\b/gi, imgTag);
    return processed;
  }

  // --- Generic symbol replacement (XY Mega, old EX, Gold Star, etc.) ---
  sortedKeys.forEach((key) => {
    if (skipSymbols && ["C", "G", "V"].includes(key)) {
      return; // skip these 3 if flag is set
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

function extractPokemonName(cardName) {
  return cardName
    .replace(/\b(Mega|Shiny|EX|GX|VSTAR|VMAX|BREAK|LEGEND|Prism Star|V-UNION|G|GL|C|FB|E4|Lv\.X|δ|STAR|Promo|Forme|Basic|Restored)\b/gi, "")
    .replace(/[^\w\s-]/gi, "") // keep letters, spaces, and hyphens
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-"); // turn spaces into hyphens
}

function getExpansionSymbolHeight(expansionName) {
  const baseName = (expansionName || "").split(" (")[0];
  const isWotc = WOTC_SETS.has(baseName) && baseName !== "Base Set 2";
  return isWotc ? "14px" : "18px";
}

const CardTable = React.memo(function CardTable({
  displayedData,
  tableRef,
  isViewingSingleSVExpansion,
  minWidths
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

        // --- S&V species + expansion logic for rarity icons ---
        const cardName = row["Card Name"] || "";
        const baseName = cardName.split(/[\s-]/)[0];
        const speciesIndex = POKEMON_SPECIES.indexOf(baseName);

        // Species introduced in S&V or later?
        const isSVSpecies =
          speciesIndex !== -1 && speciesIndex >= svCutoffIndex;

        // Use S&V rarity icons if:
        // 1. Viewing an S&V expansion OR
        // 2. Searching for a Pokémon from S&V species and onward
        const shouldUseSVSymbols =
          isViewingSingleSVExpansion || isSVSpecies;

        return (
          <tr key={i}>
            {renderCell(row["Series"], "series")}
            <td className="expansion">
              {getSymbolsForExpansion(rawExpansion).map((url, j) => {
        const { preferred, fallback } = getPreferredExpansionSymbolSrc(url);
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
                const halfIcon = getHalfDeckIcon(rawExpansion, row["Series"]);
                if (!halfIcon) return null;

                const baseName = rawExpansion;
                const series = (row["Series"] || "").toUpperCase();

                // EX Latios/Latias should be slightly smaller
                const isEXLatiosLatias =
                  (baseName === "Latios Half Deck" || baseName === "Latias Half Deck") &&
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

              // Species introduced in S&V or later?
              const isSVSpecies = speciesIndex !== -1 && speciesIndex >= svCutoffIndex;

              const shouldUseSVSymbols =
                isViewingSingleSVExpansion || isSVSpecies;

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
            <td className="rarity">
              {shouldUseSVSymbols && svRarityIcons[row["Rarity"]] ? (
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
  );
  }, (prevProps, nextProps) => {
  // ✅ RE-RENDER ONLY IF THE ACTUAL DATA SHOWN CHANGES
  return prevProps.displayedData === nextProps.displayedData;
});

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
            background: i === highlightIndex ? "#e6f2ff" : "white"
          }}
          onMouseDown={() => onSelect(exp)}
        >
          {exp}
        </li>
      ))}

    </ul>,
    document.getElementById("floating-suggestions-root")
  );
});

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmedSearchInput, setConfirmedSearchInput] = useState("");
  const [confirmedSearchField, setConfirmedSearchField] = useState("");
  const [pokemonId, setPokemonId] = useState(null);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0, width: 0 });
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const dropdownToggleRef = useRef(null);
  const fieldMenuRef = useRef(null);
  const [fieldDropdownPos, setFieldDropdownPos] = useState({ top: 0, left: 0, width: 140 });

  const containerRef = useRef(null);
  const tableRef = useRef(null);
  const generateButtonRef = useRef(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const descriptionRef = useRef(null);
  const bugRef = useRef(null);

  const BASE_FONT_SIZE = 14;
  const fontSize = BASE_FONT_SIZE;
  const [searchField, setSearchField] = useState("Card Name");
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [expansionSuggestions, setExpansionSuggestions] = useState([]);
  const [pokemonNameSuggestions] = useState(POKEMON_SPECIES);
  const [filteredData, setFilteredData] = useState([]);
  const [suggestions, setSuggestions] = useState({
    list: [],
    visible: false
  });
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showReportForm, setShowReportForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const updateReportField = (field, value) => {
  setReportData(prev => ({ ...prev, [field]: value }));
};
  const [reportData, setReportData] = useState({
    type: "", // Section 1
    errorCategory: "", // Section 2 — only for "Wrong/Missing Data"
    expansion: "",
    setNumber: "",
    description: "",
    bug: "",
  });

  useEffect(() => {
  const resize = (el) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  resize(descriptionRef.current);
  resize(bugRef.current);
}, [reportData.description, reportData.bug]);


  useEffect(() => {
    const updateSuggestionPos = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) {
        setSuggestionPos({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
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
  const handleClickOutside = (event) => {
    if (dropdownToggleRef.current?.contains(event.target)) return; // clicked the trigger
    if (fieldMenuRef.current?.contains(event.target)) return;      // clicked inside menu
    setShowFieldDropdown(false);
  };
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

  useEffect(() => {
  async function fetchData() {
  try {
    const res = await fetch("/api/cards");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    setData(data.cards);

    const cleanedExpansions = [...new Set(
      data.cards
        .map((row) => row["Expansion"])
        .filter(Boolean)
        .map((exp) => exp.split(" (")[0].trim())
    )].sort();

setExpansionSuggestions(cleanedExpansions);

  } catch (err) {
    console.error("Error loading card data:", err);
  } finally {
    setLoading(false); // ✅ <- Always unset loading here
  }
}

  fetchData();
}, []);

useEffect(() => {
  if (confirmedSearchField !== "Card Name" || !confirmedSearchInput) {
    setPokemonId(null);
    return;
  }

  const slug = speciesToSlug(confirmedSearchInput);

  // Official default forms used by PokéAPI / Bulbapedia / Serebii / Showdown
  const defaultForms = {
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

  async function fetchSprite() {
    const candidates = [];

    // Always try the literal species slug first
    candidates.push(slug);

    // Then try the “canonical default form” if one exists
    if (defaultForms[slug]) {
      candidates.push(defaultForms[slug]);
    }

    for (const s of candidates) {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${s}`);
        if (!res.ok) continue;

        const json = await res.json();
        setPokemonId(json.id);
        return;
      } catch (e) {
        // try next
      }
    }

    setPokemonId(null);
  }

  fetchSprite();
}, [confirmedSearchField, confirmedSearchInput]);

useEffect(() => {
  setHighlightIndex(-1);
}, [suggestions.list]);

useEffect(() => {
  if (inputRef.current && searchInput !== "") {
    // Highlight all text
    inputRef.current.select();
  }
}, [searchField]);

  // Resize handler to adjust font size based on widest content in each column

 const displayedData = React.useMemo(() => {
  return searchPerformed ? filteredData : data;
}, [searchPerformed, filteredData, data]);

// Detect if we are viewing a *single* S&V expansion
  const isViewingSingleSVExpansion =
    confirmedSearchField === "Expansion" &&
    confirmedSearchInput.trim() !== "" &&
    displayedData.length > 0 &&
    (displayedData[0]["Series"] || "").toLowerCase() === "s&v";

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
    year: "numeric"
  });
}, [data]);

  useLayoutEffect(() => {

    if (!searchPerformed) return;
    if (!filteredData || filteredData.length === 0) return;  // skip measuring when no rows
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
    const baseSymbolsHTML = symbols
  .map((url) => {
    const h = getExpansionSymbolHeight(expansion);
    const { preferred, fallback } = getPreferredExpansionSymbolSrc(url);
    const src = preferred || fallback || url;

    const isRect =
      !!preferred ||
      (typeof src === "string" && src.startsWith("/set-symbols/trimmed/"));

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
          (baseName === "Latios Half Deck" || baseName === "Latias Half Deck") &&
          cleanSeries === "EX";

        const size = isEXLatiosLatias ? "16px" : "20px";

        const halfIconHTML = halfIcon
          ? `<img src="${halfIcon}" class="set-symbol" style="height:${size};width:auto;" />`
          : "";

        const content = baseSymbolsHTML +  halfIconHTML + expansion;

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
        behavior: "instant"
      });
    });
  });
}, [activeSearch]);

  if (loading) return <div>Loading...</div>;

  const handleSearch = () => {
  // 1) Work with a local snapshot of what the user typed (avoids async setState timing)
  const committed = searchInput.trim();
  const trimmedInput = committed.toLowerCase();
  if (!trimmedInput) {
    setFilteredData([]);
    setConfirmedSearchInput("");
    setConfirmedSearchField(searchField);
    setActiveSearch("");        // committed term for UI
    setSearchPerformed(true);   // still mark as performed to clear previous results
    return;
  }

  // 2) Filtering (unchanged logic, just using local trimmedInput)
  const IGNORE_SUFFIXES = [
    "(E)", "(P)", "(A)", "(WC)", "(TK)", "(BA)", "(Classic Collection)", 
    "(Trainer Gallery)", "(ToT)", "(PP)", "(Galarian Gallery)", "(Shiny Vault)"
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

      if (trimmedInput === "pokémon tcg classic") {
        // any expansion that starts with "pokémon tcg classic"
        return fieldValue.startsWith(trimmedInput);
      }

      if (trimmedInput === "my first battle") {
        return fieldValue.toLowerCase().startsWith("my first battle");
      }

      const baseFieldValue = stripSuffix(fieldValue);
      const baseInput = stripSuffix(trimmedInput);
      return baseFieldValue === baseInput;
    }

    // Default fallback
    return fieldValue === trimmedInput;
  });

  if (searchField === "Expansion") {
    const normalizedInput = trimmedInput;
    const skipSortExpansions = ["celebrations"];
    const shouldSkipSort = skipSortExpansions.some(name => normalizedInput.startsWith(name));

    if (!shouldSkipSort) {
      filtered = filtered.map((item, index) => ({ ...item, __index: index }));

      filtered.sort((a, b) => {
        const aRaw = a["Set number"] || "";
        const bRaw = b["Set number"] || "";

        const rangeRegex = /^([A-Z]+)?(\d+)-(\d+)$/i;
        const singleRegex = /^([A-Z]+)?(\d{1,4})$/i;

        const aRange = aRaw.match(rangeRegex);
        const bRange = bRaw.match(rangeRegex);
        const aSingle = aRaw.match(singleRegex);
        const bSingle = bRaw.match(singleRegex);

        // Range vs. Single
        if (aRange && bSingle) {
          const aPrefix = aRange[1] || "";
          const aEnd = parseInt(aRange[3], 10);
          const bPrefix = bSingle[1] || "";
          const bNum = parseInt(bSingle[2], 10);

          const prefixCompare = aPrefix.toUpperCase().localeCompare(bPrefix.toUpperCase());
          if (prefixCompare !== 0) return prefixCompare;

          return aEnd - bNum + 1; // place range after single
        }

        if (aSingle && bRange) {
          const aPrefix = aSingle[1] || "";
          const aNum = parseInt(aSingle[2], 10);
          const bPrefix = bRange[1] || "";
          const bEnd = parseInt(bRange[3], 10);

          const prefixCompare = aPrefix.toUpperCase().localeCompare(bPrefix.toUpperCase());
          if (prefixCompare !== 0) return prefixCompare;

          return aNum - bEnd - 1; // place range after single
        }

        // Both ranges
        if (aRange && bRange) {
          const aPrefix = aRange[1] || "";
          const aStart = parseInt(aRange[2], 10);
          const bPrefix = bRange[1] || "";
          const bStart = parseInt(bRange[2], 10);

          const prefixCompare = aPrefix.toUpperCase().localeCompare(bPrefix.toUpperCase());
          if (prefixCompare !== 0) return prefixCompare;

          return aStart - bStart;
        }

        // Both singles
        if (aSingle && bSingle) {
          const aPrefix = aSingle[1] || "";
          const aNum = parseInt(aSingle[2], 10);
          const bPrefix = bSingle[1] || "";
          const bNum = parseInt(bSingle[2], 10);

          const prefixCompare = aPrefix.toUpperCase().localeCompare(bPrefix.toUpperCase());
          if (prefixCompare !== 0) return prefixCompare;

          return aNum - bNum;
        }

        // Fallback
        return aRaw.localeCompare(bRaw, undefined, { numeric: true });

        // NOTE: you had a stray "return a.__index - b.__index;" below here — keep it removed
      });

      filtered = filtered.map(({ __index, ...rest }) => rest);
    }
  }

  // 3) Commit everything atomically: data first → then “performed” flag → and UI labels
  setFilteredData(filtered);            // must be BEFORE setSearchPerformed(true)
  setActiveSearch(committed);           // keep a committed term for measuring/UI
  setConfirmedSearchInput(committed);   // for visible labels / CSV filename
  setConfirmedSearchField(searchField);
  setSearchPerformed(true);             // triggers measuring effect AFTER table renders
};


const handleDownloadCSV = () => {
  if (!filteredData.length) {
    alert("No filtered data to export.");
    return;
  }

  // 👇 Re-shape the data to match the visible columns
  const exportRows = filteredData.map((row) => ({
    "Series": row["Series"] || "",
    "Expansion": row["Expansion"] || "",
    "Card Name": (row["Card Name"] || "").replace(/\btex\b/gi, "ex"),
    "Set Number": `="${(row["Set number"] || "") + (row["Set size"] || "")}"`,
    "Rarity": row["Rarity"] || "",
    "Category": row["Category"] || "",
    "Type": row["Type"] || "",
    "Variant": row["Variant"] || "",
    "Release": row["Release"] || "",
    "Notes": row["Notes"] || "",
  }));

  // 🧼 Safe filename from search input
  const raw = confirmedSearchInput || "pokemon";
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
    delimiter: ";"
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
    <div className="search-bar-wrapper" >

  <label htmlFor="field-select" style={{ marginRight: "8px" }}>Create for:</label>

<div
  ref={dropdownToggleRef}
  style={{
    position: "relative", // ✅ anchors the absolutely positioned dropdown
    userSelect: "none",
    display: "inline-block", // ✅ ensures dropdown width aligns with trigger
  }}
>

  <div
    onClick={() => {
  const rect = dropdownToggleRef.current?.getBoundingClientRect();
  if (rect) {
    setFieldDropdownPos({
      top: rect.bottom + window.scrollY + 2,
      left: rect.left + window.scrollX,
      width: rect.width
    });
  }
  setShowFieldDropdown((prev) => !prev);
}}

    style={{
      padding: "8px 12px",
      fontSize: "14px",
      lineHeight: 1.5,
      height: "32px",
      width: "110px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      backgroundColor: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }}
  >
    {searchField}
    <span style={{ marginLeft: "6px", fontSize: "10px" }}>▼</span>
  </div>

  {showFieldDropdown &&
  ReactDOM.createPortal(
    <div
      ref={fieldMenuRef}
      style={{
        position: "absolute",
        top: fieldDropdownPos.top,
        left: fieldDropdownPos.left,
        zIndex: 99999,
        border: "1px solid #ccc",
        borderRadius: "4px",
        marginTop: 0,
        backgroundColor: "white",
        boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
        width: fieldDropdownPos.width,
        boxSizing: "border-box",
      }}
    >
      {["Card Name", "Expansion"].map((field, i, arr) => (
        <div
          key={field}
          onClick={() => {
            setSearchField(field);
            setShowFieldDropdown(false);
          }}
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            cursor: "pointer",
            borderBottom: i !== arr.length - 1 ? "1px solid #eee" : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {field}
        </div>
      ))}
    </div>,
    document.getElementById("floating-suggestions-root")
  )
}

</div>

{/* 🧠 Wrap just input and dropdown in their own positioning block */}
<div style={{ position: "relative", display: "inline-block" }}>
  <input
    ref={inputRef}
    type="text"
    value={searchInput}
    onChange={(e) => {
  const value = e.target.value;
  setSearchInput(value);

  clearTimeout(debounceRef.current);

  // If not enough characters, hide suggestions (for both modes)
  if (value.length < 2) {
    debounceRef.current = setTimeout(() => {
      setSuggestions({ list: [], visible: false });
    }, 150);
    return;
  }

  // 🔹 Expansion suggestions (unchanged)
  if (searchField === "Expansion") {
    debounceRef.current = setTimeout(() => {
      const lower = value.toLowerCase();
      const matches = expansionSuggestions.filter((exp) =>
        exp.toLowerCase().includes(lower)
      );

      setSuggestions({ list: matches, visible: true });
      setHighlightIndex(matches.length > 0 ? 0 : -1);
    }, 150);
    return;
  }

  // 🔹 Card Name suggestions — from static species list
  if (searchField === "Card Name") {
    debounceRef.current = setTimeout(() => {
      const lower = value.toLowerCase();

      const matches = pokemonNameSuggestions.filter((name) =>
        name.toLowerCase().includes(lower)
      );

      setSuggestions({ list: matches, visible: true });
      setHighlightIndex(matches.length > 0 ? 0 : -1);
    }, 150);
    return;
  }

  // Any other field → no suggestions
  setSuggestions({ list: [], visible: false });
}}

onKeyDown={(e) => {
  if (!suggestions.visible || suggestions.list.length === 0) {
  if (e.key === "Enter") {
    handleSearch();

    // NEW: trigger the visual button press
    if (generateButtonRef.current) {
      generateButtonRef.current.classList.add("pressed");
      setTimeout(() => {
        generateButtonRef.current.classList.remove("pressed");
      }, 150); // matches the click highlight duration
    }
  }
  return;
}

  if (e.key === "ArrowDown") {
    e.preventDefault();
    setHighlightIndex(prev =>
      prev + 1 < suggestions.list.length ? prev + 1 : 0
    );
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    setHighlightIndex(prev =>
      prev - 1 >= 0 ? prev - 1 : suggestions.list.length - 1
    );
  }

  if (e.key === "Enter") {
    e.preventDefault();
    // Select highlighted suggestion
    const selected = suggestions.list[highlightIndex];
    if (selected) {
      handleSelectSuggestion(selected);
      setSuggestions({ list: [], visible: false });
    }
  }
}}

    placeholder={`Enter exact ${searchField}`}
    style={{ marginRight: "12px", padding: "8px 12px", height: "32px" }}
    onBlur={() => setTimeout(() => setSuggestions({ list: [], visible: false }), 100)}
  />

  <SuggestionList
  visible={suggestions.visible}
  list={suggestions.list}
  position={suggestionPos}
  onSelect={handleSelectSuggestion}
  highlightIndex={highlightIndex}
/>

</div>

<button
  ref={generateButtonRef}
  onClick={handleSearch}
>
  Generate
</button>

{searchPerformed && (() => {
  const isHalfDeck =
    confirmedSearchField === "Expansion" &&
    confirmedSearchInput.endsWith("Half Deck");

  return (
    <div style={{
      height: "64px",
      marginLeft: "12px",
      display: "flex",
      alignItems: "center"
    }}>

      {/* Expansion logo — skipped for Half Decks */}
      {confirmedSearchField === "Expansion" &&
       confirmedSearchInput &&
       !isHalfDeck && (
        <img
          src={getLogoForExpansion(confirmedSearchInput)}
          alt={`${confirmedSearchInput} logo`}
          style={{
            height: "100%",
            maxWidth: "200px",
            objectFit: "contain"
          }}
        />
      )}

      {/* Pokémon sprite fallback logic */}
      {confirmedSearchField === "Card Name" && pokemonId && (
        <img
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`}
          alt={confirmedSearchInput}
          style={{
            height: "100%",
            objectFit: "contain"
          }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      )}

    </div>
  );
})()}

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

<button
  onClick={handleDownloadCSV}
  title="Save as .csv"
  style={{ marginLeft: "12px" }}
>
  Export
</button>

<div style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  marginLeft: "auto",
  gap: "12px",
  flexWrap: "wrap"
}}>
  {latestReleaseDate && (
    <div style={{
      padding: "4px 8px",
      backgroundColor: "#eafbe7",         // ✅ soft green background
      border: "1px solid #b6deb3",        // ✅ soft green border
      borderRadius: "12px",
      fontSize: "13px",
      fontWeight: 500,
      color: "#2e5e2a",                   // ✅ darker green text
      whiteSpace: "nowrap"
    }}>
      Up to date: {latestReleaseDate}
</div>

  )}

  <span style={{
    fontSize: "13px",
    color: "#555",
    fontStyle: "italic",
    whiteSpace: "nowrap"
  }}>
    Missing or wrong data? Bug? →
  </span>

  <button
    onClick={() => setShowReportForm(prev => !prev)}
    style={{
      backgroundColor: "#ffd",
      color: "#333",
      border: "1px solid #aaa",
      fontWeight: "bold",
    }}
  >
    Report
  </button>
</div>

  </div>
</div>
    <div className="table-scroll-wrapper">
  
{showReportForm && (
  <div style={{
    position: "absolute",
    top: "61px",
    right: "23px",
    zIndex: 99999,
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "#fffceb",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "16px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
  }}>
    <iframe
      src="https://docs.google.com/forms/d/e/1FAIpQLSdlfjhktECan559jo7fKABV08IrGDtKIr3PKD04DUE405KenQ/viewform?embedded=true"
      width="100%"
      height="800"
      frameBorder="0"
      marginHeight="0"
      marginWidth="0"
      title="Card Report Form"
      style={{ border: "none" }}
    >
      Loading…
    </iframe>
  </div>
)}

{searchPerformed && (
  <CardTable
    displayedData={displayedData}
    confirmedSearchInput={confirmedSearchInput}
    confirmedSearchField={confirmedSearchField}
    tableRef={tableRef}
    columnCount={columnCount}
    minWidths={minWidths}
    isViewingSingleSVExpansion={isViewingSingleSVExpansion}
  />
)}

        </div>
        <div className="sticky-bottom-container">
          <div className="bottom-bar-inner">
            <div className="bottom-disclaimer">
              This is a fan-made TCG database tool. Not affiliated with, endorsed or sponsored by Nintendo, The Pokémon Company or Creatures Inc.
            </div>

            <div className="bottom-total">
              Total cards: {data.length.toLocaleString("en-US")}
            </div>
          </div>
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

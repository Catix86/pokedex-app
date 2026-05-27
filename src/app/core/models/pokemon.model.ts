export interface PokemonListItem {
  name: string;
  url: string;
  id: number;
  sprite: string;
  types: string[];
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: PokemonSprites;
  types: PokemonTypeSlot[];
  stats: PokemonStatSlot[];
  abilities: PokemonAbilitySlot[];
  moves: PokemonMoveSlotFull[];
  species: { name: string; url: string };
  forms: { name: string; url: string }[];
}

export interface AbilityDetail {
  id: number;
  name: string;
  names: { name: string; language: { name: string; url: string } }[];
  flavor_text_entries: FlavorTextEntry[];
}

export interface PokemonSprites {
  front_default: string;
  back_default: string;
  front_shiny: string;
  back_shiny: string;
  other: {
    'official-artwork': {
      front_default: string;
      front_shiny: string;
    };
    dream_world: {
      front_default: string;
    };
  };
}

export interface PokemonTypeSlot {
  slot: number;
  type: { name: string; url: string };
}

export interface PokemonStatSlot {
  base_stat: number;
  effort: number;
  stat: { name: string; url: string };
}

export interface PokemonAbilitySlot {
  is_hidden: boolean;
  slot: number;
  ability: { name: string; url: string };
}

export interface MoveVersionRowDetail {
  id: string;
  versionRow: MoveByVersionRow;
  detail: MoveDetail;
}

export interface MoveDetail {
  name: string;
  nameIt: string;
  type: string;
  damageClass: string; // physical, special, status
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  flavor_text: string;
}

export interface PokemonSpecies {
  flavor_text_entries: FlavorTextEntry[];
  genera: Genus[];
  generation: { name: string; url: string };
  habitat: { name: string; url: string } | null;
  growth_rate: { name: string; url: string } | null;
  capture_rate: number;
  name: string;
  is_legendary: boolean;
  is_mythical: boolean;
  evolves_from_species: { name: string; url: string } | null;
  color: { name: string; url: string };
  shape: { name: string; url: string };
  pokedex_numbers: PokedexNumbers[];
  evolution_chain: { url: string };
  varieties: SpeciesVariety[];
}

//#region Evolution Chain
export interface EvolutionChain {
  id: number;
  chain: EvolutionLink;
}

export interface EvolutionLink {
  species: { name: string; url: string };
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionLink[];
}

export interface EvolutionDetail {
  trigger: { name: string; url: string };
  min_level: number | null;
  item: { name: string; url: string } | null;
  held_item: { name: string; url: string } | null;
  known_move: { name: string; url: string } | null;
  known_move_type: { name: string; url: string } | null;
  location: { name: string; url: string } | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  needs_overworld_rain: boolean;
  party_species: { name: string; url: string } | null;
  time_of_day: string;
  trade_species: { name: string; url: string } | null;
  turn_upside_down: boolean;
  gender: number | null;
}

// Flat evolution node for display
export interface EvolutionNode {
  name: string;
  id: number;
  sprite: string;
  details: EvolutionDetail[];
}

export interface EvolutionStage {
  nodes: EvolutionNode[];
}
// #endregion

export interface FlavorTextEntry {
  flavor_text: string;
  language: { name: string; url: string };
  version: { name: string; url: string };
}

export interface Genus {
  genus: string;
  language: { name: string; url: string };
}

export interface PokedexNumbers {
  entry_number: number;
  pokedex: { name: string; url: string };
}

// ---- RESISTENZE E VULNERABILITÀ ----

/** Tabella efficacia attacco: per ogni tipo attaccante, moltiplicatore contro questa combo di tipi */
export interface TypeEffectivenessRow {
  multiplier: number;   // 0, 0.25, 0.5, 1, 2, 4
  types: string[];      // nomi dei tipi attaccanti con quel moltiplicatore
}

// ---- VARIETIES ----

/** Slot varieties dalla species API */
export interface SpeciesVariety {
  is_default: boolean;
  pokemon: { name: string; url: string };
}

/** Variety già arricchita con id, sprite e label */
export interface PokemonVariety {
  id: number;
  name: string;          // slug, es. "charizard-mega-x"
  label: string;         // etichetta leggibile, es. "Mega X"
  isDefault: boolean;
  sprite: string;
}

// ---- INCONTRI (LOCATION AREA ENCOUNTERS) ----

/** Risposta grezza di PokéAPI per gli incontri */
export interface EncounterApiResponse {
  location_area: { name: string; url: string };
  version_details: EncounterVersionDetail[];
}

export interface EncounterVersionDetail {
  version: { name: string; url: string };
  max_chance: number;
  encounter_details: EncounterDetail[];
}

export interface EncounterDetail {
  min_level: number;
  max_level: number;
  chance: number;
  method: { name: string; url: string };
  condition_values: { name: string; url: string }[];
}

/** Una riga nella griglia degli incontri */
export interface EncounterRow {
  locationArea: string;   // slug grezzo
  locationLabel: string;  // nome leggibile (con area)
  minLevel: number;
  maxLevel: number;
  chance: number;         // % massima
  method: string;         // slug metodo
  methodIt: string;       // nome italiano del metodo
  conditions: string;     // condizioni concatenate
}

/** Gruppo per versione gioco */
export interface EncounterByVersion {
  version: string;        // slug, es. "red"
  versionLabel: string;   // etichetta, es. "Red"
  gameLabel: string;      // etichetta gruppo, es. "Red / Blue"
  rows: EncounterRow[];
}

// ---- MOSSE PER VERSION GROUP ----

/** Struttura grezza di PokéAPI per ogni mossa del Pokémon */
export interface PokemonMoveSlotFull {
  move: { name: string; url: string };
  version_group_details: VersionGroupDetail[];
}

export interface VersionGroupDetail {
  level_learned_at: number;
  move_learn_method: { name: string; url: string };
  version_group: { name: string; url: string };
}

/** Una riga nella griglia: mossa + come viene appresa in quel version group */
export interface MoveByVersionRow {
  moveName: string;       // nome grezzo (slug)
  moveNameIt: string;     // nome italiano (caricato lazy)
  levelLearnedAt: number; // 0 = non a livello
  learnMethod: string;    // slug del metodo
  learnMethodIt: string;  // etichetta italiana
}

/** Un intero version group con le sue righe, già ordinate */
export interface VersionGroupMoves {
  versionGroup: string;       // slug, es. "red-blue"
  versionGroupLabel: string;  // etichetta leggibile, es. "Red / Blue"
  rows: MoveByVersionRow[];
}

// Colori per tipo Pokémon
export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC'
};

export const STAT_LABELS: Record<string, string> = {
  'hp': 'HP',
  'attack': 'Attacco',
  'defense': 'Difesa',
  'special-attack': 'Att. Spec.',
  'special-defense': 'Dif. Spec.',
  'speed': 'Velocità',
  'total': 'Totale',
};

export const GENERATIONS: Record<string, string> = {
  'generation-i': 'Gen I (Kanto)',
  'generation-ii': 'Gen II (Johto)',
  'generation-iii': 'Gen III (Hoenn)',
  'generation-iv': 'Gen IV (Sinnoh)',
  'generation-v': 'Gen V (Unova)',
  'generation-vi': 'Gen VI (Kalos)',
  'generation-vii': 'Gen VII (Alola)',
  'generation-viii': 'Gen VIII (Galar)',
  'generation-ix': 'Gen IX (Paldea)',
};

/** Mappatura slug → etichetta leggibile per i version group */
export const VERSION_GROUP_LABELS: Record<string, string> = {
  'red-blue': 'Rosso / Blu',
  'yellow': 'Giallo',
  'gold-silver': 'Oro / Argento',
  'crystal': 'Cristallo',
  'ruby-sapphire': 'Rubino / Zaffiro',
  'emerald': 'Smeraldo',
  'firered-leafgreen': 'Rosso Fuoco / Verde Foglia',
  'diamond-pearl': 'Diamante / Perla',
  'platinum': 'Platino',
  'heartgold-soulsilver': 'Oro HeartGold / Argento SoulSilver',
  'black-white': 'Nero / Bianco',
  'black-2-white-2': 'Nero 2 / Bianco 2',
  'x-y': 'X / Y',
  'omega-ruby-alpha-sapphire': 'Rubino Omega / Zaffiro Alpha',
  'sun-moon': 'Sole / Luna',
  'ultra-sun-ultra-moon': 'Ultra Sole / Ultra Luna',
  'lets-go-pikachu-lets-go-eevee': "Let's Go Pikachu / Let's Go Eevee",
  'sword-shield': 'Spada / Scudo',
  'brilliant-diamond-and-shining-pearl': 'Diamante Lucente / Perla Splendente',
  'brilliant-diamond-shining-pearl': 'Diamante Lucente / Perla Splendente',
  'legends-arceus': 'Leggende: Arceus',
  'scarlet-violet': 'Scarlattto / Violetto'
};

/** Nomi versione gioco → etichetta italiana */
export const VERSION_LABELS_IT: Record<string, string> = {
  'red': 'Rosso',
  'blue': 'Blu',
  'yellow': 'Giallo',
  'gold': 'Oro',
  'silver': 'Argento',
  'crystal': 'Cristallo',
  'ruby': 'Rubino',
  'sapphire': 'Zaffiro',
  'emerald': 'Smeraldo',
  'firered': 'Rosso Fuoco',
  'leafgreen': 'Verde Foglia',
  'diamond': 'Diamante',
  'pearl': 'Perla',
  'platinum': 'Platino',
  'heartgold': 'Oro HeartGold',
  'soulsilver': 'Argento SoulSilver',
  'black': 'Nero',
  'white': 'Bianco',
  'black-2': 'Nero 2',
  'white-2': 'Bianco 2',
  'x': 'X',
  'y': 'Y',
  'omega-ruby': 'Rubino Omega',
  'alpha-sapphire': 'Zaffiro Alpha',
  'sun': 'Sole',
  'moon': 'Luna',
  'ultra-sun': 'Ultra Sole',
  'ultra-moon': 'Ultra Luna',
  'lets-go-pikachu': "Let's Go Pikachu",
  'lets-go-eevee': "Let's Go Eevee",
  'sword': 'Spada',
  'shield': 'Scudo',
  'the-isle-of-armor': 'Isola dell\'Armatura (DLC)',
  'the-crown-tundra': 'Le Terre Innevate della Corona (DLC)',
  'brilliant-diamond': 'Diamante Lucente',
  'shining-pearl': 'Perla Splendente',
  'legends-arceus': 'Leggende: Arceus',
  'scarlet': 'Scarlatto',
  'violet': 'Violetto',
  'the-teal-mask': 'La maschera turchese (DLC)',
  'the-indigo-disk': 'Il Disco Indaco (DLC)',
  'colosseum': 'Colosseum',
  'xd': 'XD'
};

/** Mappatura metodo di apprendimento → etichetta italiana */
export const LEARN_METHOD_IT: Record<string, string> = {
  'level-up': 'Aumento di livello',
  'machine': 'MT / MN',
  'tutor': 'Tutor',
  'egg': 'Uovo',
  'stadium-surfing-pikachu': 'Stadium',
  'light-ball-egg': 'Uovo (Light Ball)',
  'colosseum-purification': 'Purificazione',
  'xd-shadow': 'Ombra (XD)',
  'xd-purification': 'Purificazione (XD)',
  'form-change': 'Cambio forma',
  'zygarde-cube': 'Cubo Zygarde',
};

export const TRIGGER_IT: Record<string, string> = {
  'level-up': 'Aumento di livello',
  'trade': 'Scambio',
  'use-item': 'Usa oggetto',
  'shed': 'Muta (Shedinja)',
  'spin': 'Rotazione',
  'tower-of-darkness': 'Torre Oscura',
  'tower-of-waters': 'Torre Acquatica',
  'three-critical-hits': '3 colpi critici',
  'take-damage': 'Dopo danno subito',
  'other': 'Altro',
  'agile-style-move': 'Mossa stile agile',
  'strong-style-move': 'Mossa stile forte',
  'recoil-damage': 'Danno di rimbalzo',
};

export const DAMAGE_CLASS_IT: Record<string, string> = {
  'physical': 'Fisica',
  'special': 'Speciale',
  'status': 'Stato',
};

export const DAMAGE_CLASS_COLOR: Record<string, string> = {
  'physical': '#C03028',
  'special': '#6890F0',
  'status': '#78C850',
};

export const POKEDEX_NAMES_IT: Record<string, string> = {
  'national': 'Nazionale',
  'kanto': 'Kanto',
  'original-johto': 'Johto',
  'hoenn': 'Hoenn',
  'original-sinnoh': 'Sinnoh',
  'extended-sinnoh': 'Sinnoh (Est.)',
  'updated-johto': 'Johto (Agg.)',
  'original-unova': 'Unova',
  'updated-unova': 'Unova (Agg.)',
  'conquest-gallery': 'Conquest',
  'kalos-central': 'Kalos Centro',
  'kalos-coastal': 'Kalos Costa',
  'kalos-mountain': 'Kalos Monte',
  'updated-hoenn': 'Hoenn (Agg.)',
  'original-alola': 'Alola',
  'original-melemele': "Melemele",
  'original-akala': 'Akala',
  'original-ulaula': "Ula'ula",
  'original-poni': 'Poni',
  'updated-alola': 'Alola (Agg.)',
  'updated-melemele': "Melemele (Agg.)",
  'updated-akala': 'Akala (Agg.)',
  'updated-ulaula': "Ula'ula (Agg.)",
  'updated-poni': 'Poni (Agg.)',
  'letsgo-kanto': "Let's Go Kanto",
  'galar': 'Galar',
  'isle-of-armor': 'Isola Armatura',
  'crown-tundra': 'Tundra Corona',
  'hisui': 'Hisui',
  'paldea': 'Paldea',
  'kitakami': 'Kitakami',
  'blueberry': 'Mirtillo',
};

export const GROWTH_RATE_IT: Record<string, string> = {
  'slow': 'Lenta',
  'medium': 'Media',
  'fast': 'Veloce',
  'medium-slow': 'Media-Lenta',
  'slow-then-very-fast': 'Lenta poi Rapidissima',
  'fast-then-very-slow': 'Veloce poi Lentissima',
};

// Mappatura suffissi comuni → etichette italiane
export const VARIETY_LABELS: Record<string, string> = {
  'mega': 'Mega',
  'mega-x': 'Mega X',
  'mega-y': 'Mega Y',
  'gmax': 'Gigamax',
  'alola': 'Forma di Alola',
  'galar': 'Forma di Galar',
  'hisui': 'Forma di Hisui',
  'paldea': 'Forma di Paldea',
  'original': 'Forma Originale',
  'normal': 'Normale',
  'attack': 'Attacco',
  'defense': 'Difesa',
  'speed': 'Velocità',
  'plant': 'Pianta',
  'sandy': 'Sabbia',
  'trash': 'Spazzatura',
  'heat': 'Calore',
  'wash': 'Acqua',
  'refrigerator': 'Frigo',
  'fan': 'Ventola',
  'mow': 'Taglia-erba',
  'origin': 'Forma Origine',
  'sky': 'Forma Cielo',
  'zen': 'Modalità Zen',
  'pirouette': 'Forma Piroetta',
  'therian': 'Forma Totem',
  'black': 'Forma Nera',
  'white': 'Forma Bianca',
  'resolute': 'Forma Risoluta',
  'ordinary': 'Forma Ordinaria',
  'aria': 'Forma Aria',
  'blade': 'Forma Lama',
  'small': 'Taglia S',
  'average': 'Taglia M',
  'large': 'Taglia L',
  'super': 'Taglia XL',
  'confined': 'Forma Sigillata',
  'unbound': 'Forma Libera',
  'battle-bond': 'Legame Guerriero',
  'ash': 'Forma Ash',
  'school': 'Forma Banco',
  'dusk': 'Forma Crepuscolo',
  'midnight': 'Forma Mezzanotte',
  'dawn-wings': 'Ali dell\'Alba',
  'dusk-mane': 'Criniera del Crepuscolo',
  'ultra': 'Ultra',
  'rapid-strike': 'Stile Rapido',
  'single-strike': 'Stile Singolo',
  'ice': 'Ghiaccio',
  'shadow-rider': 'Cavaliere Ombra',
  'ice-rider': 'Cavaliere Ghiaccio',
  'crowned': 'Forma Incoronata',
  'hero': 'Forma Eroe',
  'roaming': 'Forma Errante',
  'three-segment': 'Tre Segmenti',
  'hangry': 'Forma Famelica',
  'noice': 'Forma Noice',
  'amped': 'Forma Amplificata',
  'low-key': 'Forma Pacata',
  'east': 'Mare Orientale',
  'west': 'Mare Occidentale',
  'red-striped': 'Striature Rosse',
  'blue-striped': 'Striature Blu',
  'white-striped': 'Striature Bianche',
  'incarnate': 'Forma Incarnata',
  'own-tempo': 'Ritmo Proprio',
  'original-cap': 'Berretto Originale',
  'partner-cap': 'Berretto Compagno',
  'world-cap': 'Berretto Mondiale',
  'hoopa-unbound': 'Libero',
  'hoopa-confined': 'Sigillato',
  'ten-percent': '10%',
  'fifty-percent': '50%',
  'complete': 'Completo',
  'dusk-lycanroc': 'Crepuscolo',
  'midday': 'Mezzogiorno',
  'eternal': 'Forma Eterna',
  'crowned-sword': 'Spada Incoronata',
  'crowned-shield': 'Scudo Incoronato',
  'paldea-combat': 'Combattimento (Paldea)',
  'paldea-blaze': 'Fuoco (Paldea)',
  'paldea-aqua': 'Acqua (Paldea)',
};

/**
 * Matrice completa efficacia tipi (Gen VI+).
 * chart[attacking][defending] = moltiplicatore
 */
export const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2, fighting: 2, ground: 2, poison: 0 },
  fairy: { fighting: 2, poison: 0.5, bug: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export const TYPE_NAMES_IT: Record<string, string> = {
  normal: 'Normale',
  fire: 'Fuoco',
  water: 'Acqua',
  electric: 'Elettro',
  grass: 'Erba',
  ice: 'Ghiaccio',
  fighting: 'Lotta',
  poison: 'Veleno',
  ground: 'Terra',
  flying: 'Volante',
  psychic: 'Psico',
  bug: 'Coleottero',
  rock: 'Roccia',
  ghost: 'Spettro',
  dragon: 'Drago',
  dark: 'Buio',
  steel: 'Acciaio',
  fairy: 'Folletto',
  none: 'Nessuno',
};

/** Metodi di incontro → italiano */
export const ENCOUNTER_METHOD_IT: Record<string, string> = {
  'walk': 'Erba alta',
  'old-rod': 'Amo vecchia',
  'good-rod': 'Amo buona',
  'super-rod': 'Superamo',
  'super-rod-spots': 'Superamo',
  'surf': 'Surf',
  'surf-spots': 'Surf',
  'dark-grass': 'Erba alta scura',
  'grass-spots': 'Chiazze d\'erba',
  'cave-spots': 'Grotta',
  'bridge-spots': 'Ponte',
  'yellow-flowers': 'Fiori gialli',
  'purple-flowers': 'Fiori viola',
  'red-flowers': 'Fiori rossi',
  'rough-terrain': 'Terreno accidentato',
  'gift': 'Regalo',
  'gift-egg': 'Uovo regalo',
  'only-one': 'Unico',
  'pokeflute': 'Flauto Pokémon',
  'squirt-bottle': 'Borraccia',
  'wailmer-pail': 'Innaffiatoio',
  'island-scan': 'Island Scan',
  'berry-piles': 'Mucchi di Bacche',
  'totem-sticker': 'Adesivo Totem',
  'wormhole': 'Wormhole',
  'seagrass': 'Alghe marine',
  'fishing': 'Pesca',
  'rock-smash': 'Spaccaroccia (Sasso)',
  'rock-smash-low': 'Spaccaroccia (Sasso)',
  'intimidation': 'Intimidazione',
  'trade': 'Scambio',
  'random': 'Casuale',
  'roaming': 'Errante',
  'ambush': 'Agguato',
  'tall-grass': 'Erba alta',
  'overworld': 'Overworld',
  'headbutt': 'Capocciata (Albero)',
  'headbutt-low': 'Capocciata (Albero)',
  'headbutt-normal': 'Capocciata (Albero)',
  'headbutt-high': 'Capocciata (Albero)',
  'hidden-grotto': 'Meandro nascosto',
  // IGNORATI (non sono metodi di incontro reali, ma li escludiamo per evitare confusione)
  'sos-encounter': 'SOS',
};
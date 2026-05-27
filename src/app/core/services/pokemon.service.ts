import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap, tap, of, catchError } from 'rxjs';
import {
  AbilityDetail,
  ENCOUNTER_METHOD_IT,
  EncounterApiResponse,
  EncounterByVersion,
  EncounterRow,
  EvolutionChain,
  EvolutionDetail,
  EvolutionLink,
  EvolutionStage,
  FlavorTextEntry,
  LEARN_METHOD_IT,
  MoveByVersionRow,
  MoveDetail,
  PokemonDetail,
  PokemonListItem,
  PokemonMoveSlotFull,
  PokemonSpecies,
  PokemonVariety,
  SpeciesVariety,
  TRIGGER_IT,
  TYPE_CHART,
  TYPE_COLORS,
  TypeEffectivenessRow,
  VARIETY_LABELS,
  VERSION_GROUP_LABELS,
  VERSION_LABELS_IT,
  VersionGroupMoves,
} from '../models/pokemon.model';

const API_BASE = 'https://pokeapi.co/api/v2';
export const TOTAL_POKEMON = 1025; //1350; // fino a Gen IX

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private http = inject(HttpClient);

  // Cache in memoria per evitare chiamate ripetute
  private listCache: PokemonListItem[] | null = null;
  private detailCache = new Map<number, PokemonDetail>();
  private speciesCache = new Map<number, PokemonSpecies>();
  private moveCache = new Map<string, MoveDetail>();
  private evolutionCache = new Map<string, EvolutionStage[]>();
  private encountersCache = new Map<number, EncounterByVersion[]>();
  /**
   * 1 chiamata per la lista base, poi 18 chiamate /type/{name} per i tipi.
   * Totale: 19 chiamate invece di 1025. La typeMap viene costruita una volta
   * sola e applicata all'intera lista in memoria.
   */
  getAllPokemon(): Observable<PokemonListItem[]> {
    if (this.listCache) return of(this.listCache);

    const ALL_TYPES = Object.keys(TYPE_COLORS);

    // 1. Lista base (solo nome + url)
    const list$ = this.http
      .get<{ results: { name: string; url: string }[] }>(
        `${API_BASE}/pokemon?limit=${TOTAL_POKEMON}&offset=0`
      )
      .pipe(
        map(res => res.results.map(p => {
          const id = this.extractIdFromUrl(p.url);
          return { name: p.name, url: p.url, id, sprite: this.getSpriteUrl(id), types: [] as string[] };
        }))
      );

    // 2. 18 chiamate /type/{name} in parallelo → mappa id→tipi
    const types$ = forkJoin(
      ALL_TYPES.map(typeName =>
        this.http
          .get<{ pokemon: { pokemon: { name: string; url: string } }[] }>(
            `${API_BASE}/type/${typeName}`
          )
          .pipe(
            map(res => ({ typeName, ids: res.pokemon.map(p => this.extractIdFromUrl(p.pokemon.url)) })),
            catchError(() => of({ typeName, ids: [] as number[] }))
          )
      )
    ).pipe(
      map(results => {
        const typeMap = new Map<number, string[]>();
        for (const { typeName, ids } of results) {
          for (const id of ids) {
            if (!typeMap.has(id)) typeMap.set(id, []);
            typeMap.get(id)!.push(typeName);
          }
        }
        return typeMap;
      })
    );

    // 3. Combina: applica la typeMap alla lista
    return forkJoin([list$, types$]).pipe(
      map(([list, typeMap]) =>
        list.map(p => ({ ...p, types: typeMap.get(p.id) ?? [] }))
      ),
      tap(list => (this.listCache = list))
    );
  }

  /** Carica la lista completa dei Pokémon con sprite e tipi */
  getAllPokemon2(): Observable<PokemonListItem[]> {
    if (this.listCache) {
      return of(this.listCache);
    }

    return this.http
      .get<{ results: { name: string; url: string }[] }>(
        `${API_BASE}/pokemon?limit=${TOTAL_POKEMON}&offset=0`
      )
      .pipe(
        map((res) =>
          res.results.map((p, i) => {
            const id = this.extractIdFromUrl(p.url);
            return {
              name: p.name,
              url: p.url,
              id,
              sprite: this.getSpriteUrl(id),
              types: [], // popolati lazy
            };
          })
        ),
        tap((list) => (this.listCache = list))
      );
  }

  /** Dettaglio completo di un singolo Pokémon */
  getPokemonDetail(id: number): Observable<PokemonDetail> {
    if (this.detailCache.has(id)) {
      return of(this.detailCache.get(id)!);
    }

    return this.http
      .get<PokemonDetail>(`${API_BASE}/pokemon/${id}`)
      .pipe(tap((p) => {
        return this.detailCache.set(id, p);
      }));
  }

  /** Dati della specie (descrizione, generazione, ecc.) */
  getPokemonSpecies(id: number): Observable<PokemonSpecies> {
    if (this.speciesCache.has(id)) {
      return of(this.speciesCache.get(id)!);
    }

    return this.http
      .get<PokemonSpecies>(`${API_BASE}/pokemon-species/${id}`)
      .pipe(tap((s) => {
        return this.speciesCache.set(id, s);
      }));
  }

  /** Dettaglio completo di un singolo Pokémon */
  getPokemonAbility(url: string): Observable<AbilityDetail> {
    return this.http
      .get<AbilityDetail>(url)
      .pipe(tap((p) => {
        return p;
      }));
  }

  /** Carica la catena evolutiva e la trasforma in stages per il display */
  getEvolutionChain(url: string): Observable<EvolutionStage[]> {
    if (this.evolutionCache.has(url)) return of(this.evolutionCache.get(url)!);
    return this.http.get<EvolutionChain>(url).pipe(
      map(chain => this.flattenChain(chain.chain)),
      tap(stages => this.evolutionCache.set(url, stages))
    );
  }

  /** Carica dettaglio + specie insieme */
  getPokemonFull(
    id: number
  ): Observable<{ detail: PokemonDetail; species: PokemonSpecies }> {
    return this.getPokemonDetail(id).pipe(
      switchMap((detail) =>
        this.getPokemonSpecies(id).pipe(
          map((species) => ({ detail, species }))
        )
      )
    );
  }

  /** Carica i tipi di un batch di Pokémon (usato per pre-populate la lista) */
  enrichWithTypes(items: PokemonListItem[]): Observable<PokemonListItem[]> {
    const requests = items.map((item) =>
      this.getPokemonDetail(item.id).pipe(
        map((detail) => ({
          ...item,
          types: detail.types.map((t) => t.type.name),
        }))
      )
    );
    return forkJoin(requests);
  }

  private extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }

  getSpriteUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  getSmallSpriteUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }

  formatName(name: string): string {
    const result = [];

    const nameParts = name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

    if (nameParts.length > 1 && nameParts[1].toLowerCase() === 'mega') {
      // Gestisce i nomi delle forme Mega, es. "charizard-mega-x" → "Mega Charizard X"
      result.push('Mega');

      if (nameParts.length > 2) {
        result.push(nameParts[0]);
        result.push(...nameParts.slice(2));
      } else {
        result.push(nameParts[0]);
      }
    } else if (name.includes('-alola') || name.includes('-galar') || name.includes('-hisui')) {
      result.push(nameParts[0]);
      result.push('di');
      result.push(nameParts[1]);
    } else if (name.includes('-gmax')) {
      result.push(nameParts[0]);
      result.push('Gigamax');
    } else if (name.includes('-male')) {
      result.push(nameParts[0]);
      result.push('Maschio');
    } else if (name.includes('-female')) {
      result.push(nameParts[0]);
      result.push('Femmina');
    } else {
      result.push(...nameParts);
    }

    return result.join(' ');
  }

  padId(id: number): string {
    return id.toString().padStart(4, '0');
  }

  public getTypeName(type: string): string {
    switch (type) {
      case 'normal':
        return 'Normale';
      case 'fighting':
        return 'Lotta';
      case 'flying':
        return 'Volante';
      case 'poison':
        return 'Veleno';
      case 'ground':
        return 'Terra';
      case 'rock':
        return 'Roccia';
      case 'bug':
        return 'Coleottero';
      case 'ghost':
        return 'Spettro';
      case 'steel':
        return 'Acciaio';
      case 'fire':
        return 'Fuoco';
      case 'water':
        return 'Acqua';
      case 'grass':
        return 'Erba';
      case 'electric':
        return 'Elettro';
      case 'psychic':
        return 'Psico';
      case 'ice':
        return 'Ghiaccio';
      case 'dragon':
        return 'Drago';
      case 'dark':
        return 'Buio';
      case 'fairy':
        return 'Folletto';
      default:
        return type;
    }
  }

  public getColorName(color: string): string {
    switch (color) {
      case 'black':
        return 'Nero';
      case 'blue':
        return 'Blu';
      case 'brown':
        return 'Marrone';
      case 'gray':
        return 'Grigio';
      case 'green':
        return 'Verde';
      case 'pink':
        return 'Rosa';
      case 'purple':
        return 'Viola';
      case 'red':
        return 'Rosso';
      case 'white':
        return 'Bianco';
      case 'yellow':
        return 'Giallo';
      default:
        return color;
    }
  }

  public getGrowthRateName(rate: string): string {
    switch (rate) {
      case 'slow':
        return 'Lento';
      case 'medium':
        return 'Medio';
      case 'medium-slow':
        return 'Medio-Lento';
      case 'medium-fast':
        return 'Medio-Veloce';
      case 'fast':
        return 'Veloce';
      case 'fluctuating':
        return 'Fluttuante';
      case 'slow-then-very-fast':
        return 'Lento poi Molto Veloce';
      case 'fast-then-very-slow':
        return 'Veloce poi Molto Lento';
      default:
        return rate;
    }
  }

  public getCatchRateDescription(rate: number): string {
    if (rate >= 250) {
      return 'Facilissimo (più dell\'85% di successo)';
    } else if (rate >= 200 && rate < 250) {
      return 'Molto Facile (dal 65% all\'85% di successo)';
    } else if (rate >= 120 && rate < 200) {
      return 'Facile (dal 40% al 65% di successo)';
    } else if (rate >= 90 && rate < 120) {
      return 'Moderato (dal 30% al 40% di successo)';
    } else if (rate >= 45 && rate < 90) {
      return 'Basso (dal 15% al 30% di successo)';
    } else if (rate >= 25 && rate < 45) {
      return 'Difficile (dall\'8% al 15% di successo)';
    } else if (rate >= 5 && rate < 25) {
      return 'Molto Difficile (dal 2% all\'8% di successo)';
    } else {
      return 'Estremo (solo l\'1% di successo)';
    }
  }

  // ---- VARIETIES ----
  private varietiesCache = new Map<number, PokemonVariety[]>();

  /**
   * Restituisce le varieties di una specie come array PokemonVariety[].
   * Ogni variety viene arricchita con id e sprite tramite la cache detailCache.
   */
  getVarieties(species: PokemonSpecies, currentId: number): Observable<PokemonVariety[]> {
    if (this.varietiesCache.has(currentId)) {
      return of(this.varietiesCache.get(currentId)!);
    }

    const slots: SpeciesVariety[] = species.varieties ?? [];
    if (slots.length <= 1) {
      return of([]);
    }

    const requests = slots.map(slot => {
      const id = this.extractIdFromUrl(slot.pokemon.url);
      return of<PokemonVariety>({
        id,
        name: slot.pokemon.name,
        label: this.buildVarietyLabel(slot.pokemon.name, species),
        isDefault: slot.is_default,
        sprite: this.getSpriteUrl(id),
      });
    });

    return forkJoin(requests).pipe(
      tap(list => this.varietiesCache.set(currentId, list))
    );
  }

  /** Deriva un'etichetta leggibile dal nome slug della variety */
  buildVarietyLabel(pokemonName: string, species: PokemonSpecies): string {
    const speciesName = species.name;
    // Rimuove il prefisso della specie base, es. "charizard-mega-x" → "mega-x"
    const suffix = pokemonName.startsWith(speciesName + '-')
      ? pokemonName.slice(speciesName.length + 1)
      : pokemonName;

    if (!suffix || suffix === pokemonName) {
      return this.formatName(pokemonName);
    }

    return VARIETY_LABELS[suffix] ?? this.formatName(suffix);
  }

  // ---- MOSSE PER VERSION GROUP ----

  /** Carica i dettagli di una mossa */
  getMoveDetail(name: string): Observable<MoveDetail> {
    if (this.moveCache.has(name)) {
      return of(this.moveCache.get(name)!);
    }

    return this.http.get<any>(`${API_BASE}/move/${name}`).pipe(
      map(data => {
        const nameIt = data.names?.find((n: any) => n.language.name === 'it')?.name
          ?? data.names?.find((n: any) => n.language.name === 'en')?.name
          ?? this.formatName(name);

        const move: MoveDetail = {
          name,
          nameIt,
          type: data.type?.name ?? '',
          damageClass: data.damage_class?.name ?? 'status',
          power: data.power,
          accuracy: data.accuracy,
          pp: data.pp,
          flavor_text: data.flavor_text_entries?.filter((f: FlavorTextEntry) => f.language.name === 'it')?.map((f: any) => f.flavor_text)[0] ?? 'N.D.',
        };
        this.moveCache.set(name, move);
        return move;
      }),
      catchError(() => of({
        name, nameIt: this.formatName(name),
        type: '', damageClass: 'status', power: null, accuracy: null, pp: null, flavor_text: 'N.D.'
      }))
    );
  }

  /** Carica le mosse (in batch per non sovraccaricare) */
  getPokemonMoves(detail: PokemonDetail, limit = 30): Observable<MoveDetail[]> {
    const moves = detail.moves.slice(0, limit);
    return forkJoin(moves.map(m => this.getMoveDetail(m.move.name)));
  }

  /** Carica le mosse (in batch per non sovraccaricare) */
  getPokemonSelectedMoves(rows: MoveByVersionRow[]): Observable<MoveDetail[]> {
    const moves = rows.map(r => r.moveName);
    return forkJoin(moves.map(m => this.getMoveDetail(m)));
  }

  private movesByVersionCache = new Map<number, VersionGroupMoves[]>();

  /**
   * Costruisce la struttura VersionGroupMoves[] a partire dai dati grezzi
   * del Pokémon, poi arricchisce i nomi delle mosse in italiano in batch.
   */
  getMovesByVersionGroup(detail: PokemonDetail): Observable<VersionGroupMoves[]> {
    if (this.movesByVersionCache.has(detail.id)) {
      return of(this.movesByVersionCache.get(detail.id)!);
    }

    // Costruiamo la mappa version_group → righe senza nome italiano (prima passata veloce)
    const vgMap = new Map<string, VersionGroupMoves>();

    for (const slot of (detail.moves as PokemonMoveSlotFull[])) {
      for (const vgd of slot.version_group_details) {
        const vgKey = vgd.version_group.name;
        if (!vgMap.has(vgKey)) {
          vgMap.set(vgKey, {
            versionGroup: vgKey,
            versionGroupLabel: VERSION_GROUP_LABELS[vgKey] ?? this.formatName(vgKey),
            rows: [],
          });
        }
        vgMap.get(vgKey)!.rows.push({
          moveName: slot.move.name,
          moveNameIt: this.formatName(slot.move.name), // placeholder
          levelLearnedAt: vgd.level_learned_at,
          learnMethod: vgd.move_learn_method.name,
          learnMethodIt: LEARN_METHOD_IT[vgd.move_learn_method.name] ?? this.formatName(vgd.move_learn_method.name),
        });
      }
    }

    // Ordina i version group per ordine canonico (chiavi di VERSION_GROUP_LABELS)
    const vgOrder = Object.keys(VERSION_GROUP_LABELS);
    const stages = Array.from(vgMap.values()).sort((a, b) => {
      const ia = vgOrder.indexOf(a.versionGroup);
      const ib = vgOrder.indexOf(b.versionGroup);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    // Ordina le righe di ogni stage: prima per metodo, poi per livello, poi per nome
    for (const vg of stages) {
      vg.rows.sort((a, b) => {
        const methodOrder = ['level-up', 'machine', 'tutor', 'egg'];
        const ma = methodOrder.indexOf(a.learnMethod);
        const mb = methodOrder.indexOf(b.learnMethod);
        if (ma !== mb) return (ma === -1 ? 99 : ma) - (mb === -1 ? 99 : mb);
        if (a.levelLearnedAt !== b.levelLearnedAt) return a.levelLearnedAt - b.levelLearnedAt;
        return a.moveName.localeCompare(b.moveName);
      });
    }

    // Recupera i nomi italiani in modo lazy: raccoglie tutte le mosse uniche e le chiama
    const uniqueMoveNames = [...new Set(stages.flatMap(vg => vg.rows.map(r => r.moveName)))];

    // Usa la cache delle mosse già presente; chiama solo quelle mancanti
    const uncached = uniqueMoveNames.filter(n => !this.moveCache.has(n));

    const enrichAndReturn = () => {
      for (const vg of stages) {
        for (const row of vg.rows) {
          const cached = this.moveCache.get(row.moveName);
          if (cached) row.moveNameIt = cached.nameIt;
        }
      }
      this.movesByVersionCache.set(detail.id, stages);
      return stages;
    };

    if (uncached.length === 0) {
      return of(enrichAndReturn());
    }

    // Batch di al massimo 20 richieste parallele per non esagerare
    const batchSize = 20;
    const batches: string[][] = [];
    for (let i = 0; i < uncached.length; i += batchSize) {
      batches.push(uncached.slice(i, i + batchSize));
    }

    return batches.reduce(
      (acc$, batch) => acc$.pipe(
        switchMap(() => forkJoin(batch.map(n => this.getMoveDetail(n).pipe(catchError(() => of(null))))))
      ),
      of(null as any)
    ).pipe(
      map(() => enrichAndReturn()),
      tap(result => this.movesByVersionCache.set(detail.id, result))
    );
  }

  formatEvolutionTrigger(details: EvolutionDetail[]): string {
    if (!details || details.length === 0) return '';
    const d = details[0];
    const parts: string[] = [];
    const trigger = TRIGGER_IT[d.trigger?.name] ?? d.trigger?.name ?? '';
    parts.push(trigger);
    if (d.min_level) parts.push(`Liv. ${d.min_level}`);
    if (d.item) parts.push(`Oggetto: ${this.formatName(d.item.name)}`);
    if (d.held_item) parts.push(`Tieni: ${this.formatName(d.held_item.name)}`);
    if (d.known_move) parts.push(`Mossa: ${this.formatName(d.known_move.name)}`);
    if (d.location) parts.push(`Luogo: ${this.formatName(d.location.name)}`);
    if (d.min_happiness) parts.push(`Amicizia ≥ ${d.min_happiness}`);
    if (d.min_affection) parts.push(`Affetto ≥ ${d.min_affection}`);
    if (d.time_of_day) parts.push(d.time_of_day === 'day' ? 'Di giorno' : d.time_of_day === 'night' ? 'Di notte' : '');
    if (d.needs_overworld_rain) parts.push('Con pioggia');
    if (d.trade_species) parts.push(`Scambia con: ${this.formatName(d.trade_species.name)}`);
    if (d.turn_upside_down) parts.push('Capovolgi console');
    if (d.gender === 1) parts.push('Femmina');
    if (d.gender === 2) parts.push('Maschio');
    return parts.filter(Boolean).join(' · ');
  }

  // ---- TIPO EFFICACIA ----

  /**
   * Calcola l'efficacia di tutti i 18 tipi attaccanti contro la combinazione
   * di tipi del Pokémon, e restituisce un array raggruppato per moltiplicatore.
   */
  computeTypeEffectiveness(types: string[]): TypeEffectivenessRow[] {
    const ALL_TYPES = Object.keys(TYPE_CHART);
    const multipliers: Record<string, number> = {};

    for (const attacking of ALL_TYPES) {
      let mult = 1;
      for (const defending of types) {
        const row = TYPE_CHART[attacking] ?? {};
        const val = row[defending] ?? 1;
        mult *= val;
      }
      multipliers[attacking] = mult;
    }

    // Raggruppa per moltiplicatore
    const groups = new Map<number, string[]>();
    for (const [type, mult] of Object.entries(multipliers)) {
      if (!groups.has(mult)) groups.set(mult, []);
      groups.get(mult)!.push(type);
    }

    // Aggiunge i moltiplicatori mancanti con array vuoti (per ordinamento)
    for (const m of [4, 2, 1, 0.5, 0.25, 0]) {
      if (!groups.has(m)) {
        groups.set(m, ['none']);
      }
    }

    // Rimuove il moltiplicatore 1x
    groups.delete(1);

    // Ordine display: 4× → 2× → 1× → ½× → ¼× → 0×
    const ORDER = [4, 2, 1, 0.5, 0.25, 0];
    return ORDER
      .filter(m => groups.has(m))
      .map(m => ({ multiplier: m, types: groups.get(m)!.sort() }));
  }

  /** Formatta il moltiplicatore come stringa leggibile */
  formatMultiplier(m: number): string {
    if (m === 0) return '0×';
    if (m === 0.25) return '¼×';
    if (m === 0.5) return '½×';
    if (m === 1) return '1×';
    if (m === 2) return '2×';
    if (m === 4) return '4×';
    return m + '×';
  }

  /** Converte il chain annidato in array di stage [{nodes}] */
  private flattenChain(link: EvolutionLink): EvolutionStage[] {
    const stages: EvolutionStage[][] = [];
    this.collectStages(link, stages, 0);

    // Appiattisce in array di stage con tutti i nodi per quel livello
    const result: EvolutionStage[] = [];
    for (const stageArr of stages) {
      for (const stage of stageArr) {
        const existing = result[stages.indexOf(stageArr)];
        if (existing) {
          existing.nodes.push(...stage.nodes);
        } else {
          result[stages.indexOf(stageArr)] = { nodes: [...stage.nodes] };
        }
      }
    }
    return result.filter(Boolean);
  }

  private collectStages(link: EvolutionLink, stages: EvolutionStage[][], depth: number): void {
    if (!stages[depth]) stages[depth] = [];
    const id = this.extractIdFromUrl(link.species.url);
    stages[depth].push({
      nodes: [{
        name: link.species.name,
        id,
        sprite: this.getSpriteUrl(id),
        details: link.evolution_details,
      }]
    });
    for (const next of link.evolves_to) {
      this.collectStages(next, stages, depth + 1);
    }
  }

  // ---- INCONTRI ----

  /**
   * Chiama l'endpoint location_area_encounters del Pokémon,
   * raggruppa i risultati per versione gioco e li ordina cronologicamente.
   */
  getEncounters(pokemonId: number): Observable<EncounterByVersion[]> {
    if (this.encountersCache.has(pokemonId)) {
      return of(this.encountersCache.get(pokemonId)!);
    }

    return this.http
      .get<EncounterApiResponse[]>(
        `${API_BASE}/pokemon/${pokemonId}/encounters`
      )
      .pipe(
        map(data => this.buildEncountersByVersion(data)),
        tap(result => this.encountersCache.set(pokemonId, result))
      );
  }

  private buildEncountersByVersion(data: EncounterApiResponse[]): EncounterByVersion[] {
    // Mappa version slug → EncounterByVersion
    const versionMap = new Map<string, EncounterByVersion>();

    for (const locationEntry of data) {
      const rawLocation = locationEntry.location_area.name;
      const locationLabel = this.formatLocationArea(rawLocation);

      for (const vd of locationEntry.version_details) {
        const vSlug = vd.version.name;

        if (!versionMap.has(vSlug)) {
          versionMap.set(vSlug, {
            version: vSlug,
            versionLabel: VERSION_LABELS_IT[vSlug] ?? this.formatName(vSlug),
            gameLabel: VERSION_LABELS_IT[vSlug] ?? this.formatName(vSlug),
            rows: [],
          });
        }

        const group = versionMap.get(vSlug)!;

        for (const enc of vd.encounter_details) {
          const methodSlug = enc.method.name;
          const conditions = enc.condition_values
            .map(c => this.formatName(c.name))
            .join(', ');

          // Verifica se esiste già una riga per questa location+metodo+condizioni
          const existing = group.rows.find(r =>
            r.locationArea === rawLocation &&
            r.methodIt === (ENCOUNTER_METHOD_IT[methodSlug] ?? this.formatName(methodSlug)) &&
            r.conditions === conditions &&
            r.minLevel === enc.min_level &&
            r.maxLevel === enc.max_level
          );

          const ignore = enc.method.name === 'sos-encounter' || enc.method.name === 'colosseum-bonus-disc-jpn' || enc.method.name === 'dark-grass';

          if (!existing && !ignore) {
            group.rows.push({
              locationArea: rawLocation,
              locationLabel,
              minLevel: enc.min_level,
              maxLevel: enc.max_level,
              chance: enc.chance,
              method: methodSlug,
              methodIt: ENCOUNTER_METHOD_IT[methodSlug] ?? this.formatName(methodSlug),
              conditions,
            });
          }
        }

        // Se già esiste una riga per la stessa location+metodo, teniamo solo quella
        // con chance massima (deduplicazione)
        group.rows = this.deduplicateRows(group.rows);
      }
    }

    // Ordina le versioni in ordine cronologico
    const versionOrder = Object.keys(VERSION_LABELS_IT);
    const sorted = Array.from(versionMap.values()).sort((a, b) => {
      const ia = versionOrder.indexOf(a.version);
      const ib = versionOrder.indexOf(b.version);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    // Ordina le righe per location poi per metodo
    for (const v of sorted) {
      v.rows.sort((a, b) =>
        a.locationLabel.localeCompare(b.locationLabel) ||
        a.methodIt.localeCompare(b.methodIt)
      );
    }

    return sorted;
  }

  private deduplicateRows(rows: EncounterRow[]): EncounterRow[] {
    const seen = new Map<string, EncounterRow>();
    for (const row of rows) {
      const key = `${row.locationArea}|${row.method}|${row.conditions}`;
      const existing = seen.get(key);
      if (!existing || row.chance > existing.chance) {
        seen.set(key, row);
      }
    }
    return Array.from(seen.values());
  }

  /** Converte uno slug location-area in etichetta leggibile */
  formatLocationArea(slug: string): string {
    // Rimuove i prefissi ridondanti come "kanto-", "alola-", "galar-", "hisui-"
    let fixed = slug.replace(/^(kanto|alola|galar|hisui|sinnoh|johto|kalos)-/, '');

    fixed = fixed
      .replace(/-1f/, ' (1° piano)')
      .replace(/-2f/, ' (2° piano)')
      .replace(/-3f/, ' (3° piano)')
      .replace(/-4f/, ' (4° piano)')
      .replace(/-5f/, ' (5° piano)')
      .replace(/-6f/, ' (6° piano)')
      .replace(/-7f/, ' (7° piano)')
      .replace(/-8f/, ' (8° piano)')
      .replace(/-9f/, ' (9° piano)')
      .replace(/-b1f/, ' (1° piano)')
      .replace(/-b2f/, ' (2° piano)')
      .replace(/-b3f/, ' (3° piano)')
      .replace(/-b4f/, ' (4° piano)')
      .replace(/-b5f/, ' (5° piano)')
      .replace(/-b6f/, ' (6° piano)')
      .replace(/-b7f/, ' (7° piano)')
      .replace(/-b8f/, ' (8° piano)')
      .replace(/-b9f/, ' (9° piano)');

    // Traduce in italiano e formatta ogni parola, mantenendo i numeri invariati
    const trans = fixed
      .replace(/route/, 'Percorso')
      .replace(/cave/, 'Grotta')
      .replace(/sea/, 'Mare')
      .replace(/island/, 'Isola')
      .replace(/mountain/, 'Montagna')
      .replace(/power-plant/, 'Centrale Elettrica')
      .replace(/safari-zone/, 'Zona Safari')
      .replace(/sky-pillar/, 'Pilastro Celeste')
      .replace(/victory-road/, 'Via Vittoria')
      .replace(/rock-tunnel/, 'Tunnel Roccioso')
      .replace(/cerulean-cave/, 'Grotta Celeste')
      .replace(/seafloor-cavern/, 'Caverna del Fondale Marino')
      .replace(/mirage-island/, 'Isola Mirage')
      .replace(/dark-cave/, 'Grotta Oscura')
      .replace(/ice-path/, 'Sentiero di Ghiaccio')
      .replace(/tanoby-ruins/, 'Rovine Tanoby')
      .replace(/alley-of-giants/, 'Viale dei Giganti')
      .replace(/ancient-tomb/, 'Tomba Antica')
      .replace(/canyon/, 'Canyon')
      .replace(/forest/, 'Foresta')
      .replace(/garden/, 'Giardino')
      .replace(/graveyard/, 'Cimitero')
      .replace(/ruins/, 'Rovine')
      .replace(/swamp/, 'Palude')
      .replace(/volcanocave/, 'Grotta Vulcanica')
      .replace(/ultra-space/, 'Ultraspazio')
      .replace(/pallet-town/, 'Borgo Pallet')
      .replace(/viridian-city/, 'Smeraldopoli')
      .replace(/pewter-city/, 'Bastionopoli')
      .replace(/cerulean-city/, 'Celestopoli')
      .replace(/vermillion-city/, 'Porto Selcepoli')
      .replace(/lavender-town/, 'Lavandonia')
      .replace(/fuchsia-city/, 'Fucsia City')
      .replace(/cinnabar-island/, 'Isola Cannella')
      .replace(/indigo-plateau/, 'Pianura Indigo')
      .replace(/saffron-city/, 'Saffron City')
      .replace(/celadon-city/, 'Smeraldopoli')
      .replace(/laverre-city/, 'Luminopoli')
      .replace(/dendemille-town/, 'Dendemille Town')
      .replace(/couriway-town/, 'Couriway Town')
      .replace(/cyllage-city/, 'Cyllage City')
      .replace(/shalour-city/, 'Shalour City')
      .replace(/coumarine-city/, 'Coumarine City')
      .replace(/lumiose-city/, 'Lumiose City')
      .replace(/geosenge-town/, 'Geosenge Town')
      .replace(/anistar-city/, 'Anistar City')
      .replace(/snowbelle-city/, 'Snowbelle City')
      .replace(/kalos-route/, 'Strada di Kalos')
      .replace(/kings-rock/, 'Roccia del Re')
      .replace(/sachet/, 'Sacca')
      .replace(/whipped-dream/, 'Panna Dolce')
      .replace(/luminous-moss/, 'Muschio Luminoso')
      .replace(/snow-park/, 'Parco Neve')
      .replace(/red-cave/, 'Grotta Rossa')
      .replace(/blue-cave/, 'Grotta Blu')
      .replace(/yellow-cave/, 'Grotta Gialla')
      .replace(/bell-tower/, ' Torre Campana');


    return trans
      .split('-')
      .map(w => {
        // Mantieni numeri invariati
        if (/^\d+$/.test(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ')
      // Rimuovi suffisso "-area" ridondante alla fine
      .replace(/ Area$/, '');
  }
}

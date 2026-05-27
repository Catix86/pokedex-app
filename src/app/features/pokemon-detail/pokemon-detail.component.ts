import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { switchMap } from 'rxjs';
import { PokemonService, TOTAL_POKEMON } from '../../core/services/pokemon.service';
import {
  PokemonDetail,
  PokemonSpecies,
  TYPE_COLORS,
  STAT_LABELS,
  GENERATIONS,
  PokemonAbilitySlot,
  AbilityDetail,
  PokedexNumbers,
  DAMAGE_CLASS_IT,
  DAMAGE_CLASS_COLOR,
  POKEDEX_NAMES_IT,
  GROWTH_RATE_IT,
  MoveDetail,
  EvolutionLink,
  EvolutionStage,
  EvolutionDetail,
  PokemonVariety,
  TYPE_NAMES_IT,
  TypeEffectivenessRow,
  PokemonStatSlot,
} from '../../core/models/pokemon.model';
import { PokemonMovesByVersionComponent } from '../pokemon-moves-by-version/pokemon-moves-by-version.component';
import { PokemonEncountersComponent } from '../pokemon-encounters/pokemon-encounters.component';

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    RouterLink, 
    PokemonMovesByVersionComponent, 
    PokemonEncountersComponent
  ],
  templateUrl: './pokemon-detail.component.html',
  styleUrl: './pokemon-detail.component.scss',
})
export class PokemonDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public service = inject(PokemonService);
  public abilityInfo = signal<string>('');
  public showInfo = signal<boolean>(false);
  public editMode = signal<boolean>(false);
  public typedId = signal<string>('');

  evolutions = signal<EvolutionStage[]>([]);
  detail = signal<PokemonDetail | null>(null);
  species = signal<PokemonSpecies | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  loadingMoves = signal(false);
  showShiny = signal(false);
  ability = signal<AbilityDetail[]>([]);
  moves = signal<MoveDetail[]>([]);
  evolutionChain = signal<EvolutionLink | null>(null);
  varieties = signal<PokemonVariety[]>([]);

  readonly TYPE_COLORS = TYPE_COLORS;
  readonly STAT_LABELS = STAT_LABELS;
  readonly GENERATIONS = GENERATIONS;
  readonly DAMAGE_CLASS_IT = DAMAGE_CLASS_IT;
  readonly DAMAGE_CLASS_COLOR = DAMAGE_CLASS_COLOR;
  readonly POKEDEX_NAMES_IT = POKEDEX_NAMES_IT;
  readonly GROWTH_RATE_IT = GROWTH_RATE_IT;
  readonly TYPE_NAMES_IT = TYPE_NAMES_IT;
  readonly TOTAL_POKEMON = TOTAL_POKEMON;

  private listPage = 1;

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.listPage = Number(params.get('page'));
          return this.service.getPokemonFull(id);
        })
      )
      .subscribe({
        next: ({ detail, species }) => {
          this.detail.set(detail);
          this.species.set(species);
          this.loading.set(false);
          this.loadAbilities(detail.abilities);

          // Carica mosse
          this.loadingMoves.set(true);
          this.service.getPokemonMoves(detail, 50).subscribe(moves => {
            this.moves.set(moves);
            this.loadingMoves.set(false);
          });

          // Carica catena evolutiva
          if (species.evolution_chain?.url) {
            this.service.getEvolutionChain(species.evolution_chain.url)
              .subscribe(stages => this.evolutions.set(stages));
          }

          // Varieties
          this.service.getVarieties(species, detail.id).subscribe(vars => {
            this.varieties.set(vars.filter(v =>
              !v.name.endsWith('-pop-star') &&
              !v.name.endsWith('-rock-star') &&
              !v.name.endsWith('-belle') &&
              !v.name.endsWith('-phd') &&
              !v.name.endsWith('-libre') &&
              !v.name.endsWith('-cap') &&
              !v.name.endsWith('-cosplay') &&
              !v.name.endsWith('-starter')
            ));
          });
        },
        error: () => {
          this.error.set('Pokemon non trovato.');
          this.loading.set(false);
        },
      });
  }

  public getFilteredPokedexNumers(numbers: PokedexNumbers[]): PokedexNumbers[] {
    const result = numbers.filter((n) =>
      !n.pokedex.name.startsWith('updated') &&
      !n.pokedex.name.startsWith('conquest') &&
      !n.pokedex.name.startsWith('letsgo') &&
      !n.pokedex.name.startsWith('blueberry') &&
      !n.pokedex.name.endsWith('melemele') &&
      !n.pokedex.name.endsWith('akala') &&
      !n.pokedex.name.endsWith('ulaula') &&
      !n.pokedex.name.endsWith('poni') &&
      !n.pokedex.name.startsWith('isle') &&
      !n.pokedex.name.startsWith('crown') &&
      !n.pokedex.name.startsWith('extended') &&
      !n.pokedex.name.startsWith('kitakami') &&
      !n.pokedex.name.startsWith('lumiose') &&
      !n.pokedex.name.startsWith('national') &&
      !n.pokedex.name.startsWith('champions')
    ).map((n) => {
      if (n.pokedex.name === 'national') {
        return { ...n, pokedex: { ...n.pokedex, name: 'Nazionale' } };
      }

      if (n.pokedex.name.startsWith('original')) {
        return { ...n, pokedex: { ...n.pokedex, name: n.pokedex.name.replace('original-', '') } };
      }

      return n;
    });

    return result;
  }

  public showAbilityInfo(ability: PokemonAbilitySlot): void {
    const desc = this.getAbilityDescription(ability);

    if (this.abilityInfo() !== desc) {
      this.showInfo.set(true);
    } else {
      this.showInfo.set(!this.showInfo());
    }

    this.abilityInfo.set(desc);
  }

  getEvolutionTrigger(details: EvolutionDetail[]): string {
    return this.service.formatEvolutionTrigger(details);
  }

  goBack(): void {
    this.router.navigate(['/pokemons', this.listPage]);
  }

  goToPokemon(id: number): void {
    this.router.navigate(['/pokemon', this.listPage, id]);
  }

  /** Naviga alla variety selezionata (che è un pokemon diverso) */
  goToVariety(variety: PokemonVariety): void {
    if (variety.id !== this.detail()?.id) {
      this.service.getPokemonDetail(variety.id).subscribe(detail => {
        this.detail.set(detail);
        this.loadAbilities(detail.abilities);
      });
    }
  }

  goToId(offset: number): void {
    const current = this.detail()?.id ?? 1;
    const next = Math.max(1, Math.min(TOTAL_POKEMON, current + offset));
    this.navigateToId(next);
  }

  startEdit(): void {
    const id = this.detail()?.id ?? '';
    this.typedId.set(id ? String(id) : '');
    this.editMode.set(true);
  }

  goToTypedId(value: string): void {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1 || parsed > TOTAL_POKEMON) {
      this.editMode.set(false);
      return;
    }

    const id = Math.max(1, Math.min(TOTAL_POKEMON, Math.floor(parsed)));
    this.navigateToId(id);
  }

  toggleShiny(): void {
    this.showShiny.update((v) => !v);
  }

  public getTypeName(type: string): string {
    return this.service.getTypeName(type);
  }

  public getCatchRateDescription(rate: number): string {
    return this.service.getCatchRateDescription(rate);
  }

  getFlavorText(): string {
    const entries = this.species()?.flavor_text_entries ?? [];
    const it = entries.find((e) => e.language.name === 'it');
    const en = entries.find((e) => e.language.name === 'en');
    const raw = (it ?? en)?.flavor_text ?? '';
    return raw.replace(/[\n\f\r]/g, ' ');
  }

  getGenus(): string {
    const genera = this.species()?.genera ?? [];
    const it = genera.find((g) => g.language.name === 'it');
    const en = genera.find((g) => g.language.name === 'en');
    return (it ?? en)?.genus ?? '';
  }

  getGeneration(): string {
    const gen = this.species()?.generation?.name ?? '';
    return this.GENERATIONS[gen] ?? gen;
  }

  getMainSprite(): string {
    const d = this.detail();
    if (!d) return '';
    if (this.showShiny()) {
      return d.sprites.other['official-artwork'].front_shiny ?? d.sprites.front_shiny;
    }
    return d.sprites.other['official-artwork'].front_default ?? d.sprites.front_default;
  }

  getStatPercent(slot: PokemonStatSlot): number {
    const base = slot.base_stat;
    return Math.min(100, Math.round((base / (slot.stat.name === 'total' ? 1500 : 255)) * 100));
  }

  getStatColor(slot: PokemonStatSlot): string {
    const base = slot.base_stat;

    if (slot.stat.name === 'total') {
      if (base <= 250) return '#f97316';
      if (base <= 500) return '#eab308';
      if (base <= 750) return '#22c55e';
      if (base <= 1000) return '#a855f7';
      if (base <= 1250) return '#db2777';
      return '#ef4444';
    }

    if (base >= 150) return '#a855f7';
    if (base >= 100) return '#22c55e';
    if (base >= 70) return '#eab308';
    if (base >= 40) return '#f97316';
    return '#ef4444';
  }

  getTypeColor(type: string): string {
    return TYPE_COLORS[type] ?? '#888';
  }

  getAbilityDescription(ability: PokemonAbilitySlot): string {
    const abilityDetail = this.ability().find((a) => a.name === ability.ability.name);
    const desc =
      abilityDetail?.flavor_text_entries.find((e) => e.language.name === 'it')?.flavor_text ??
      abilityDetail?.flavor_text_entries.find((e) => e.language.name === 'en')?.flavor_text ??
      '';
    return desc ?? 'Caricamento...';
  }

  getAbilityName(ability: PokemonAbilitySlot): string {
    const abilityDetail = this.ability().find((a) => a.name === ability.ability.name);
    const name =
      abilityDetail?.names.find((e) => e.language.name === 'it')?.name ??
      abilityDetail?.names.find((e) => e.language.name === 'en')?.name ??
      '';
    return name ?? 'Caricamento...';
  }

  get heightM(): string {
    return ((this.detail()?.height ?? 0) / 10).toFixed(1);
  }

  get weightKg(): string {
    return ((this.detail()?.weight ?? 0) / 10).toFixed(1);
  }

  get totalStats(): number {
    return (this.detail()?.stats ?? []).reduce((sum, s) => sum + s.base_stat, 0);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const d = this.detail();
    if (d) img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${d.id}.png`;
  }

  onEvoImgError(event: Event, id: number): void {
    (event.target as HTMLImageElement).src = this.service.getSmallSpriteUrl(id);
  }

  onVarietyImgError(event: Event, id: number): void {
    (event.target as HTMLImageElement).src = this.service.getSmallSpriteUrl(id);
  }

  getTypeEffectiveness(): TypeEffectivenessRow[] {
    const d = this.detail();
    if (!d) return [];
    const defTypes = d.types.map(t => t.type.name);
    return this.service.computeTypeEffectiveness(defTypes);
  }

  formatMultiplier(m: number): string {
    return this.service.formatMultiplier(m);
  }

  multClass(m: number): string {
    if (m === 4) return 'mult-4x';
    if (m === 2) return 'mult-2x';
    if (m === 1) return 'mult-1x';
    if (m === 0.5) return 'mult-half';
    if (m === 0.25) return 'mult-quarter';
    if (m === 0) return 'mult-zero';
    return '';
  }

  public getStatistics(stats: PokemonStatSlot[]): PokemonStatSlot[] {
    const total = stats.reduce((sum, s) => sum + s.base_stat, 0);
    return [...stats, { stat: { name: 'total', url: '' }, base_stat: total, effort: 0 }];
  }

  private loadAbilities(abilities: PokemonAbilitySlot[]): void {
    this.ability.set([]);

    abilities.forEach((ability) => {
      this.service.getPokemonAbility(ability.ability.url).subscribe((data) => {
        this.ability.update((prev) => [...prev, data]);
      });
    });
  }

  private navigateToId(id: number): void {
    this.loading.set(true);
    this.detail.set(null);
    this.species.set(null);
    this.editMode.set(false);
    this.router.navigate(['/pokemon', this.listPage, id]);
  }
}

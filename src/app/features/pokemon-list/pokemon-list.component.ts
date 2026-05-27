import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card.component';
import { PokemonListItem, TYPE_COLORS } from '../../core/models/pokemon.model';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

const PAGE_SIZE = 48;

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PokemonCardComponent],
  templateUrl: './pokemon-list.component.html',
  styleUrl: './pokemon-list.component.scss',
})
export class PokemonListComponent implements OnInit {
  private svc = inject(PokemonService);
  private route = inject(ActivatedRoute);

  // Stato reattivo con Signals
  allPokemon = signal<PokemonListItem[]>([]);
  loading = signal(true);
  loadingTypes = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);

  // Filtri
  searchQuery = signal('');
  selectedType = signal('');
  selectedGen = signal('');
  sortBy = signal<'id' | 'name'>('id');

  readonly types = Object.keys(TYPE_COLORS);
  readonly generations = [
    { value: '', label: 'Tutte le generazioni' },
    { value: '1-151', label: 'Gen I — Kanto (1-151)' },
    { value: '152-251', label: 'Gen II — Johto (152-251)' },
    { value: '252-386', label: 'Gen III — Hoenn (252-386)' },
    { value: '387-493', label: 'Gen IV — Sinnoh (387-493)' },
    { value: '494-649', label: 'Gen V — Unova (494-649)' },
    { value: '650-721', label: 'Gen VI — Kalos (650-721)' },
    { value: '722-809', label: 'Gen VII — Alola (722-809)' },
    { value: '810-905', label: 'Gen VIII — Galar (810-905)' },
    { value: '906-1025', label: 'Gen IX — Paldea (906-1025)' },
  ];

  // Lista filtrata/ordinata
  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const type = this.selectedType();
    const gen = this.selectedGen();
    const sort = this.sortBy();

    let list = this.allPokemon();

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toString() === q ||
          this.svc.padId(p.id).includes(q)
      );
    }

    if (type) {
      list = list.filter((p) => p.types.includes(type));
    }

    if (gen) {
      const [min, max] = gen.split('-').map(Number);
      list = list.filter((p) => p.id >= min && p.id <= max);
    }

    if (sort === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => a.id - b.id);
    }

    return list;
  });

  // Paginazione
  totalPages = computed(() => Math.ceil(this.filtered().length / PAGE_SIZE));

  paginated = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | '...')[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  resultCount = computed(() => this.filtered().length);

  public ngOnInit(): void {
    this.svc.getAllPokemon().subscribe({
      next: (list) => {
        this.allPokemon.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Errore nel caricamento dei Pokémon. Riprova più tardi.');
        this.loading.set(false);
      },
    });

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const page = Number(params.get('page'));
          this.goToPage(page);
          return of([]);
        })
      )
      .subscribe({
        error: (err) => console.error('Errore nel flusso della rotta:', err)
      });
  }

  public getTypeName(type: string): string {
    return this.svc.getTypeName(type);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onTypeChange(value: string): void {
    this.selectedType.set(value);
    this.currentPage.set(1);
  }

  onGenChange(value: string): void {
    this.selectedGen.set(value);
    this.currentPage.set(1);
  }

  onSortChange(value: 'id' | 'name'): void {
    this.sortBy.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number | '...'): void {
    if (page === '...' || page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page as number);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set('');
    this.selectedGen.set('');
    this.sortBy.set('id');
    this.currentPage.set(1);
  }

  trackByPokemon(_: number, p: PokemonListItem): number {
    return p.id;
  }

  getTypeColor(type: string): string {
    return TYPE_COLORS[type] ?? '#888';
  }
}

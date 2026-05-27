import {
  Component, Input, OnChanges, SimpleChanges,
  inject, signal, ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonDetail, VersionGroupMoves, LEARN_METHOD_IT, MoveVersionRowDetail, DAMAGE_CLASS_IT, DAMAGE_CLASS_COLOR, TYPE_COLORS } from '../../core/models/pokemon.model';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-pokemon-moves-by-version',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './pokemon-moves-by-version.component.html',
  styleUrl: './pokemon-moves-by-version.component.scss',
})
export class PokemonMovesByVersionComponent implements OnChanges {
  @Input({ required: true }) detail!: PokemonDetail;

  private service = inject(PokemonService);

  versionGroups = signal<VersionGroupMoves[]>([]);
  activeTab = signal<string>('');
  loading = signal(true);
  showDetail = signal({ show: false, id: null as string | null });

  readonly LEARN_METHOD_IT = LEARN_METHOD_IT;
  readonly DAMAGE_CLASS_IT = DAMAGE_CLASS_IT;
  readonly DAMAGE_CLASS_COLOR = DAMAGE_CLASS_COLOR;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['detail'] && this.detail) {
      this.loading.set(true);
      this.versionGroups.set([]);
      this.activeTab.set('');

      this.service.getMovesByVersionGroup(this.detail).subscribe({
        next: (groups) => {
          this.versionGroups.set(groups.filter(group =>
            group.versionGroup !== 'sword-shield' &&
            group.versionGroup !== 'the-isle-of-armor' &&
            group.versionGroup !== 'xd' &&
            group.versionGroup !== 'colosseum' &&
            group.versionGroup !== 'the-teal-mask' &&
            group.versionGroup !== 'the-indigo-disk' &&
            group.versionGroup !== 'the-crown-tundra' &&
            !group.versionGroup.endsWith('-japan')
          ));
          if (groups.length) this.activeTab.set(groups[0].versionGroup);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  public getTypeColor(type: string): string {
    return TYPE_COLORS[type] ?? '#888';
  }

  public getLevelUpCount(group: VersionGroupMoves): number {
    return group.rows.filter(r => r.learnMethod !== 'level-up2').length;
  }

  public selectTab(vg: string): void {
    this.activeTab.set(vg);
  }

  // 1. Definisci un signal intermedio per le righe filtrate
  private filteredRows = computed(() => {
    return this.versionGroups().find(g => g.versionGroup === this.activeTab())?.rows?.filter(r => r.learnMethod !== 'level-up2') || [];
  });

  // 2. Trasforma il flusso RxJS in un Signal leggibile direttamente nel template
  public activeRows = toSignal(
    toObservable(this.filteredRows).pipe(
      switchMap(rows => {
        if (rows.length === 0) return of([]);
        return this.service.getPokemonSelectedMoves(rows).pipe(
          map(moves => {
            const result: MoveVersionRowDetail[] = [];
            for (const row of rows) {
              const id = `${row.moveName}-${row.levelLearnedAt}`;
              const detail = moves.find(m => m.name === row.moveName);
              if (detail) result.push({ id, versionRow: row, detail });
            }
            return result;
          })
        );
      })
    ),
    { initialValue: [] as MoveVersionRowDetail[] }
  );

  private damageClassFilters = signal<Record<string, string>>({});

  public getTypeName(type: string): string {
    return this.service.getTypeName(type);
  }

  /** Raggruppa le righe per metodo di apprendimento all'interno del group attivo */
  public rowsByMethod(): { method: string; methodIt: string; rows: MoveVersionRowDetail[] }[] {
    const rows = this.activeRows();

    if (!rows) {
      return [];
    }

    const map = new Map<string, { method: string; methodIt: string; rows: MoveVersionRowDetail[] }>();

    for (const row of rows) {
      if (!map.has(row.versionRow.learnMethod)) {
        map.set(
          row.versionRow.learnMethod,
          { method: row.versionRow.learnMethod, methodIt: row.versionRow.learnMethodIt, rows: [] }
        );
      }
      map.get(row.versionRow.learnMethod)!.rows.push(row);
    }

    const filters = this.damageClassFilters();

    // Ordine canonico dei metodi
    const order = ['level-up', 'machine', 'tutor', 'egg'];

    return Array.from(map.values())
      .map(section => {
        const filter = filters[section.method];
        if (filter) {
          const damageClass = filter === 'state' ? 'status' : filter;
          section.rows = section.rows.filter(row => row.detail.damageClass === damageClass);
        }
        return section;
      })
      .sort((a, b) => {
        const ia = order.indexOf(a.method);
        const ib = order.indexOf(b.method);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
  }

  public showMoveInfo(modeId: string): void {
    const show = this.showDetail().show && this.showDetail().id === modeId;
    this.showDetail.set({ show: !show, id: modeId });
  }

  public isActiveFilter(type: string, section: { method: string }): boolean {
    return this.damageClassFilters()[section.method] === type;
  }

  public filterBy(type: string, section: { method: string }): void {
    const methodKey = section.method;
    const currentFilters = this.damageClassFilters();
    const nextFilter = currentFilters[methodKey] === type ? '' : type;

    this.damageClassFilters.set({
      ...currentFilters,
      [methodKey]: nextFilter,
    });
  }
}

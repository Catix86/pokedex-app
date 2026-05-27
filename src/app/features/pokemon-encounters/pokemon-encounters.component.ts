import {
  Component, Input, OnChanges, SimpleChanges,
  inject, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonDetail, EncounterByVersion } from '../../core/models/pokemon.model';

@Component({
  selector: 'app-pokemon-encounters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './pokemon-encounters.component.html',
  styleUrl:    './pokemon-encounters.component.scss',
})
export class PokemonEncountersComponent implements OnChanges {
  @Input({ required: true }) detail!: PokemonDetail;

  private svc = inject(PokemonService);

  encounters = signal<EncounterByVersion[]>([]);
  activeTab  = signal<string>('');
  loading    = signal(true);
  noData     = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['detail'] && this.detail) {
      this.loading.set(true);
      this.noData.set(false);
      this.encounters.set([]);
      this.activeTab.set('');

      this.svc.getEncounters(this.detail.id).subscribe({
        next: (groups) => {
          if (!groups.length) {
            this.noData.set(true);
          } else {
            this.encounters.set(groups);
            this.activeTab.set(groups[0].version);
          }
          this.loading.set(false);
        },
        error: () => {
          this.noData.set(true);
          this.loading.set(false);
        },
      });
    }
  }

  selectTab(version: string): void {
    this.activeTab.set(version);
  }

  activeGroup(): EncounterByVersion | undefined {
    console.log(this.encounters().find(g => g.version === this.activeTab()));
    return this.encounters().find(g => g.version === this.activeTab());
  }

  getFilteredEncounters(): EncounterByVersion[] {
    const excludedVersions = ['xd', 'colosseum', 'blue-japan', 'green-japan', 'yellow-japan', 'red-japan'];
    return this.encounters().filter(g => !excludedVersions.includes(g.version));
  }

  /** Livello: mostra "Lv. X" o "Lv. X–Y" se range */
  levelRange(min: number, max: number): string {
    return min === max ? `Lv. ${min}` : `Lv. ${min}–${max}`;
  }
}

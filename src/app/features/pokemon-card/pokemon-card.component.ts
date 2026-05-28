import { Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PokemonListItem, TYPE_COLORS } from '../../core/models/pokemon.model';
import { PokemonService } from '../../core/services/pokemon.service';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.scss',
})
export class PokemonCardComponent {
  @Input({ required: true }) pokemon!: PokemonListItem;
  @Input({ required: true }) page!: number;

  private svc = inject(PokemonService);

  constructor(public service: PokemonService) { }

  get cardGradient(): string {
    if (!this.pokemon.types.length) {
      return 'linear-gradient(135deg, #1a1a2e, #16213e)';
    }

    const c1 = TYPE_COLORS[this.pokemon.types[0]] ?? '#888';
    const c2 = this.pokemon.types[1] ? (TYPE_COLORS[this.pokemon.types[1]] ?? c1) : c1;

    return `linear-gradient(135deg, ${c1}33, ${c2}55)`;
  }

  public getTypeColor(type: string): string {
    return TYPE_COLORS[type] ?? '#888';
  }

  public onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.pokemon.id}.png`;
  }

  public getTypeName(type: string): string {
    return this.svc.getTypeName(type).replace('Coleottero', 'Coleott');
  }
}

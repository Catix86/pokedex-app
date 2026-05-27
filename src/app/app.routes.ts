import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'pokemons',
    pathMatch: 'full',
  },
  {
    path: 'pokemons',
    loadComponent: () =>
      import('./features/pokemon-list/pokemon-list.component').then(
        (m) => m.PokemonListComponent
      ),
  },
  {
    path: 'pokemons/:page',
    loadComponent: () =>
      import('./features/pokemon-list/pokemon-list.component').then(
        (m) => m.PokemonListComponent
      ),
  },
  // {
  //   path: 'pokemon/:id',
  //   loadComponent: () =>
  //     import('./features/pokemon-detail/pokemon-detail.component').then(
  //       (m) => m.PokemonDetailComponent
  //     ),
  // },
  {
    path: 'pokemon/:page/:id',
    loadComponent: () =>
      import('./features/pokemon-detail/pokemon-detail.component').then(
        (m) => m.PokemonDetailComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'pokemons',
  },
];

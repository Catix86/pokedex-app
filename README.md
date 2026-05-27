# PokéDex National Database 🔴

SPA Angular con il database completo di tutti i Pokémon (Gen I → Gen IX), costruita su **PokéAPI**.

---

## Stack Tecnologico

- **Angular 17+** — Standalone Components, Signals, View Transitions API
- **PokéAPI** — https://pokeapi.co (gratuita, nessun DB da gestire)
- **RxJS** — gestione stream asincroni con caching in memoria
- **SCSS** — design system dark con CSS Variables

---

## Avvio rapido

```bash
# 1. Installa le dipendenze
npm install

# 2. Avvia il server di sviluppo
npm start

# 3. Apri il browser
# http://localhost:4200
```

---

## Struttura del Progetto

```
src/app/
├── core/
│   ├── models/
│   │   └── pokemon.model.ts        # Interfacce TypeScript + costanti (colori tipo, stat labels, generazioni)
│   └── services/
│       └── pokemon.service.ts      # Chiamate API + cache in memoria
├── features/
│   ├── pokemon-list/               # Pagina lista con filtri e paginazione
│   ├── pokemon-detail/             # Pagina dettaglio con tutte le info
│   └── pokemon-card/               # Card riutilizzabile per la griglia
├── app.routes.ts                   # Routing lazy-loaded
├── app.config.ts                   # Providers (HttpClient, Router con View Transitions)
└── app.component.ts                # Root component (solo router-outlet)
```

---

## Features

### Lista Pokémon (`/pokemon`)
- **Griglia responsive** con 1025 Pokémon (Gen I → Gen IX)
- **Ricerca** per nome o numero (#0001 → #1025)
- **Filtro per tipo** (18 tipi con colori)
- **Filtro per generazione** (9 generazioni)
- **Ordinamento** per ID o alfabetico
- **Paginazione** con 48 card per pagina
- **Caricamento progressivo dei tipi** in batch da 50 (per non sovraccaricare le API)
- **Cache in memoria** per evitare chiamate ripetute

### Dettaglio Pokémon (`/pokemon/:id`)
- **Artwork ufficiale** (normale + shiny con toggle)
- **Statistiche base** con barre visive e colori
- **Abilità** (normali + nascoste)
- **Informazioni specie** (generazione, habitat, habitat, ecc.)
- **Galleria sprite** (fronte/retro, normale/shiny)
- **Mosse** (prime 40 + contatore totale)
- **Navigazione** ← → tra Pokémon adiacenti
- **Descrizione** in italiano (se disponibile) o inglese

---

## Architettura: Perché PokéAPI invece di un DB locale?

PokéAPI è la fonte ufficiale dei dati Pokémon, sempre aggiornata, e offre:
- **REST API gratuita** senza autenticazione
- **1025+ Pokémon** con tutti i dettagli
- **Dati multilingua** (italiano, inglese, giapponese, ecc.)
- **Immagini ufficiali** via CDN GitHub

Il service implementa una **cache in memoria** (`Map<id, PokemonDetail>`) che evita chiamate duplicate durante la sessione — nessuna chiamata viene ripetuta per lo stesso Pokémon.

---

## Performance

| Strategia | Dettaglio |
|-----------|-----------|
| Cache in memoria | Ogni Pokémon viene fetchato una sola volta per sessione |
| Lazy loading | I component vengono caricati solo quando serve il route |
| View Transitions API | Animazioni di transizione native del browser |
| `ChangeDetectionStrategy.OnPush` | Riduce i cicli di change detection |
| Batch loading | I tipi vengono caricati in batch da 50, con delay 300ms tra batch |
| `trackBy` | Ottimizza il rendering della lista Angular |

---

## Personalizzazioni facili

**Aggiungere filtri**: modifica `pokemon-list.component.ts`, aggiungi un signal e aggiorna il computed `filtered`.

**Cambiare il tema**: modifica le CSS variables in `src/styles.scss`.

**Aggiungere la catena evolutiva**: usa `GET /pokemon-species/{id}` → `evolution_chain.url` → `GET /evolution-chain/{id}`.

**PWA / Offline**: aggiungi `@angular/pwa` per il service worker e caching offline delle immagini.

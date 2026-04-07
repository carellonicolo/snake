# Retro Snake Game

> Snake game retro con temi personalizzabili, power-up e classifica globale

[![Licenza MIT](https://img.shields.io/badge/Licenza-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![GitHub stars](https://img.shields.io/github/stars/carellonicolo/snake?style=social)](https://github.com/carellonicolo/snake)
[![GitHub issues](https://img.shields.io/github/issues/carellonicolo/snake)](https://github.com/carellonicolo/snake/issues)

## Panoramica

Retro Snake Game e una rivisitazione moderna del classico Snake, realizzata con tecnologie web contemporanee e un'attenzione particolare all'estetica retro. L'applicazione offre un motore di gioco personalizzabile (fluidita, velocita, dimensione griglia), una collezione di temi grafici premium ispirati a dispositivi e stili iconici, un sistema di power-up e una classifica globale in tempo reale tramite Supabase.

Il gioco e pensato per chi vuole rivivere la nostalgia del Snake con un'esperienza moderna, fluida e personalizzabile.

## Funzionalita Principali

- **Motore personalizzabile** — Regolazione di fluidita, velocita iniziale e dimensione della griglia
- **Temi retro premium** — CRT, Nokia LCD, Arcade Glow, Game Boy e altri stili iconici
- **Power-up** — Bonus speciali durante la partita (velocita, punti, dimensione)
- **Classifica globale** — Leaderboard in tempo reale tramite Supabase
- **Effetti visivi** — Filtri CRT, glow, scanlines e altri effetti retro
- **Controlli touch** — Supporto per dispositivi mobili con swipe
- **Statistiche** — Tracciamento di punteggio, lunghezza e durata partita
- **Responsive** — Adattabile a qualsiasi dimensione di schermo

## Tech Stack

| Tecnologia | Utilizzo |
|:--|:--|
| ![React](https://img.shields.io/badge/React_18-61dafb?logo=react&logoColor=white) | Framework UI |
| ![TypeScript](https://img.shields.io/badge/TypeScript_5-3178c6?logo=typescript&logoColor=white) | Linguaggio tipizzato |
| ![Vite](https://img.shields.io/badge/Vite_5-646cff?logo=vite&logoColor=white) | Build tool |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06b6d4?logo=tailwindcss&logoColor=white) | Styling |
| ![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=white) | Leaderboard e backend |
| ![Vitest](https://img.shields.io/badge/Vitest-6e9f18?logo=vitest&logoColor=white) | Testing |

## Requisiti

- **Node.js** >= 18
- **npm** >= 9 (oppure bun)
- **Supabase** — Un progetto Supabase (opzionale, per la classifica globale)

## Installazione

```bash
git clone https://github.com/carellonicolo/snake.git
cd snake
npm install
npm run dev
```

L'applicazione sara disponibile su `http://localhost:8080`.

## Utilizzo

1. Seleziona il tema grafico preferito
2. Personalizza le impostazioni del motore di gioco
3. Gioca usando le frecce direzionali o WASD
4. Su mobile, usa lo swipe per controllare il serpente
5. Il punteggio viene registrato automaticamente nella classifica globale

## Struttura del Progetto

```
snake/
├── src/
│   ├── components/     # Componenti React (campo, menu, leaderboard)
│   ├── lib/            # Motore di gioco, temi, power-up
│   ├── pages/          # Pagine dell'applicazione
│   ├── test/           # Test con Vitest
│   └── hooks/          # Custom hooks
├── public/             # Asset statici
├── index.html          # Entry point HTML
└── vite.config.ts      # Configurazione Vite
```

## Deploy

```bash
npm run build
```

Deployabile su Cloudflare Pages, Netlify o Vercel. Per la classifica globale, configurare le variabili Supabase.

## Test

```bash
npm run test          # Esegui i test una volta
npm run test:watch    # Modalita watch
```

## Contribuire

I contributi sono benvenuti! Consulta le [linee guida per contribuire](CONTRIBUTING.md) per maggiori dettagli.

## Licenza

Distribuito con licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli completi.

## Autore

**Nicolo Carello**
- GitHub: [@carellonicolo](https://github.com/carellonicolo)
- Website: [nicolocarello.it](https://nicolocarello.it)

---

<sub>Sviluppato con l'ausilio dell'intelligenza artificiale.</sub>

## Progetti Correlati

Questo progetto fa parte di una collezione di strumenti didattici e applicazioni open-source:

| Progetto | Descrizione |
|:--|:--|
| [DFA Visual Editor](https://github.com/carellonicolo/AFS) | Editor visuale per automi DFA |
| [Turing Machine](https://github.com/carellonicolo/Turing-Machine) | Simulatore di Macchina di Turing |
| [Scheduler](https://github.com/carellonicolo/Scheduler) | Simulatore di scheduling CPU |
| [Subnet Calculator](https://github.com/carellonicolo/Subnet) | Calcolatore subnet IPv4/IPv6 |
| [Base Converter](https://github.com/carellonicolo/base-converter) | Suite di conversione multi-funzionale |
| [Gioco del Lotto](https://github.com/carellonicolo/giocodellotto) | Simulatore Lotto e SuperEnalotto |
| [MicroASM](https://github.com/carellonicolo/microasm) | Simulatore assembly |
| [Flow Charts](https://github.com/carellonicolo/flow-charts) | Editor di diagrammi di flusso |
| [Cypher](https://github.com/carellonicolo/cypher) | Toolkit di crittografia |
| [Pong](https://github.com/carellonicolo/pongcarello) | Pong game |
| [Calculator](https://github.com/carellonicolo/calculator-carello) | Calcolatrice scientifica |
| [IPSC Score](https://github.com/carellonicolo/IPSC) | Calcolatore punteggi IPSC |
| [Quiz](https://github.com/carellonicolo/quiz) | Piattaforma quiz scolastici |
| [Carello Hub](https://github.com/carellonicolo/carello-hub) | Dashboard educativa |
| [Prof Carello](https://github.com/carellonicolo/prof-carello) | Gestionale lezioni private |
| [DOCSITE](https://github.com/carellonicolo/DOCSITE) | Piattaforma documentale |

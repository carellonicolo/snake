# Snake Game

Un gioco classico di Snake costruito con React, TypeScript, Vite, Tailwind CSS e Supabase (autenticazione, database e storage).

## Caratteristiche

- **Supabase Integration**: Auth, Database (punteggi e preferenze utente)
- **Modalità di gioco**: Classic
- **Classifica Globale**: Sfida altri giocatori (Leaderboard Supabase in tempo reale)
- **Temi e Difficoltà**: Scegli tra stili Nokia, Arcade o Terminal e seleziona il livello di sfida.

## Sviluppo Locale

Per eseguire il progetto in locale assicurarsi di aver configurato il proprio `.env` con le chiavi locali di Supabase:

```bash
# Installa le dipendenze
npm install

# Esegui il dev server
npm run dev
```

## Struttura del Database
Il backend Supabase utilizza 3 tabelle:
1. `profiles`: Tabella condivisa per gli utenti (nickname)
2. `snake_preferences`: Opzioni specifiche di questo gioco (suoni, tema, difficoltà)
3. `game_scores`: Punteggi per le leaderboard
4. `user_stats`: Statistiche totali di gameplay

## Deploy
Il frontend è distribuito su Cloudflare Pages.

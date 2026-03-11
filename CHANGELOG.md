# Changelog

Tutti i cambiamenti di rilievo a questo progetto saranno documentati in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Aggiunto
- Supporto a deployment serverless per le future classifiche live in tempo reale su scale regionali.

---

## [1.2.0] - 2026-03-11

### Aggiunto
- **Match Custom Pre-Partita**: Nuova dashboard per configurare il moltiplicatore velocità (fino a 3x) e la dimensione logica della scacchiera (fino a 50x50).
- **Muri Aggiuntivi**: Generazione procedurale di ostacoli interni per le modalità a difficoltà avanzata.
- **Sistema di Punteggio a Combo**: Moltiplicatore di score progressivo (fino a 5x) in base al tempo impiegato tra un pasto e l'altro.
- **Dynamic Trail (Scia Serpente)**: Effetto visivo di blur e opacità sui segmenti terminali del corpo del serpente.
- **Screen Shake**: Il canvas ora trema in caso di Game Over, Level Up, o scoring multiplo intenso.
- **Background Animato**: Aggiunta di una griglia in scorrimento infinito (`bg-retro-grid`).

### Cambiato
- *Rewrite dell'Engine (`useGameEngine.ts`)*: Completamente astratto il calcolo delle griglie e reso scalabile. Le coordinate non sono più limitate a `30x30`.
- I blocchi all'interno del GameCanvas mantengono l'aspect ratio indipendentemente dalla loro reale controparte logica, per renderizzare muri scalati alla larghezza della finestra disponibile.

---

## [1.1.0] - 2026-03-11 (Fase 1: Migrazione)

### Aggiunto
- Supporto per istanze fisiche **Supabase Locali**. 
- Struttura del Profilo Condiviso: Ora l'autenticazione tramite `auth.users` registra un record `profiles` generico (utilizzabile per il network di app dell'autore) e un record secondario `snake_preferences` specifico per il gioco.
- Lazy Creation di `user_stats` se non esiste alla prima partita, sostituendo il trigger SQL legacy per evitare interferenze con altri applicativi.
- Deploy in live build via **Cloudflare Pages**.

### Rimosso
- Tutte le dipendenze al tool *Lovable AI* (incluso `lovable-tagger`).

---

## [1.0.0] - Lancio Iniziale 

### Aggiunto
- Release Originale di *Snake Game*
- Modalità Classica e Leaderboard globale.
- Grafica retro: Nokia, Arcade e Terminal.
- PowerUp: Rallentamento, Invincibilità, Doppi Punti.

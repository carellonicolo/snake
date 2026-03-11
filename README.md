<div align="center">
  <img src="public/favicon.svg" alt="Snake Logo" width="120" />

  # 🐍 Retro Snake Game

  **Un tuffo nel passato con tecnologie del futuro.**
  
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.io/)
  <br>
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare-F38020?style=flat-square&logo=cloudflare)](https://pages.cloudflare.com/)

  *Gioca, personalizza le regole, e scala le classifiche globali nel più classico dei giochi arcade, ora ricostruito con un motore fluido e personalizzabile.*

</div>

<hr/>

## ✨ Caratteristiche Principali

- 🕹️ **Engine Fluido e Customizzabile**: Non è il solito Snake a "scatti". Supporta interpolazioni, velocità modulare, scacchiera da 15x15 fino a 50x50 e generazione procedurale di ostacoli.
- 🎨 **Temi Retro Premium**: Grafica ispirata ai classici, con filtri CRT, Scanlines, Effetti Glow (Arcade) e il classico filtro a cristalli liquidi verde (Nokia LCD).
- 💥 **"Juice" & Animazioni**: *Screen Shake*, effetti scia (*dynamic trail*), e combo timer dinamici per massimizzare i punti prima della scadenza.
- 🛡️ **Power-Ups**: Arricchito con power-ups temporizzati come: Invincibilità, Doppi Punti e Rallentamento.
- 🌍 **Classifica Globale Live**: Authentication robusta grazie a **Supabase** (compatibile con hosting in locale e in cloud). Tabella punteggi aggiornata in real-time.

---

## 🚀 Setup & Avvio Rapido

Questo gioco utilizza Vite per il client e richiede un'istanza Supabase (Cloud o Locale via Docker) per funzionare appieno (autenticazione, statistiche, classifiche).

### Prerequisiti
- [Node.js](https://nodejs.org/it/) (v16+)
- npm / pnpm / yarn
- Un'istanza [Supabase](https://supabase.com/) attiva o [CLI Locale installata](https://supabase.com/docs/guides/cli/getting-started)

### Installazione

1. **Clona la Repository**
   ```bash
   git clone https://github.com/TuoUsername/snake.git
   cd snake
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le Variabili d'Ambiente**
   Rinomina il file `.env.example` in `.env` (se assente, crealo!) e compila i campi:
   ```env
   VITE_SUPABASE_URL=http://tuo-supabase-url-locale-o-cloud
   VITE_SUPABASE_PUBLISHABLE_KEY=la-tua-anon-key-pubblica
   ```

4. **Avvia in Modalità Sviluppo**
   ```bash
   npm run dev
   ```
   L'app sarà visibile all'indirizzo [http://localhost:8080](http://localhost:8080) (o sulla porta indicata da Vite).

---

## 🗄️ Struttura Database (Supabase)

Il gioco si affida a 4 entità fondamentali sul DB SQL, progettate per essere facilmente condivisibili e idempotenti tra altre app del tuo network:

1. `profiles`: Tabella centralizzata con ID Autocad (auth.users), username e data_creazione.
2. `snake_preferences`: Set di prefenze game-specific (tema, difficoltà, suoni) uniche per il tool.
3. `game_scores`: Il core dei log storici. Salva difficoltà, tema e score per i ranking globali.
4. `user_stats`: Accumulo statistiche globali aggregate (tempo totale giocato, games by difficulty, record assoluto).

Trovi la **SQL Migration File** pronta in `supabase/migrations/20260311160000_shared_profiles_snake_preferences.sql`.

---

## 🤝 Contribuire

Siamo sempre alla ricerca di contributi (risoluzione di bug, implementazione di nuove logiche ostacoli o temi grafici).  
Sei pregato di consultare i documenti [CONTRIBUTING.md](CONTRIBUTING.md) e [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) per capire come iniziare.

1. Fai il **Fork** del progetto!
2. Crea il tuo **Feature Branch** (`git checkout -b feature/MioFeatureAggiunto`)
3. Esegui il **Commit** delle tue modifiche (`git commit -m 'Aggiunto Fantastica Mela D'Oro'`)
4. Fai il **Push** nel blocco (`git push origin feature/MioFeatureAggiunto`)
5. Apri una **Pull Request**

---

## 📄 Licenza

Distribuito sotto la Licenza **MIT**. Guarda il file [LICENSE](LICENSE) per ulteriori delucidazioni. O in breve: sentiti libero di farci quello che preferisci ma mantenendo la firma d'autore. 

<div align="center">
  <i>Made with 💚 per i nostalgici del 1997</i>
</div>

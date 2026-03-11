# Contribuire a Snake Game

Siamo felici che tu voglia contribuire a Snake Game! Sia che si tratti di un piccolo bug fix, di una nuova feature complessa, o di migliorare la documentazione, il tuo aiuto è prezioso.

Questo documento ti guiderà attraverso il processo di contribuzione.

## 1. Segnalare Bug o Richiedere Feature 🐛💡

Utilizza i template appositi presenti nella sezione **Issues** del repository.
- Per un **Bug**: Dettaglia il comportamento errato, come riprodurlo, il comportamento atteso e il tuo ambiente/dispositivo.
- Per una **Feature**: Descrivi chiaramente cosa vorresti aggiungere e perché. Considera eventuali alternative.

## 2. Setup dell'Ambiente di Sviluppo 🛠️

Se vuoi scrivere codice:
1. Effettua il **Fork** di questo repository.
2. Clona il fork sul tuo computer: `git clone https://github.com/[TuoUsername]/snake.git`
3. Installa le dipendenze: `npm install`
4. Copia le variabili d'ambiente: Crea un file `.env` copiando le variabili necessarie (Supabase URL e Anon Key).
5. Lancia il dev server: `npm run dev`

Assicurati che tutto funzioni prima di iniziare le modifiche.

## 3. Flusso di Lavoro Sviluppo 🔄

1. Crea sempre un **nuovo branch** per la tua modifica dalla branch `main`: `git checkout -b feature/nome-della-tua-feature` o `bugfix/nome-del-bug`.
2. Apporta le tue modifiche al codice.
3. Se possibile, formatta il codice e risolvi gli avvisi di linting.
4. Assicurati che l'applicazione continui a buildare regolarmente: esegui `npm run build`.
5. Effettua i **Commit** usando messaggi chiari (es. `feat: aggiunta nuova dinamica combo` o `fix: crash del canvas su resize`). Segui idealmente gli standard di *Conventional Commits*.
6. Effettua il **Push** del branch sul tuo fork: `git push origin feature/nome-della-tua-feature`.

## 4. Aprire una Pull Request (PR) 📤

1. Vai sul repository originale e apri una nuova **Pull Request**.
2. Riempi il *Pull Request Template* fornito, spuntando i checklist completati.
3. Sii chiaro su *cosa* è stato modificato e *come* è stato testato.
4. Resta in attesa della review e di eventuali richieste di modifica dai maintainers.

## 5. Standard di Sviluppo & Tecnologie in Uso 🧑‍💻

- **Framework:** React + Vite
- **Linguaggio:** TypeScript (Tipizzazione obbligatoria, evita l'`any` laddove possibile)
- **Styling:** Tailwind CSS + shadcn/ui. Usa le classi utility invece dei file CSS separati se non è strettamente necessario.
- **Backend/DB:** Supabase (Auth, Database PostreSQL, RLS). Se la tua PR include variazioni ai layer DB, devi proporre i file migration SQL corrispondenti.

Grazie per fare la tua parte nel migliorare Snake Game! 🐍

# Security Policy

## Versioni Supportate

Il supporto e le patch di sicurezza sono forniti principalmente all'ultima versione stabile del gioco. Qualsiasi grave problema architetturale sarà fixato sulla branch `main` il prima possibile.

## Segnalare una Vulnerabilità 🚨

La sicurezza è un fattore critico. Sappiamo che la repository include codice che gestisce Access Tokens, Auth e connessioni a Supabase in ambiente pubblico. Se scopri o sospetti una vulnerabilità di sicurezza all'interno dell'app (es. bypass dell'Auth, leak di credenziali, bypass RLS sulle tabelle del ranking):

1. **NON aprite un'Issue pubblica**! Creare un'issue pubblica potrebbe mettere a rischio l'applicazione.
2. Contattare privatamente lo sviluppatore/i maintainer del progetto (es. via mail se indicata, o sui canali privati, o usando i task di Vulnerability di GitHub se la repo ha gli avvisi privati abilitati per i Security Advisory).

Sii chiaro nel fornire:
- Tipo di problematica rilevata (es: RLS bypass, XSS payload user-side).
- Passi dettagliati per riprodurla.
- Qualsiasi log/screenshot utile che ne provi l'efficacia, prestando attenzione a camuffare dati critici o utenti altrui.

Tutti i report inerenti la sicurezza avranno **priorità massima** e cercheremo di convalidarli e patcharli nel minor tempo tecnico possibile.

Grazie per mantenere Snake Game un ambiente digitale sicuro!

# Stato del progetto

## Implementato

- Fondazione Next.js App Router, TypeScript strict, Tailwind 4 e design responsive con tema scuro/chiaro.
- Pagine pubbliche italiane e contenuti dichiaratamente indipendenti; candidati, obiettivi e PDF si gestiscono lato admin.
- Survey sì/no anonimo, idempotente, protetto da cookie anti-doppio-invio, rate limit con hash di rete e chiusura programmabile.
- Schemi Mongoose tenant-aware, connessione riusabile, ruoli/permessi, password bcrypt, sessioni revocabili e audit log.
- Dashboard aggregate con Recharts e polling in foreground; export CSV aggregato.
- Gestione candidati, caricamento PDF/immagini con storage locale dev o S3 compatibile, testi, temi e stato campagna.
- QR SVG/PNG e poster A4/social/story con esportazione PNG e stampa PDF dal browser.
- Bootstrap admin, seed fittizio isolato, README, `.env.example`, checklist privacy e test unitari/E2E.

## Da configurare/verificare prima di un lancio

- MongoDB Atlas, `AUTH_SECRET`, `APP_URL` definitivo e storage a oggetti; il sondaggio nasce chiuso.
- Account `SUPER_ADMIN` tramite script bootstrap; distribuzione sicura dei link invito.
- Nomi, fotografie, classi, programma PDF, promesse, recapito e revisione della privacy.
- Eseguire typecheck, lint, test, build e browser test dopo la riparazione/installazione completa dei pacchetti.
- Valutare TOTP e completare revisione dei flussi e della retention con i responsabili del trattamento.

## Note di verifica

- Le risposte demo non vengono create. Gli esempi candidati sono marcati `demoOnly` e non sono restituiti alle pagine pubbliche.
- Il QR richiede `APP_URL`, è impostato sul percorso `/partecipa` e rifiuta localhost in produzione.
- Nessun dato personale o segreto reale è incluso nel repository.

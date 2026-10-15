# Revisione privacy e sicurezza prima del lancio

- [ ] Identificare il referente/titolare e aggiungere un recapito operativo verificato.
- [ ] Confermare finalità, base giuridica, informativa e retention con chi è responsabile del trattamento, tenendo conto che gli utenti possono essere minorenni.
- [ ] Verificare che il sondaggio resti anonimo e separato da ogni raccolta identificativa; non aggiungere join o identificativi nei log.
- [ ] Confermare con il responsabile che l’hash temporaneo dell’indirizzo di rete (15 minuti) sia appropriato per il rate limit e descritto nell’informativa.
- [ ] Confermare i periodi per risposte e audit. Verificare che gli indici TTL siano presenti e che la cancellazione sia effettiva nel database scelto.
- [ ] Impostare credenziali MongoDB dedicate, restrizioni di rete, backup controllati e permessi minimi.
- [ ] Impostare storage privato in scrittura server-side e pubblicazione in sola lettura per gli asset campagna; ruotare le chiavi e verificare cache/CDN.
- [ ] Impostare `APP_URL` sul dominio HTTPS reale e verificare QR SVG, PNG, poster e URL di fallback con un dispositivo fisico.
- [ ] Creare `SUPER_ADMIN` con il bootstrap, rimuovere la password temporanea, distribuire gli inviti tramite canale sicuro e limitare gli account.
- [ ] Decidere se attivare TOTP; non è attualmente implementato.
- [ ] Verificare nomi, immagini, biografie, programma, obiettivi e date con i candidati prima della pubblicazione.
- [ ] Approvare il testo di chiusura e assicurarsi che il sito non sia presentato come voto o servizio ufficiale della scuola.
- [ ] Completare la revisione accessibilità, sicurezza upload, test browser, build di produzione e procedure di risposta a incidenti.
- [ ] Registrare chi può esportare aggregati, chi può gestire utenti e come verranno revocati gli accessi dopo la campagna.

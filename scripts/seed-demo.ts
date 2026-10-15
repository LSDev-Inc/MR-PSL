import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  if (process.env.NODE_ENV === "production") throw new Error("Il seed dimostrativo è disabilitato in produzione.");
  if (!process.env.MONGODB_URI) throw new Error("Imposta MONGODB_URI in .env.local prima del seed.");

  const { connectDb } = await import("../src/lib/db");
  const { Campaign, Candidate } = await import("../src/models");
  const { INSTITUTION_ID } = await import("../src/lib/tenant");
  const mongoose = await import("mongoose");

  try {
    await connectDb();
    await Campaign.updateOne(
      { institutionId: INSTITUTION_ID },
      {
        $setOnInsert: {
          institutionId: INSTITUTION_ID,
          status: "closed",
          heroTitle: "Il cambiamento inizia da noi.",
          heroSubtitle: "Due studenti. Idee concrete. Una scuola da costruire insieme.",
          goals: [
            { title: "Ascolto", description: "Raccogliere con chiarezza idee e punti di vista degli studenti." },
            { title: "Trasparenza", description: "Condividere aggiornamenti comprensibili sulle attività." },
            { title: "Partecipazione", description: "Creare occasioni per contribuire alla vita del Polo Tecnico." },
          ],
        },
      },
      { upsert: true },
    );
    const demoCandidates = [
      {
        position: 1,
        name: "Giulia Conti · DEMO",
        className: "3B Informatica · dato fittizio",
        statement: "Esempio dimostrativo: le proposte reali saranno aggiunte dopo la conferma dei candidati.",
        biography: "Profilo di esempio non riferito a una studentessa reale.",
        objectives: ["Esempio di obiettivo da sostituire"],
        published: false,
        demoOnly: true,
      },
      {
        position: 2,
        name: "Marco Rinaldi · DEMO",
        className: "4A Elettronica · dato fittizio",
        statement: "Esempio dimostrativo: le proposte reali saranno aggiunte dopo la conferma dei candidati.",
        biography: "Profilo di esempio non riferito a uno studente reale.",
        objectives: ["Esempio di obiettivo da sostituire"],
        published: false,
        demoOnly: true,
      },
    ];
    for (const candidate of demoCandidates) {
      const existing = await Candidate.exists({ institutionId: INSTITUTION_ID, position: candidate.position });
      if (!existing) await Candidate.create({ institutionId: INSTITUTION_ID, ...candidate });
    }
    console.log("Contenuti dimostrativi fittizi creati. Non sono state inserite risposte al sondaggio.");
  } finally {
    await mongoose.default.disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

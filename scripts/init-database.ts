import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());

  const { connectDb } = await import("../src/lib/db");
  const {
    AdminInvite,
    AdminSession,
    AdminUser,
    AuditEvent,
    Campaign,
    Candidate,
    ParticipationRegistration,
    RateLimit,
    SurveyResponse,
  } = await import("../src/models");
  const { INSTITUTION_ID } = await import("../src/lib/tenant");
  const mongoose = await import("mongoose");

  const models = [
    Campaign,
    Candidate,
    SurveyResponse,
    AdminUser,
    AdminSession,
    AdminInvite,
    AuditEvent,
    RateLimit,
    ParticipationRegistration,
  ];

  try {
    await connectDb();
    const db = mongoose.default.connection.db;
    if (!db) throw new Error("Database non selezionato.");

    for (const model of models) {
      const name = model.collection.collectionName;
      const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
      if (!exists) await model.createCollection();
      await model.createIndexes();
    }

    const campaign = await Campaign.updateOne(
      { institutionId: INSTITUTION_ID },
      {
        $setOnInsert: {
          institutionId: INSTITUTION_ID,
          status: "closed",
          heroTitle: "Il cambiamento inizia da noi.",
          heroSubtitle: "Due studenti. Idee concrete. Una scuola da costruire insieme.",
          goals: [
            { title: "Ascolto", description: "Raccogliere con chiarezza idee e punti di vista degli studenti." },
            { title: "Trasparenza", description: "Condividere aggiornamenti comprensibili sulle attivita." },
            { title: "Partecipazione", description: "Creare occasioni per contribuire alla vita del Polo Tecnico." },
          ],
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    console.log(
      JSON.stringify(
        {
          database: db.databaseName,
          collectionsReady: models.map(model => model.collection.collectionName),
          campaignCreated: campaign.upsertedCount === 1,
          status: "closed",
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.default.disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

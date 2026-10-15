import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (
    !process.env.MONGODB_URI ||
    !email ||
    !password ||
    !secret ||
    secret.length < 32 ||
    /^(REPLACE_WITH|YOUR_)/i.test(secret)
  ) {
    throw new Error(
      "Imposta MONGODB_URI, AUTH_SECRET (32+ caratteri), BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD nell’ambiente.",
    );
  }
  if (
    password.length < 14 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD deve avere almeno 14 caratteri con maiuscole, minuscole, numeri e simboli.",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL deve essere un indirizzo email valido.");
  }

  const { connectDb } = await import("../src/lib/db");
  const { AdminUser } = await import("../src/models");
  const { hash } = await import("bcryptjs");
  const { INSTITUTION_ID } = await import("../src/lib/tenant");
  const mongoose = await import("mongoose");

  try {
    await connectDb();
    const existing = await AdminUser.findOne({ institutionId: INSTITUTION_ID, role: "SUPER_ADMIN" }).select("email");
    if (existing)
      throw new Error("Esiste già un SUPER_ADMIN. Usa il flusso di invito o reset per gestire gli account.");
    const passwordHash = await hash(password, 12);
    await AdminUser.create({
      institutionId: INSTITUTION_ID,
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      permissions: [],
    });
    console.log(`SUPER_ADMIN creato per ${email}. Non sono state stampate credenziali.`);
  } finally {
    delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
    await mongoose.default.disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

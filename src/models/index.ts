import mongoose, { type Model, Schema } from "mongoose";

const options = { timestamps: true, strict: "throw" as const, versionKey: false as const };

const campaignSchema = new Schema(
  {
    institutionId: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["open", "closed", "scheduled"], default: "closed", index: true },
    opensAt: Date,
    closesAt: Date,
    closureMessage: {
      type: String,
      maxlength: 400,
      default: "Il sondaggio è chiuso. Puoi comunque consultare il programma e i profili.",
    },
    heroTitle: { type: String, maxlength: 120, default: "Il cambiamento inizia da noi." },
    heroSubtitle: {
      type: String,
      maxlength: 240,
      default: "Due studenti. Idee concrete. Una scuola da costruire insieme.",
    },
    ctaPrimary: { type: String, maxlength: 40, default: "Scopri il programma" },
    ctaSecondary: { type: String, maxlength: 50, default: "Esprimi il tuo sostegno" },
    footerText: {
      type: String,
      maxlength: 220,
      default: "Iniziativa indipendente degli studenti. Non è un servizio ufficiale dell’Istituto.",
    },
    goals: {
      type: [
        {
          title: { type: String, trim: true, maxlength: 60 },
          description: { type: String, trim: true, maxlength: 240 },
        },
      ],
      default: [],
    },
    classes: { type: [String], default: [] },
    program: { title: { type: String, maxlength: 120 }, url: String, size: Number, publishedAt: Date, fileKey: String },
    retentionDays: { type: Number, min: 1, max: 3650, default: 180 },
  },
  options,
);

const candidateSchema = new Schema(
  {
    institutionId: { type: String, required: true, index: true },
    position: { type: Number, required: true, min: 1, max: 2 },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    className: { type: String, trim: true, maxlength: 40 },
    biography: { type: String, trim: true, maxlength: 1200 },
    statement: { type: String, trim: true, maxlength: 500 },
    photoUrl: { type: String, maxlength: 500 },
    objectives: { type: [String], default: [] },
    socialLinks: {
      type: [{ label: { type: String, maxlength: 30 }, url: { type: String, maxlength: 300 } }],
      default: [],
    },
    published: { type: Boolean, default: false },
    demoOnly: { type: Boolean, default: false, index: true },
  },
  options,
);
candidateSchema.index({ institutionId: 1, position: 1 }, { unique: true });

const responseSchema = new Schema(
  {
    institutionId: { type: String, required: true, index: true },
    choice: { type: String, enum: ["yes", "no"], required: true },
    idempotencyHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { ...options, timestamps: { createdAt: true, updatedAt: false } },
);
responseSchema.index({ institutionId: 1, idempotencyHash: 1 }, { unique: true });
responseSchema.index({ institutionId: 1, choice: 1, createdAt: 1 });

const adminUserSchema = new Schema(
  {
    institutionId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["SUPER_ADMIN", "ADMIN", "EDITOR", "ANALYST", "VIEWER"], required: true },
    permissions: { type: [String], default: [] },
    disabledAt: Date,
    authVersion: { type: Number, default: 0 },
    totpSecret: { type: String, select: false },
    lastLoginAt: Date,
  },
  options,
);
adminUserSchema.index({ institutionId: 1, email: 1 }, { unique: true });

const adminSessionSchema = new Schema(
  {
    institutionId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    jti: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: Date,
  },
  { ...options, timestamps: { createdAt: true, updatedAt: false } },
);

const adminInviteSchema = new Schema(
  {
    institutionId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    role: { type: String, enum: ["ADMIN", "EDITOR", "ANALYST", "VIEWER"], required: true },
    tokenHash: { type: String, required: true, unique: true },
    purpose: { type: String, enum: ["invite", "reset"], required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    createdBy: { type: String, required: true },
  },
  { ...options, timestamps: { createdAt: true, updatedAt: false } },
);

const auditEventSchema = new Schema(
  {
    institutionId: { type: String, required: true, index: true },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, maxlength: 80 },
    resource: { type: String, required: true, maxlength: 100 },
    result: { type: String, enum: ["success", "failure"], required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { ...options, timestamps: { createdAt: true, updatedAt: false } },
);
auditEventSchema.index({ institutionId: 1, createdAt: -1 });

const rateLimitSchema = new Schema(
  {
    scope: { type: String, required: true },
    keyHash: { type: String, required: true },
    count: { type: Number, default: 0 },
    windowStart: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { ...options, timestamps: false },
);
rateLimitSchema.index({ scope: 1, keyHash: 1 }, { unique: true });

const participationSchema = new Schema(
  {
    institutionId: { type: String, required: true, index: true },
    classCode: { type: String, maxlength: 40 },
    createdAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { ...options, timestamps: false },
);
// This collection is separate by design: it never stores an answer or a response foreign key.

function model<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

export const Campaign = model("Campaign", campaignSchema);
export const Candidate = model("Candidate", candidateSchema);
export const SurveyResponse = model("SurveyResponse", responseSchema);
export const AdminUser = model("AdminUser", adminUserSchema);
export const AdminSession = model("AdminSession", adminSessionSchema);
export const AdminInvite = model("AdminInvite", adminInviteSchema);
export const AuditEvent = model("AuditEvent", auditEventSchema);
export const RateLimit = model("RateLimit", rateLimitSchema);
export const ParticipationRegistration = model("ParticipationRegistration", participationSchema);

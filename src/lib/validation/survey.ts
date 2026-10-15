import { z } from "zod";

export const surveyChoiceSchema = z.object({ choice: z.enum(["yes", "no"]), acknowledged: z.literal(true) }).strict();
export const surveyResponseSchema = surveyChoiceSchema.extend({ idempotencyKey: z.string().uuid() }).strict();
export type SurveyChoiceInput = z.infer<typeof surveyChoiceSchema>;
export const surveyFormSchema = z
  .object({ choice: z.enum(["yes", "no"]).optional(), acknowledged: z.boolean() })
  .superRefine((value, context) => {
    if (!value.choice) context.addIssue({ code: "custom", path: ["choice"], message: "Scegli una risposta." });
    if (!value.acknowledged)
      context.addIssue({ code: "custom", path: ["acknowledged"], message: "Conferma di aver letto l’informativa." });
  });
export type SurveyFormInput = z.infer<typeof surveyFormSchema>;

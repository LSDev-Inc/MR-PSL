import { describe, expect, it } from "vitest";
import { responsePercentages } from "@/lib/analytics-math";
import { surveyFormSchema, surveyResponseSchema } from "@/lib/validation/survey";

describe("anonymous survey validation", () => {
  it("requires an answer and privacy acknowledgement", () => {
    expect(surveyFormSchema.safeParse({ acknowledged: false }).success).toBe(false);
    expect(surveyFormSchema.safeParse({ choice: "yes", acknowledged: true }).success).toBe(true);
    expect(surveyFormSchema.safeParse({ choice: "maybe", acknowledged: true }).success).toBe(false);
  });
  it("accepts idempotency keys but rejects unexpected identity fields", () => {
    const valid = { choice: "no", acknowledged: true, idempotencyKey: "00000000-0000-4000-8000-000000000000" };
    expect(surveyResponseSchema.safeParse(valid).success).toBe(true);
    expect(surveyResponseSchema.safeParse({ ...valid, nome: "Studente" }).success).toBe(false);
  });
});

describe("response aggregates", () => {
  it("calculates percentages from persisted totals", () => {
    expect(responsePercentages(3, 1)).toEqual({ total: 4, yes: 3, no: 1, yesPercentage: 75, noPercentage: 25 });
  });
  it("handles an empty campaign safely", () => {
    expect(responsePercentages(0, 0)).toEqual({ total: 0, yes: 0, no: 0, yesPercentage: 0, noPercentage: 0 });
  });
});

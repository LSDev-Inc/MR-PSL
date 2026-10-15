import { expect, test } from "@playwright/test";

test("public campaign routes present the Italian campaign and informal survey", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Il cambiamento");
  const homeWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(homeWidth).toBeLessThanOrEqual(390);
  await page.getByRole("link", { name: /Esprimi il tuo sostegno/ }).click();
  await expect(page).toHaveURL(/\/partecipa$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Fai sentire");
  await expect(page.getByText(/non è un voto elettorale/i)).toBeVisible();
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(390);
});

test("campaign documents explain why the PDF may not yet be available", async ({ page }) => {
  await page.goto("/programma");
  await expect(page.getByText("Documento in preparazione")).toBeVisible();
});

test("theme toggle switches between dark and light and remembers the preference", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");

  await page.getByRole("button", { name: "Attiva il tema chiaro" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect
    .poll(() => html.evaluate(node => getComputedStyle(node).getPropertyValue("--ink").trim()))
    .toBe("#f4f3ee");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Attiva il tema scuro" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("admin pages and program API reject unauthenticated visitors", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);

  const response = await page.request.get("/api/admin/program");
  expect(response.status()).toBe(401);
});

import { test, expect } from "@playwright/test";

test.describe("datagrid-web selection", async () => {

    test("applies checkbox single selection checkbox", async ({ page }) => {
        const singleSelectionCheckbox = page.locator(".mx-name-dgSingleSelectionCheckbox");

        await page.goto("/p/single-selection");
        await page.waitForLoadState("networkidle");
        await expect(singleSelectionCheckbox).toBeVisible();
        await singleSelectionCheckbox.locator("input").first().click();
        await expect(page).toHaveScreenshot(`datagridSingleSelectionCheckbox.png`);
    });

    test("applies checkbox single selection row click", async ({ page }) => {
        const singleSelectionRowClick = page.locator(".mx-name-dgSingleSelectionRowClick");

        await page.goto("/p/single-selection");
        await page.waitForLoadState("networkidle");
        await expect(singleSelectionRowClick).toBeVisible();
        await singleSelectionRowClick
            .locator(".td")
            .first()
            .click({ modifiers: ["Shift"] });
        await expect(page).toHaveScreenshot(`datagridSingleSelectionRowClick.png`);
    });

    test("applies checkbox multi selection checkbox", async ({ page }) => {
        const multiSelectionCheckbox = page.locator(".mx-name-dgMultiSelectionCheckbox");

        await page.goto("/p/multi-selection");
        await page.waitForLoadState("networkidle");
        await expect(multiSelectionCheckbox).toBeVisible();
        await multiSelectionCheckbox.locator("input").first().click();
        await multiSelectionCheckbox.locator("input").nth(1).click();
        await expect(page).toHaveScreenshot(`datagridMultiSelectionCheckbox.png`);
    });

    test("applies checkbox multi selection row click", async ({ page }) => {
        const multiSelectionRowClick = page.locator(".mx-name-dgMultiSelectionRowClick");

        await page.goto("/p/multi-selection");
        await page.waitForLoadState("networkidle");
        await expect(multiSelectionRowClick).toBeVisible();
        await multiSelectionRowClick.locator(".td").first().click({ force: true });
        await multiSelectionRowClick
            .locator(".td")
            .nth(4)
            .click({ modifiers: ["Shift"] });
        await expect(page).toHaveScreenshot(`datagridMultiSelectionRowClick.png`);
    });

    test.fixme("checks accessibility violations", async ({ page }) => {
        await page.goto("/p/multi-selection");
        await page.initializeAccessibility();
        await page.setAccessibilityOptions({
            rules: [
                { id: "aria-required-children", reviewOnFail: true },
                { id: "label", reviewOnFail: true }
            ]
        });

        const multiSelectionCheckbox = page.locator(".mx-name-dgMultiSelectionCheckbox");
        const report = await multiSelectionCheckbox.accessibilitySnapshot({
            runOnly: {
                type: "tag",
                values: ["wcag2a"]
            }
        });

        for (const violation of report.violations) {
            console.log(`Violation: ${violation.description}`);
        }
    });
});

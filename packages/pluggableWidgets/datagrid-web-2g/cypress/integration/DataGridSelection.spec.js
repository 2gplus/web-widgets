describe("datagrid-web", () => {
    const browserName = Cypress.browser.name;

    describe("capabilities: single selection", () => {
        it("applies checkbox single selection checkbox", () => {
            cy.visit("/p/single-selection");
            cy.get(".mx-name-dgSingleSelectionCheckbox").should("be.visible");
            cy.get(".mx-name-dgSingleSelectionCheckbox input").first().click();
            cy.get(".mx-name-dgSingleSelectionCheckbox").compareSnapshot(
                `datagridSingleSelectionCheckbox-${browserName}`,
                0.1
            );
        });

        it("applies checkbox single selection row click", () => {
            cy.get(".mx-name-dgSingleSelectionRowClick").should("be.visible");
            cy.get(".mx-name-dgSingleSelectionRowClick .td").first().click({ force: true });
            cy.get(".mx-name-dgSingleSelectionRowClick").compareSnapshot(
                `datagridSingleSelectionRowClick-${browserName}`,
                0.1
            );
        });
    });
    describe("capabilities: multi selection", () => {
        it("applies checkbox multi selection checkbox", () => {
            cy.visit("/p/multi-selection");
            cy.get(".mx-name-dgMultiSelectionCheckbox").should("be.visible");
            cy.get(".mx-name-dgMultiSelectionCheckbox input").first().click();
            cy.get(".mx-name-dgMultiSelectionCheckbox input").eq(1).click();
            cy.get(".mx-name-dgMultiSelectionCheckbox").compareSnapshot(
                `datagridMultiSelectionCheckbox-${browserName}`,
                0.1
            );
        });

        it("applies checkbox multi selection row click", () => {
            cy.get(".mx-name-dgMultiSelectionRowClick").should("be.visible");
            cy.get(".mx-name-dgMultiSelectionRowClick .td").first().click({ force: true });
            cy.get(".mx-name-dgMultiSelectionRowClick .td").eq(4).click({ force: true });
            cy.get(".mx-name-dgMultiSelectionRowClick").compareSnapshot(
                `datagridMultiSelectionRowClick-${browserName}`,
                0.1
            );
        });
    });
});

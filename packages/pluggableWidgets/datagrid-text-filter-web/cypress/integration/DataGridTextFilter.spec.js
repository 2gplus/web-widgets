describe("datagrid-text-filter-web", () => {
    const browserName = Cypress.browser.name;

    beforeEach(() => {
        cy.visit("/"); // resets page
    });

    describe("visual testing:", () => {
        it("compares with a screenshot baseline and checks if all datagrid and filter elements are rendered as expected", () => {
            cy.wait(3000); // eslint-disable-line cypress/no-unnecessary-waiting
            cy.get(".mx-name-datagrid1").should("be.visible");
            cy.get(".mx-name-datagrid1").compareSnapshot(`dataGridTextFilter-${browserName}`, 0.1);
        });
    });

    describe("text filtering", () => {
        it("shows correct result", () => {
            cy.get(".mx-name-datagrid1").find(".filter-input").type("test3", { force: true });
            cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
            cy.get(".mx-name-datagrid1 .td").should("have.text", "12test3test3");
        });

        it("check the context", () => {
            cy.get(".mx-name-datagrid1").find(".filter-input").type("test3", { force: true });
            cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
            cy.get(".mx-name-datagrid1 .td").first().should("have.text", "12");
            cy.get(".mx-name-datagrid1 .td").first().click();
            cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
            cy.get(".mx-name-AgeTextBox input").should("have.value", "12");
        });
    });

    describe("with Default value", () => {
        it("set init condition (apply filer right after load", () => {
            // NBSP is coming from "FilterSelector" (facepalm)
            const NBSP = " ";
            const expected = [`First name${NBSP}`, "Delia1987", "Lizzie1987"];

            cy.visit("/#/filter_init_condition");
            cy.reload(true);
            cy.get(".mx-name-dataGrid21 [role=row]").each((row, index) => {
                cy.wrap(row).should("have.text", expected[index]);
            });
            cy.get(".mx-name-dataGrid21 .paging-status").should("have.text", "1 to 1 of 1");
        });
    });
    describe("a11y testing:", () => {
        it("checks accessibility violations", () => {
            cy.visit("/");
            cy.injectAxe();
            cy.wait(3000); // eslint-disable-line cypress/no-unnecessary-waiting
            cy.configureAxe({
                //TODO: Skipped some rules as we still need to review them
                rules: [
                    { id: "aria-required-children", reviewOnFail: true },
                    { id: "label", reviewOnFail: true },
                    { id: "aria-roles", reviewOnFail: true },
                    { id: "button-name", reviewOnFail: true },
                    { id: "duplicate-id-active", reviewOnFail: true },
                    { id: "duplicate-id", reviewOnFail: true }
                ]
            });
            // Test the widget at initial load
            cy.checkA11y(
                ".mx-name-datagrid1",
                {
                    runOnly: {
                        type: "tag",
                        values: ["wcag2a"]
                    }
                },
                cy.terminalLog
            );
        });
    });
});

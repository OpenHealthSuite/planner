import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

describe("activity", () => {
  const findAndOpenBySummary = (summaryText: string) => {
    cy.findAllByTestId("singular-activity")
      .contains(summaryText)
      .invoke("siblings", "button[aria-label=\"View\"]")
      .click();
  };

  it("can Create, Edit, Delete Activity", () => {
    cy.visit("/");
    cy.contains("button", "Menu").click();
    cy.contains("button", "Add Activity").click();

    const summaryText = `Summary Text ${uuidv4().split("-")[0]}`;

    cy.contains("label", "Summary")
      .invoke("siblings", "input")
      .type(summaryText);

    // testing-library method
    cy.findByLabelText("Date")
      .type(format(new Date(), "yyyy-MM-dd"));

    cy.findByTestId("save-activity")
      .click();
      
    cy.findAllByTestId("singular-activity")
      .contains(summaryText)
      .should("exist");

    cy.findAllByTestId("singular-activity")
      .contains(summaryText)
      .invoke("siblings", "button[aria-label=\"Mark Done\"]")
      .should("exist");

    findAndOpenBySummary(summaryText);

    cy.findByTestId("activity-edit-tab")
      .click();

    const editedSummaryText = `Summary Text edited ${uuidv4().split("-")[0]}`;

    cy.findByLabelText("Summary")
      .clear()
      .type(editedSummaryText);

    cy.contains("button", "Add Stage")
      .click();

    cy.findByTestId("save-activity")
      .click();

    cy.findAllByTestId("singular-activity")
      .contains(summaryText)
      .should("not.exist");

    findAndOpenBySummary(editedSummaryText);

    cy.contains("button", "Edit")
      .click();

    cy.findByTestId("delete-activity")
      .click();

    cy.findAllByTestId("singular-activity")
      .contains(summaryText)
      .should("not.exist");

    cy.findAllByTestId("singular-activity")
      .contains(editedSummaryText)
      .should("not.exist");
  });
});

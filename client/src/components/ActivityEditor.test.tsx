import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ActivityForm, AddActivityInterface, InitialFormValues } from "./ActivityEditor";

describe("Add Activity Interface", () => {
  test("Initial Load :: Has Button, No Modal Visible", () => {
    render(<AddActivityInterface />);
    expect(screen.getByText("Add Activity")).toBeInTheDocument();
    expect(screen.queryByText("Adding Activity")).not.toBeInTheDocument();
  });

  test("Click Button :: Loads Modal", async () => {
    const user = userEvent.setup();
    render(<AddActivityInterface />);
    await user.click(screen.getByText("Add Activity"));
    expect(screen.queryByText("Adding Activity")).toBeInTheDocument();
  });

  test("Full Journey :: Clicks Button, Fills in Minimal Form, Saves, Closes", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddActivityInterface activitySubmission={fakeSaver} onUpdate={fakeCallback}/>);
    await user.click(screen.getByText("Add Activity"));
    await user.type(screen.getByLabelText("Summary"), "Test name activity");
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    await user.click(screen.getByText("Save"));

    await waitForElementToBeRemoved(() => screen.queryByText("Adding Activity"));

    expect(fakeSaver).toBeCalledWith({
      completed: false,
      dateTime: "2023-04-03T00:00:00.000Z",
      notes: "",
      stages: [],
      summary: "Test name activity",
      timeRelevant: false,
    });
    expect(fakeCallback).toBeCalledWith("some-fake-id");
  });


  test("Full Journey :: Clicks Button, Fills in Form with Stage and Metric, Saves, Closes", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddActivityInterface activitySubmission={fakeSaver} onUpdate={fakeCallback}/>);
    await user.click(screen.getByText("Add Activity"));
    await user.type(screen.getByLabelText("Summary"), "Test name activity");
    await user.type(screen.getByLabelText("Date"), "2023-04-03");

    await user.click(screen.getByText("Add Stage"));

    await user.click(screen.getByText("Stage 1"));

    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "My Custom Stage");

    await user.clear(screen.getByLabelText("Repetitions"));
    await user.type(screen.getByLabelText("Repetitions"), "4");

    await user.click(screen.getByText("Add Metric"));

    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "11");

    await user.clear(screen.getByLabelText("Unit"));
    await user.type(screen.getByLabelText("Unit"), "meters");

    await user.click(screen.getByText("Save"));

    await waitForElementToBeRemoved(() => screen.queryByText("Adding Activity"));

    expect(fakeSaver).toBeCalledWith({
      completed: false,
      dateTime: "2023-04-03T00:00:00.000Z",
      notes: "",
      stages: [
        {description: "My Custom Stage",
          metrics: [
            {amount: 11, unit: "meters"}
          ],
          order: 0,
          repetitions:4}
      ],
      summary: "Test name activity",
      timeRelevant: false,
    });
    expect(fakeCallback).toBeCalledWith("some-fake-id");
  });


  test("Clears form on close and reopen", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddActivityInterface activitySubmission={fakeSaver} onUpdate={fakeCallback}/>);
    
    await user.click(screen.getByText("Add Activity"));

    await user.type(screen.getByLabelText("Summary"), "Test name activity");
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    await user.click(screen.getByText("Cancel"));

    await waitForElementToBeRemoved(() => screen.queryByText("Adding Activity"));

    expect(screen.queryByText("Adding Activity")).not.toBeInTheDocument();

    await user.click(screen.getByText("Add Activity"));
    expect(screen.getByLabelText("Summary")).toHaveValue("");
    expect(screen.getByLabelText("Date")).toHaveValue("");
  });


  test("Initial form has id && delete fn provided :: delete button visible, calls delete method with id", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    const fakeDelete = vi.fn().mockResolvedValue(null);
    const fakeClose = vi.fn();

    const initialActivity: InitialFormValues = {
      id: "my-fake-id",
      date: new Date().toISOString(),
      summary: "Test init id",
      stages: [],
      timeRelevant: false,
      completed: false,
      notes: ""
    };
    render(<ActivityForm 
      activitySubmission={fakeSaver} 
      onUpdate={fakeCallback}
      onClose={fakeClose}
      onDelete={fakeDelete}
      initialActivity={initialActivity}
    />);
    
    expect(screen.getByLabelText("Summary")).toHaveValue(initialActivity.summary);

    expect(screen.getByText("Delete")).toBeInTheDocument();
    await user.click(screen.getByText("Delete"));

    expect(fakeDelete).toBeCalledWith(initialActivity.id);
    expect(fakeCallback).toBeCalled();
    expect(fakeClose).toBeCalled();
  });


  test("Validation", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddActivityInterface activitySubmission={fakeSaver} onUpdate={fakeCallback}/>);
    await user.click(screen.getByText("Add Activity"));
    expect(screen.getByText("Save")).toBeDisabled();
    await user.type(screen.getByLabelText("Summary"), "Test name activity");
    expect(screen.getByText("Save")).toBeDisabled();
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    expect(screen.getByText("Save")).not.toBeDisabled();
  });
});
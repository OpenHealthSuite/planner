import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AddActivityInterface } from "./ActivityEditor";
import { activityTypes } from "../types";

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

  test("Full Journey :: Clicks Button, Fills in Form, Saves, Closes", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddActivityInterface activitySubmission={fakeSaver} onCreated={fakeCallback}/>);
    await user.click(screen.getByText("Add Activity"));
    await user.type(screen.getByLabelText("Name"), "Test name activity");
    await user.selectOptions(screen.getByLabelText("Type"), activityTypes[0]);
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    await user.click(screen.getByText("Save"));

    await waitForElementToBeRemoved(() => screen.queryByText("Adding Activity"));

    expect(fakeSaver).toBeCalledWith({
      attributes: {},
      completed: false,
      dateTime: "2023-04-03T00:00:00.000Z",
      name: "Test name activity",
      timeRelevant: false,
      type: activityTypes[0]
    });
    expect(fakeCallback).toBeCalledWith("some-fake-id");
  });


  test("Clears form on close and reopen", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddActivityInterface activitySubmission={fakeSaver} onCreated={fakeCallback}/>);
    
    await user.click(screen.getByText("Add Activity"));

    await user.type(screen.getByLabelText("Name"), "Test name activity");
    await user.selectOptions(screen.getByLabelText("Type"), activityTypes[0]);
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    await user.click(screen.getByText("Cancel"));

    await waitForElementToBeRemoved(() => screen.queryByText("Adding Activity"));

    expect(screen.queryByText("Adding Activity")).not.toBeInTheDocument();

    await user.click(screen.getByText("Add Activity"));
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Type")).toHaveValue("");
    expect(screen.getByLabelText("Date")).toHaveValue("");
  });


  test("Validation", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddActivityInterface activitySubmission={fakeSaver} onCreated={fakeCallback}/>);
    await user.click(screen.getByText("Add Activity"));
    expect(screen.getByText("Save")).toBeDisabled();
    await user.type(screen.getByLabelText("Name"), "Test name activity");
    expect(screen.getByText("Save")).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Type"), activityTypes[0]);
    expect(screen.getByText("Save")).toBeDisabled();
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    expect(screen.getByText("Save")).not.toBeDisabled();
  });
});
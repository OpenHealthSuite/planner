import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  AddRecurringActivityInterface,
  InitialFormValues,
  RecurringActivityForm,
  type AddRecurringActivityInterfaceProps,
  type RecurringActivityFormProps
} from "./RecurringActivityEditor";
import { ApplicationContext, ApplicationContextType } from "../App";
import { Plan } from "../types";

const AddRecurringActivityInterfaceWithContext = ({ context, ...rest }: {
  context: ApplicationContextType
} & AddRecurringActivityInterfaceProps) => (<ApplicationContext.Provider value={context}>
  <AddRecurringActivityInterface {...rest} />
</ApplicationContext.Provider>);

const RecurringActivityFormWithContext = ({ context, ...rest }: {
  context: ApplicationContextType
} & RecurringActivityFormProps) => (<ApplicationContext.Provider value={context}>
  <RecurringActivityForm {...rest} />
</ApplicationContext.Provider>);

const happyContext = {
  userPlans: [] as Plan[]
} as ApplicationContextType;

describe("Add Recurring Activity Interface", () => {
  test("Initial Load :: Has Button, No Modal Visible", () => {
    render(<AddRecurringActivityInterface />);
    expect(screen.getByText("Add Recurring Activity")).toBeInTheDocument();
    expect(screen.queryByText("Adding Recurring Activity")).not.toBeInTheDocument();
  });

  test("Click Button :: Loads Modal", async () => {
    const user = userEvent.setup();
    render(<AddRecurringActivityInterface />);
    await user.click(screen.getByText("Add Recurring Activity"));
    expect(screen.queryByText("Adding Recurring Activity")).toBeInTheDocument();
  });

  test("Full Journey :: Clicks Button, Fills in Minimal Form, Saves, Closes", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddRecurringActivityInterface activitySubmission={fakeSaver} onUpdate={fakeCallback}/>);
    await user.click(screen.getByText("Add Recurring Activity"));
    await user.type(screen.getByLabelText("Summary"), "Test name activity");
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    await user.click(screen.getByText("Save"));

    await waitForElementToBeRemoved(() => screen.queryByText("Adding Recurring Activity"));

    expect(fakeSaver).toBeCalledWith({
      dateTimeStart: "2023-04-03T00:00:00.000Z",
      recurrEachDays: 1,
      stages: [],
      summary: "Test name activity",
      timeRelevant: false
    });
    expect(fakeCallback).toBeCalledWith("some-fake-id");
  });

  test("Full Journey :: Clicks Button, Fills in Form with Stage and Metric, Saves, Closes", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddRecurringActivityInterface activitySubmission={fakeSaver} onUpdate={fakeCallback}/>);
    await user.click(screen.getByText("Add Recurring Activity"));
    await user.type(screen.getByLabelText("Summary"), "Test name activity");
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    await user.clear(screen.getByLabelText("Recurr Every n Days"));
    await user.type(screen.getByLabelText("Recurr Every n Days"), "4");

    await user.click(screen.getByText("Add Stage"));

    await user.click(screen.getByLabelText("stage-0-toggle"));

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

    await waitForElementToBeRemoved(() => screen.queryByText("Adding Recurring Activity"));

    expect(fakeSaver).toBeCalledWith({
      dateTimeStart: "2023-04-03T00:00:00.000Z",
      recurrEachDays: 4,
      planId: undefined,
      stages: [
        {
          description: "My Custom Stage",
          completed: false,
          metrics: [
            { amount: 11, unit: "meters" }
          ],
          order: 0,
          repetitions: 4
        }
      ],
      summary: "Test name activity",
      timeRelevant: false
    });
    expect(fakeCallback).toBeCalledWith("some-fake-id");
  });

  test("Clears form on close and reopen", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddRecurringActivityInterface activitySubmission={fakeSaver} onUpdate={fakeCallback}/>);

    await user.click(screen.getByText("Add Recurring Activity"));

    await user.type(screen.getByLabelText("Summary"), "Test name activity");
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    await user.click(screen.getByText("Cancel"));

    await waitForElementToBeRemoved(() => screen.queryByText("Adding Recurring Activity"));

    expect(screen.queryByText("Adding Recurring Activity")).not.toBeInTheDocument();

    await user.click(screen.getByText("Add Recurring Activity"));
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
      recurrEachDays: 2
    };
    render(<RecurringActivityForm
      activitySubmission={fakeSaver}
      onUpdate={fakeCallback}
      onClose={fakeClose}
      onDelete={fakeDelete}
      initialRecurringActivity={initialActivity}
    />);

    expect(screen.getByLabelText("Summary")).toHaveValue(initialActivity.summary);

    expect(screen.getByText("Delete")).toBeInTheDocument();
    await user.click(screen.getByText("Delete"));

    expect(fakeDelete).toBeCalledWith(initialActivity.id);
    expect(fakeCallback).toBeCalled();

    expect(fakeClose).toBeCalled();
  });

  test("Can add recurring activity to plan from context", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    const context = {
      userPlans: [{
        id: "some-user-plan-id",
        name: "My Plan"
      }]
    } as ApplicationContextType;
    render(<AddRecurringActivityInterfaceWithContext context={context} activitySubmission={fakeSaver} onUpdate={fakeCallback}/>);
    await user.click(screen.getByText("Add Recurring Activity"));
    await user.type(screen.getByLabelText("Summary"), "Test name activity");
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    await user.selectOptions(screen.getByLabelText("Plan"), context.userPlans[0].name);
    expect(screen.getByText("Save")).not.toBeDisabled();
    await user.click(screen.getByText("Save"));

    expect(fakeSaver).toBeCalledWith({
      dateTimeStart: "2023-04-03T00:00:00.000Z",
      recurrEachDays: 1,
      planId: "some-user-plan-id",
      stages: [],
      summary: "Test name activity",
      timeRelevant: false
    });
  });

  test("Can unset plan from activity", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    const initalRecurringActivity = {
      date: "2023-04-03T00:00:00.000Z",
      recurrEachDays: 1,
      planId: "some-user-plan-id",
      stages: [],
      summary: "Test name activity",
      timeRelevant: false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    render(<RecurringActivityFormWithContext
      context={happyContext}
      initialRecurringActivity={initalRecurringActivity}
      onUpdate={fakeSaver} activitySubmission={fakeCallback} onClose={vi.fn()}/>);

    await user.selectOptions(screen.getByLabelText("Plan"), "None");
    expect(screen.getByText("Save")).not.toBeDisabled();
    await user.click(screen.getByText("Save"));

    delete initalRecurringActivity.planId;
    initalRecurringActivity.dateTimeStart = new Date(Date.parse(initalRecurringActivity.date)).toISOString();
    delete initalRecurringActivity.date;
    expect(fakeCallback).toBeCalledWith(initalRecurringActivity);
  });

  test("Validation", async () => {
    const user = userEvent.setup();
    const fakeSaver = vi.fn().mockResolvedValue("some-fake-id");
    const fakeCallback = vi.fn();
    render(<AddRecurringActivityInterface activitySubmission={fakeSaver} onUpdate={fakeCallback}/>);
    await user.click(screen.getByText("Add Recurring Activity"));
    expect(screen.getByText("Save")).toBeDisabled();
    await user.type(screen.getByLabelText("Summary"), "Test name activity");
    expect(screen.getByText("Save")).toBeDisabled();
    await user.type(screen.getByLabelText("Date"), "2023-04-03");
    expect(screen.getByText("Save")).not.toBeDisabled();
  });
});

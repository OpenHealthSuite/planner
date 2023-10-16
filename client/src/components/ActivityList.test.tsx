import { RecurringActivity } from "../types";
import { createRecurringDateMap } from "./ActivityList";

describe("Add Activity Interface", () => {
  test("Recurring activity mapper returns correct over DST", () => {
    const displayDays = [
      new Date(2023, 9, 16, 12, 0, 0),
      new Date(2023, 9, 17, 12, 0, 0),
      new Date(2023, 9, 18, 12, 0, 0),
      new Date(2023, 9, 19, 12, 0, 0),
      new Date(2023, 9, 20, 12, 0, 0),
      new Date(2023, 9, 21, 12, 0, 0),
      new Date(2023, 9, 22, 12, 0, 0),
      new Date(2023, 9, 23, 12, 0, 0),
      new Date(2023, 9, 24, 12, 0, 0),
      new Date(2023, 9, 25, 12, 0, 0),
      new Date(2023, 9, 26, 12, 0, 0),
      new Date(2023, 9, 27, 12, 0, 0),
      new Date(2023, 9, 28, 12, 0, 0),
      new Date(2023, 9, 29, 12, 0, 0),
      new Date(2023, 9, 30, 12, 0, 0),
      new Date(2023, 9, 31, 12, 0, 0)
    ];

    const recurringActivities = [{
      id: "73c90140-7638-488a-b376-a5e74ddbc9d6",
      userId: "tilt-test-user-id",
      planId: undefined,
      summary: "sunday runday",
      stages: [],
      recurrEachDays: 7,
      dateTimeStart: new Date("2023-05-28T00:00:00Z"),
      timeRelevant: false
    } as RecurringActivity
    ];

    const actualResult = createRecurringDateMap(displayDays, recurringActivities);

    expect(actualResult).toStrictEqual({
      "2023-10-16": [],
      "2023-10-17": [],
      "2023-10-18": [],
      "2023-10-19": [],
      "2023-10-20": [],
      "2023-10-21": [],
      "2023-10-22": [recurringActivities[0]],
      "2023-10-23": [],
      "2023-10-24": [],
      "2023-10-25": [],
      "2023-10-26": [],
      "2023-10-27": [],
      "2023-10-28": [],
      "2023-10-29": [recurringActivities[0]],
      "2023-10-30": [],
      "2023-10-31": []
    });
  });
});

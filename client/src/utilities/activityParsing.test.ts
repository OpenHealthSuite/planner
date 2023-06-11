import { parseISO } from "date-fns";
import { parseActivityFromString } from "./activityParsing";
import { randomUUID } from "node:crypto";

describe("parseActivityFromString", () => {
  test("Totally mangled string :: returns error", () => {
    const res = parseActivityFromString(randomUUID());
    expect(res.success).toBeFalsy();
    expect(!res.success && res.error).toBeTruthy();
  });

  test.each(
    [
      [
        "Some summary,2023-12-12T00:00:00,false,false",
        {
          summary: "Some summary",
          dateTime: parseISO("2023-12-12T00:00:00"),
          timeRelevant: false,
          completed: false,
          stages: []
        }
      ],
      [
        "Some other summary,2023-11-04T09:00:00,true,true",
        {
          summary: "Some other summary",
          dateTime: parseISO("2023-11-04T09:00:00"),
          timeRelevant: true,
          completed: true,
          stages: []
        }
      ]
    ]
  )("Activities without stages :: parse successfully", (strActivity, activity) => {
    const res = parseActivityFromString(strActivity);
    expect(res.success).toBeTruthy();
    expect(res.success && res.activity).toEqual(activity);
  });
});

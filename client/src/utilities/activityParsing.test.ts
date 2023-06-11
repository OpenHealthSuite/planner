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

  test.each(
    [
      [
        "Some summary,2023-12-12T00:00:00,false,false,::3::Stage One,||15||min,::5::Stage Two,||20||miles,||10||km",
        {
          summary: "Some summary",
          dateTime: parseISO("2023-12-12T00:00:00"),
          timeRelevant: false,
          completed: false,
          stages: [
            {
              order: 0,
              description: "Stage One",
              repetitions: 3,
              metrics: [
                {
                  amount: 15,
                  unit: "min"
                }
              ]
            },
            {
              order: 1,
              description: "Stage Two",
              repetitions: 5,
              metrics: [
                {
                  amount: 20,
                  unit: "miles"
                },
                {
                  amount: 10,
                  unit: "km"
                }
              ]
            }
          ]
        }
      ]
    ]
  )("Activities with stages :: parse successfully", (strActivity, activity) => {
    const res = parseActivityFromString(strActivity);
    expect(res.success).toBeTruthy();
    expect(res.success && res.activity).toEqual(activity);
  });

  test.each([
    ["Some summary,2023-12-12T00:00:00,false,false,::3::Stage One,| |15||min", 6],
    ["Some summary,2023-12-12T00:00:00,false,false,::3: :Stage One,||15||min", 5],
    ["Some summary,2023-12-12T00:00:00,false,false,::asdm::Stage One,||15||min", 5],
    ["Some summary,2023-12-12T00:00:00,false,false,::3::Stage One,||ktgm||min", 6]
  ])("Malformed stage :: returns error", (str, errorPos) => {
    const res = parseActivityFromString(str);
    expect(res.success).toBeFalsy();
    expect(!res.success && res.error).toBe("Malformed part :: Error parsing item in index " + errorPos);
  });
});

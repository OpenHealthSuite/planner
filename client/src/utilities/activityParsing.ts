// export type ActivityStageMetric = {
//   amount: number;
//   unit: string;
// };

import { Activity } from "../types";
import { parseISO } from "date-fns";

// export type ActivityStage = {
//   order: number;
//   description: string;
//   metrics: ActivityStageMetric[];
//   repetitions: number;
// };

// export type Activity = {
//   id: string;
//   userId: string;
//   recurringActivityId?: string;
//   planId?: string;
//   summary: string;
//   stages: ActivityStage[];
//   dateTime: Date;
//   timeRelevant: boolean;
//   completed: boolean;
//   notes: string;
// };

// summary, dateTime, timeRelevant, completed, ::stageDesc::reps, ||amount||metric
// Some summary, 2023-12-12, false, false, ::Stage One::3, ||15||min, ||20||min, ||Stage Two||5, ||23||min

type ParsedActivity = {
  success: true,
  activity: Omit<Activity, "id" | "userId" | "recurringActivityId" | "notes">
};

type ErrorParsingActivity = {
  success: false,
  error: string
}

type ActivityParsingResult = ParsedActivity | ErrorParsingActivity;

export const parseActivityFromString = (input: string): ActivityParsingResult => {
  const [summary, dateTime, timeRelevant, completed, ...stages] = input.split(",");
  if (summary && dateTime && timeRelevant && completed) {
    return {
      success: true,
      activity: {
        summary,
        dateTime: parseISO(dateTime),
        timeRelevant: timeRelevant === "true",
        completed: completed === "true",
        stages: []
      }
    };
  }
  return {
    success: false,
    error: "Not Implemented"
  };
};

// export type ActivityStageMetric = {
//   amount: number;
//   unit: string;
// };

import { Activity, ActivityStage } from "../types";
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
// Some summary, 2023-12-12, false, false, ::3::Stage One, ||15||min, ||20||min, ||Stage Two||5, ||23||min

type ParsedActivity = {
  success: true,
  activity: Omit<Activity, "id" | "userId" | "recurringActivityId" | "notes">
};

type ErrorParsingActivity = {
  success: false,
  error: string
}

type ActivityParsingResult = ParsedActivity | ErrorParsingActivity;

const STAGES_OFFSET = 5;

const stageParsingReducer = (accumulator: ActivityStage[], stgPrt: string, index: number): ActivityStage[] => {
  const stageError = new Error("Error parsing item in index " + (index + STAGES_OFFSET));
  if (stgPrt.startsWith("::")) {
    const [, rawRepetitions, description] = stgPrt.split("::");
    const repetitions = parseInt(rawRepetitions);
    if (!rawRepetitions || isNaN(repetitions) || !description) {
      throw stageError;
    }
    accumulator.push({
      order: accumulator.length,
      description,
      repetitions,
      metrics: []
    });
  } else if (stgPrt.startsWith("||")) {
    const [, rawAmount, unit] = stgPrt.split("||");
    const amount = parseInt(rawAmount);
    if (!amount || isNaN(amount) || !unit) {
      throw stageError;
    }
    accumulator[accumulator.length - 1].metrics.push({
      amount,
      unit
    });
  } else {
    throw stageError;
  }
  return accumulator;
};

export const parseActivityFromString = (input: string): ActivityParsingResult => {
  const [summary, dateTime, timeRelevant, completed, ...stages] = input.split(",");
  if (summary && dateTime && timeRelevant && completed) {
    try {
      return {
        success: true,
        activity: {
          summary,
          dateTime: parseISO(dateTime),
          timeRelevant: timeRelevant === "true",
          completed: completed === "true",
          stages: stages.reduce(stageParsingReducer, [])
        }
      };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (ex: any) {
      return {
        success: false,
        error: "Malformed part :: " + ex.message
      };
    }
  }
  return {
    success: false,
    error: "Missing minimum data"
  };
};

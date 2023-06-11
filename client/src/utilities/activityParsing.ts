import { Activity, ActivityStage } from "../types";
import { isValid, parseISO } from "date-fns";

type ParsedActivity = {
  success: true,
  activity: Omit<Activity, "id" | "userId" | "recurringActivityId" | "notes">,
  original: string
};

type ErrorParsingActivity = {
  success: false,
  error: string,
  original: string
}

type ActivityParsingResult = ParsedActivity | ErrorParsingActivity;

const STAGES_OFFSET = 5;

const BASIC_PARSING_ERROR_MSG = "Error parsing item in index ";

const stageParsingReducer = (accumulator: ActivityStage[], stgPrt: string, index: number): ActivityStage[] => {
  const stageError = new Error(BASIC_PARSING_ERROR_MSG + (index + STAGES_OFFSET));
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
  const [summary, rawDateTime, timeRelevant, completed, ...stages] = input.split(",");
  if (summary && rawDateTime && timeRelevant && completed) {
    try {
      const dateTime = parseISO(rawDateTime);
      if (!isValid(dateTime)) {
        throw new Error(BASIC_PARSING_ERROR_MSG + 1);
      }
      return {
        success: true,
        activity: {
          summary,
          dateTime,
          timeRelevant: timeRelevant === "true",
          completed: completed === "true",
          stages: stages.reduce(stageParsingReducer, [])
        },
        original: input
      };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (ex: any) {
      return {
        success: false,
        error: "Malformed part :: " + ex.message,
        original: input
      };
    }
  }
  return {
    success: false,
    error: "Missing minimum data",
    original: input
  };
};

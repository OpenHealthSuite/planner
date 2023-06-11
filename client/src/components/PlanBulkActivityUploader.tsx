import { useCallback, useState } from "react";
import { ActivityParsingResult, parseActivityFromString } from "../utilities/activityParsing";
import { ActivityApiSubmission } from "../types";
import { plannerPostRequest } from "../utilities/apiRequest";

type UploadStages = "start" | "processing" | "validating" | "uploading" | "complete"

type ParsingSummary = {
  total: number,
  validCount: number,
  errorCount: number,
  errors: [number, string, string][]
}

const defaultSummary: ParsingSummary = {
  total: 0,
  validCount: 0,
  errorCount: 0,
  errors: []
};

const activityCreation = (activity: ActivityApiSubmission) => {
  return plannerPostRequest<ActivityApiSubmission, string>("/activities", activity);
};

export const PlanBulkActivityUploader = ({ planId } : { planId: string }) => {
  const [stage, setStage] = useState<UploadStages>("start");
  const [parsed, setParsed] = useState<ActivityParsingResult[]>([]);
  const [parsingSummary, setParsingSummary] = useState<ParsingSummary>(defaultSummary);
  const [uploadCount, setUploadCount] = useState(0);

  const uploadParsedActivities = useCallback(async (planId: string, parsed: ActivityParsingResult[]): Promise<void> => {
    for (const act of parsed) {
      try {
        if (act.success) {
          await activityCreation({
            planId,
            summary: act.activity.summary,
            stages: act.activity.stages,
            timeRelevant: act.activity.timeRelevant,
            completed: act.activity.completed,
            notes: "",
            dateTime: act.activity.dateTime.toISOString()
          });
          setUploadCount((prev) => {
            return prev + 1;
          });
        }
      } catch {
        console.error("Something went wrong");
      }
    }
  }, [setUploadCount]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setStage("processing");
    try {
      // It's really unhappy about this - ignore it, and just handle the error
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const fileText: string = await formData.get("activities-file").text();
      const internalParsed = fileText.split("\n").map(parseActivityFromString);
      setParsed(internalParsed);
      setParsingSummary(internalParsed.reduce<ParsingSummary>((acc, curr, index) => {
        acc.total += 1;
        acc.validCount += curr.success ? 1 : 0;
        acc.errorCount += curr.success ? 0 : 1;
        if (!curr.success) {
          acc.errors.push([index, curr.original, curr.error]);
        }
        return acc;
      }, defaultSummary));
      setStage("validating");
    } catch {
      console.error("Error accessing data");
      setStage("start");
    }
  }, [setParsed, setStage, setParsingSummary]);

  const handleUpload = useCallback((parsed: ActivityParsingResult[]) => {
    setStage("uploading");
    uploadParsedActivities(planId, parsed).then(() => {
      setStage("complete");
    });
  }, [planId, setStage]);

  return <>
    {stage === "start" && <form name="bulkactivityuploader" onSubmit={(e) => handleSubmit(e)}>
      <input
        id="activities-file"
        name="activities-file"
        accept="text/csv"
        type="file"
      />
      <button type="submit">Upload</button>
    </form>}
    {stage === "processing" && <>Processing</>}
    {stage === "validating" && <ul>
      <li>Activities to upload: {parsingSummary.validCount}</li>
      {parsingSummary.errorCount > 0 && <li>Errors: {parsingSummary.errorCount}</li>}
      {parsingSummary.errors.length > 0 && <li>
        <ul>
          {parsingSummary.errors.map(([index, original, error]) => <li key={index}>
            {error} :: {original}
          </li>)}
        </ul>
      </li>}
      <li><button onClick={() => handleUpload(parsed)}>Upload</button></li>
    </ul>}
    {stage === "uploading" && <>
      {uploadCount}/{parsingSummary.validCount} Uploaded
    </>}
    {stage === "complete" && <>
      {uploadCount}/{parsingSummary.validCount} Uploaded, all done!
    </>}
  </>;
};

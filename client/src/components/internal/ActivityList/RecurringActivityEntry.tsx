import { Flex, IconButton,Text } from "@chakra-ui/react";
import { addDays, isAfter } from "date-fns";
import { CheckIcon, RepeatIcon } from "@chakra-ui/icons";
import { Activity, ActivityApiSubmission, RecurringActivity } from "../../../types";
import { useCallback, useState } from "react";
import { plannerPostRequest } from "../../../utilities/apiRequest";

export const RecurringActivitySummary = ({ daysActivities, activity, activityDay, onUpdate } : { daysActivities?: Activity[] ,activity: RecurringActivity, activityDay: Date, onUpdate: (str: string) => void }) => {
  const [loading, isLoading] = useState(false);

  const createAssociatedCompleteActivity = useCallback((recurringActivity: RecurringActivity) => {
    isLoading(true);
    const {summary, stages, timeRelevant} = recurringActivity;
    const activity: ActivityApiSubmission = {
      summary,
      stages,
      timeRelevant,
      recurringActivityId: recurringActivity.id,
      dateTime: activityDay.toISOString(),
      completed: true,
      notes: "Completed from Recurring Activity"
    };
    plannerPostRequest<ActivityApiSubmission, string>("/activities", activity)
      .then(onUpdate)
      .finally(() => isLoading(false));
  }, [isLoading, onUpdate]);

  const tomorrow = addDays(new Date(new Date().toISOString().split("T")[0]), 1);
  const isCompletable = isAfter(tomorrow, activityDay);
  const isCompleted = daysActivities && daysActivities.findIndex(da => da.recurringActivityId === activity.id) === -1;
  return <Flex margin="0.25em 0"
    padding="0.25em 0.25em 0.25em 0.5em"
    marginRight="1em"
    border={"1px dashed black"}
    backgroundColor="white"
    borderRadius="0.25em"
    alignItems={"center"}>
    <RepeatIcon marginRight={"0.5em"}/>
    <Text>{activity.summary}</Text>
    {!isCompleted && isCompletable && <IconButton size="sm"
      aria-label="Mark Done"
      marginLeft={"auto"}
      marginRight={0}
      onClick={() => createAssociatedCompleteActivity(activity)}
      isDisabled={loading}
      icon={<CheckIcon />} />}
  </Flex>;
};
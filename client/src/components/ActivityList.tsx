import { Box, Flex, Text } from "@chakra-ui/react";
import { addDays, format, subDays, differenceInDays } from "date-fns";
import { Activity, RecurringActivity } from "../types";
import { useContext, useEffect, useState } from "react";
import { plannerGetRequest } from "../utilities/apiRequest";
import { ApplicationContext } from "../App";
import { SingularActivitySummary } from "./internal/ActivityList/SingularActivityEntry";
import { RecurringActivitySummary } from "./internal/ActivityList/RecurringActivityEntry";

export type ActivityListProps = {
    targetDate?: Date
}

const TODAY_BACKGROUND = `repeating-linear-gradient(
    135deg,
    #EDEDED,
    #EDEDED 2px,
    #FFFFFF 2px,
    #FFFFFF 14px
  );`;

const DaysActivities = ({ date, activities, recurringActivities, onUpdate }: { 
    date: Date,
    activities: Activity[],
    recurringActivities: RecurringActivity[],
    onUpdate: (str: string) => void
}) => {
  const completedRecurringActivityIds = activities ? activities.reduce<string[]>((acc, curr) => {
    if (!curr.recurringActivityId) {
      return acc;
    }
    return [...acc, curr.recurringActivityId];
  }, []) : [];
  return <Flex margin={"0.5em 0"} 
    borderBottom={date.getDay() === 6 ? "1px dashed black" : undefined}
    background={date.toISOString().split("T")[0] === new Date().toISOString().split("T")[0] ? TODAY_BACKGROUND : undefined}>
    <Box w={"4em"} 
      paddingRight={"0.5em"}
      marginRight={"0.5em"} 
      textAlign={"right"}
      borderRight={"1px solid black"}>
      <Text>{format(date, "eee")}</Text>
    </Box>
    <Box flex='1'>
      {!activities && !recurringActivities && <Box margin="0.25em 0" padding="0.25em">
        <Text>Rest</Text>
      </Box>}
      {activities && activities.map(x => <SingularActivitySummary key={x.id} 
        activity={x}
        onUpdate={onUpdate}/>)}
      {recurringActivities.filter(x => !completedRecurringActivityIds.includes(x.id)).map(x => <RecurringActivitySummary 
        key={x.id}
        activityDay={date}
        onUpdate={onUpdate}
        activity={x}/>)}</Box>
  </Flex>;
};

export const ActivityList = ({
  targetDate = new Date() 
} : ActivityListProps) => {

  const [activities, setActivities] = useState<Activity[]>([]);
  const [recurringActivities, setRecurringActivities] = useState<RecurringActivity[]>([]);
  const {latestCreatedActivityId: updated, setLatestCreatedActivityId} = useContext(ApplicationContext);
  const [, setLoading] = useState(true);
  const [, setError] = useState(false);
  
  const totalDaysToLoad = 21;
  const preceedingDays = 7;
  const daysToDisplay = Array.apply(null, Array(totalDaysToLoad))
    .map((_, i) => addDays(subDays(targetDate, preceedingDays), i));

  useEffect(() => {
    setLoading(true);
    Promise.all([
      plannerGetRequest<Activity[]>("/activities"),
      plannerGetRequest<RecurringActivity[]>("/recurring_activities")
    ])
      .then(([acts, recurringActs]) => {
        acts = acts.map(a => {
          a.dateTime = new Date(a.dateTime);
          return a;
        });
        recurringActs = recurringActs.map(a => {
          a.dateTimeStart = new Date(a.dateTimeStart);
          return a;
        });
        return [acts, recurringActs] as [Activity[], RecurringActivity[]];
      })
      .then(([acts, recurringActs]) => {
        setError(false);
        setActivities(acts);
        setRecurringActivities(recurringActs);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [updated, setActivities, setLoading, setError]);

  
  const activityDayMap = activities.reduce<{[key: string]: Activity[]}>((acc, curr)=>{
    const date = curr.dateTime.toISOString().split("T")[0];
    if (acc[date]) {
      acc[date] = [...acc[date], curr];
    } else {
      acc[date] = [curr];
    }
    return acc;
  }, {});

  const recurringActivityDayMap = daysToDisplay.reduce<{[key: string]: RecurringActivity[]}>((recAcc, curr)=>{
    // I'm sure this could be more efficient, but it's already
    // coming out of a lower loop
    const date = curr.toISOString().split("T")[0];
    recAcc[date] = recurringActivities.filter(ra => {
      const dayDiff = differenceInDays(new Date(date), new Date(ra.dateTimeStart.toISOString().split("T")[0]));
      return dayDiff === 0 || (dayDiff > 0 && dayDiff % ra.recurrEachDays === 0);
    });
    return recAcc;
  }, {});

  return <div>
    {daysToDisplay.map(x => {
      const date = x.toISOString().split("T")[0];
      return <DaysActivities key={date} 
        date={x} 
        activities={activityDayMap[date] ?? []}
        recurringActivities={recurringActivityDayMap[date]}
        onUpdate={setLatestCreatedActivityId}/>;
    })}
  </div>;
};
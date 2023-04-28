import { Box, Flex, Text } from "@chakra-ui/react";
import { addDays, format, subDays, differenceInDays } from "date-fns";
import { Activity, RecurringActivity } from "../types";
import { useContext, useEffect, useState } from "react";
import { plannerGetRequest } from "../utilities/apiRequest";
import { ApplicationContext } from "../App";
import { SingularActivitySummary } from "./internal/ActivityList/SingularActivityEntry";
import { RecurringActivitySummary } from "./internal/ActivityList/RecurringActivityEntry";

export type ActivityListProps = {
  initialDate?: Date
}

const TODAY_BACKGROUND = `repeating-linear-gradient(
    135deg,
    #EDEDED,
    #EDEDED 2px,
    #FFFFFF 2px,
    #FFFFFF 14px
  );`;

const DaysActivities = ({ id, date, activities, recurringActivities, onUpdate }: {
    id: string | undefined,
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
  return <Flex id={id}
    margin={"0.5em 0"}
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
  initialDate = new Date() 
} : ActivityListProps) => {

  const [activities, setActivities] = useState<Activity[]>([]);
  const [recurringActivities, setRecurringActivities] = useState<RecurringActivity[]>([]);

  const [activityDayMap, setActivityDayMap] = useState<{[key: string]: Activity[]}>({});
  const [recurringActivityDayMap, setRecurringActivityDayMap] = useState<{[key: string]: RecurringActivity[]}>({});

  const {latestCreatedActivityId: updated, setLatestCreatedActivityId} = useContext(ApplicationContext);
  const [, setLoading] = useState(true);
  const [, setError] = useState(false);
  
  const totalDaysToLoad = 21;
  const preceedingDays = 7;
  const daysToDisplay = Array.apply(null, Array(totalDaysToLoad))
    .map((_, i) => addDays(subDays(initialDate, preceedingDays), i));

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

  useEffect(() => {
    const newActivities = activities.reduce<{[key: string]: Activity[]}>((acc, curr)=>{
      const date = curr.dateTime.toISOString().split("T")[0];
      if (acc[date]) {
        acc[date] = [...acc[date], curr];
      } else {
        acc[date] = [curr];
      }
      return acc;
    }, {});
    setActivityDayMap({ ...activityDayMap, ...newActivities });
  }, [activities, setActivityDayMap]);

  useEffect(() => {
    const newRecurring = daysToDisplay.reduce<{[key: string]: RecurringActivity[]}>((recAcc, curr)=>{
      // I'm sure this could be more efficient, but it's already
      // coming out of a lower loop
      const date = curr.toISOString().split("T")[0];
      recAcc[date] = recurringActivities.filter(ra => {
        const dayDiff = differenceInDays(new Date(date), new Date(ra.dateTimeStart.toISOString().split("T")[0]));
        return dayDiff === 0 || (dayDiff > 0 && dayDiff % ra.recurrEachDays === 0);
      });
      return recAcc;
    }, {});
    setRecurringActivityDayMap({ ...recurringActivityDayMap, ...newRecurring });
  }, [recurringActivities, setRecurringActivityDayMap]);

  useEffect(() => {
    const element = document.getElementById("initial-scrollto-target");
    if (element) {
      element.scrollIntoView({ behavior: "instant" });
    }
  }, [initialDate]);

  const initialDateScrolltoTarget = subDays(initialDate, 1).toISOString().split("T")[0];

  return <Flex flexDirection={"column"}
    maxHeight={"100%"}
    width={"100%"}
    overflow={"scroll"}
  >
    {daysToDisplay.map(x => {
      const date = x.toISOString().split("T")[0];
      return <DaysActivities key={date}
        date={x}
        id={date === initialDateScrolltoTarget ? "initial-scrollto-target" : undefined}
        activities={activityDayMap[date] ?? []}
        recurringActivities={recurringActivityDayMap[date] ?? []}
        onUpdate={setLatestCreatedActivityId}/>;
    })}
  </Flex>;
};
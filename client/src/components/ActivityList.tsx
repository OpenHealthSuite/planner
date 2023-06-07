import { Box, Button, CircularProgress, Flex, Text } from "@chakra-ui/react";
import { addDays, format, subDays, differenceInDays, startOfDay, endOfDay, addHours } from "date-fns";
import { Activity, RecurringActivity } from "../types";
import { useCallback, useContext, useEffect, useState } from "react";
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
    paddingBottom={date.getDay() === 6 ? "1em" : undefined}
    borderBottom={date.getDay() === 6 ? "1px dashed black" : undefined}
    background={date.toISOString().split("T")[0] === new Date().toISOString().split("T")[0] ? TODAY_BACKGROUND : undefined}>
    <Box w={"4.5em"} 
      paddingRight={"0.5em"}
      marginRight={"0.5em"} 
      textAlign={"right"}
      borderRight={"1px solid black"}>
      <Text>{format(date, "eee")}</Text>
      <Text fontSize='xs'>{format(date, "LLL do")}</Text>
    </Box>
    <Box flex='1'>
      {activities.length === 0 && recurringActivities.length === 0 && <Box margin="0.25em 0" padding="0.25em">
        <Text>Rest</Text>
      </Box>}
      {activities.map(x => <SingularActivitySummary key={x.id} 
        activity={x}
        onUpdate={onUpdate}/>)}
      {recurringActivities.filter(x => !completedRecurringActivityIds.includes(x.id)).map(x => <RecurringActivitySummary 
        key={x.id}
        activityDay={date}
        onUpdate={onUpdate}
        activity={x}/>)}</Box>
  </Flex>;
};

const generateDatesArray = (totalDaysToLoad: number, firstDay: Date, preceedingDays: number) => {
  const days = Array.apply(null, Array(totalDaysToLoad))
    .map((_, i) => addDays(subDays(firstDay, preceedingDays), i));
  days[0] = addHours(startOfDay(days[0]), 12);
  days[days.length - 1] = addHours(endOfDay(days[days.length - 1]), -12);
  return days;
};

const SelectPlan = ({ selectedPlanId, setSelectedPlanId}: { selectedPlanId: string | undefined, setSelectedPlanId: (id: string | undefined) => void }) => {
  const { userPlans } = useContext(ApplicationContext);
  const selected = userPlans.findIndex(x => x.id === selectedPlanId) > -1;
  return <Button 
    onClick={() => setSelectedPlanId(selected ? undefined : userPlans[0].id)}
    position={"fixed"}
    bottom={0}
    borderLeft={0}
    padding={"1em"}
    margin={"1em"}
    zIndex={9999}>Filter{selected && <>*</>}</Button>;
};

const PLANLESS_VALUE = "PLANLESS_ID_FILTER";

const planFilter = (activity: Activity | RecurringActivity, selectedPlanId: string | undefined) => selectedPlanId === undefined || selectedPlanId === activity.planId || (selectedPlanId === PLANLESS_VALUE && activity.planId === undefined);

export const ActivityList = ({
  initialDate = new Date() 
} : ActivityListProps) => {

  const [activities, setActivities] = useState<Activity[]>([]);
  const [recurringActivities, setRecurringActivities] = useState<RecurringActivity[]>([]);

  const [activityDayMap, setActivityDayMap] = useState<{[key: string]: Activity[]}>({});
  const [recurringActivityDayMap, setRecurringActivityDayMap] = useState<{[key: string]: RecurringActivity[]}>({});

  const {latestCreatedActivityId: updated, setLatestCreatedActivityId} = useContext(ApplicationContext);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();

  const totalDaysToLoad = 21;
  const preceedingDays = 2;
  
  const [daysToDisplay, setDaysToDisplay] = useState(generateDatesArray(totalDaysToLoad, initialDate, preceedingDays));
  
  const getActivities = useCallback((startDate: Date, endDate: Date) => {
    setLoading(true);
    Promise.all([
      plannerGetRequest<Activity[]>(`/activities?timeStart=${startDate.toISOString()}&timeEnd=${endDate.toISOString()}`),
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
  }, [setActivities, setLoading, setError]);
  
  const scrollCallback = useCallback((event: React.UIEvent<HTMLDivElement, UIEvent>, amLoading: boolean) => {
    const element = event.target as HTMLElement;
    const buffer = 10;
    const shouldLoadBottom = ((element.scrollHeight - element.clientHeight) - element.scrollTop) < buffer;
    if (!amLoading && shouldLoadBottom) {
      const followingDays = generateDatesArray(14, addDays(daysToDisplay[daysToDisplay.length - 1], 1), 0);
      getActivities(followingDays[0], followingDays[followingDays.length - 1]);
      setDaysToDisplay([...daysToDisplay, ...followingDays]);
    }
  }, [daysToDisplay, setDaysToDisplay, getActivities]);

  const preceedingLoad = useCallback(() => {
    const preceedingDays = generateDatesArray(5, daysToDisplay[0], 5);
    getActivities(preceedingDays[0], preceedingDays[preceedingDays.length - 1]);
    setDaysToDisplay([...preceedingDays, ...daysToDisplay]);
  }, [daysToDisplay, setDaysToDisplay, getActivities]);

  useEffect(() => {
    // We do this as when there is an update, we need
    // to clear out the existing map
    setActivityDayMap({});
    getActivities(daysToDisplay[0], daysToDisplay[daysToDisplay.length - 1]);
  }, [updated, getActivities, setActivityDayMap]);

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
  }, [daysToDisplay, recurringActivities, setRecurringActivityDayMap]);

  const initialDateScrolltoTarget = subDays(initialDate, 1).toISOString().split("T")[0];

  return <Flex flexDirection={"column"}
    maxHeight={"100%"}
    width={"100%"}
    overflow={"scroll"}
    onScroll={event => scrollCallback(event, loading)}
  >
    {<SelectPlan {...{selectedPlanId, setSelectedPlanId}}/>}
    {loading && <CircularProgress />}
    {!loading && <Button onClick={preceedingLoad} padding={"1em"} margin={"0.5em"}>Load Previous</Button>}
    {daysToDisplay.map(x => {
      const date = x.toISOString().split("T")[0];
      return <DaysActivities key={date}
        date={x}
        id={date === initialDateScrolltoTarget ? "initial-scrollto-target" : undefined}
        activities={(activityDayMap[date] ?? []).filter(x => planFilter(x, selectedPlanId))}
        recurringActivities={(recurringActivityDayMap[date] ?? []).filter(x => planFilter(x, selectedPlanId))}
        onUpdate={setLatestCreatedActivityId}/>;
    })}
    {loading && <CircularProgress />}
  </Flex>;
};
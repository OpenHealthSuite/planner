import { Box, Flex, IconButton, Modal, ModalCloseButton, ModalContent, ModalOverlay, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useDisclosure } from "@chakra-ui/react";
import { addDays, format, subDays, isAfter, addMinutes, differenceInDays } from "date-fns";
import { ViewIcon, CheckIcon, RepeatIcon } from "@chakra-ui/icons";
import { Activity, ActivityApiSubmission, RecurringActivity } from "../types";
import { useCallback, useEffect, useState } from "react";
import { plannerGetRequest, plannerPostRequest, plannerPutRequest } from "../utilities/apiRequest";
import { ActivityForm, InitialFormValues } from "./ActivityEditor";
import { ActivityDetails } from "./ActivityDetails";

export type ActivityListProps = {
    updated?: string,
    targetDate?: Date
}


const defaultActivitySubmission = (activity: ActivityApiSubmission) => {
  return plannerPutRequest<ActivityApiSubmission, Activity>(`/activities/${activity.id}`, activity)
    .then(() => Math.random().toString());
};
  

const ActivitySummary = ({ activity, onUpdate } : { activity: Activity,
    onUpdate: (str: string) => void }) => {
  const activityDay = new Date(activity.dateTime.toISOString().split("T")[0]);
  const currentDay = addMinutes(new Date(new Date().toISOString().split("T")[0]), 1);
  const isCompletable = isAfter(currentDay, activityDay);

  const [loading, isLoading] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const markComplete = useCallback((activity: Activity) => {
    isLoading(true);
    activity.completed = true;
    plannerPutRequest(`/activities/${activity.id}`, activity)
      .finally(() => isLoading(false));
  }, [isLoading]);

  const editActivity: InitialFormValues = {
    date: activity.dateTime.toISOString().split("T")[0],
    ...structuredClone(activity)
  };

  return <Flex margin="0.25em 0"
    padding="0.25em 0.25em 0.25em 0.5em"
    marginRight="1em"
    border={ activity.completed ? undefined : "1px solid black"}
    backgroundColor="white"
    borderRadius="0.25em"
    alignItems={"center"}>
    <Text>{activity.summary}</Text>
    {!activity.completed && isCompletable && <IconButton size="sm"
      aria-label="Mark Done"
      marginLeft={"auto"}
      marginRight={0}
      onClick={() => markComplete(activity)}
      isDisabled={loading}
      icon={<CheckIcon />} />}
    <IconButton size="sm"
      aria-label="View"
      marginLeft={activity.completed || !isCompletable ? "auto" : "0.5em"} 
      marginRight={0}
      onClick={onOpen}
      icon={<ViewIcon />} />
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <Tabs>
          <TabList>
            <Tab>View</Tab>
            <Tab>Edit</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ActivityDetails activity={activity}/>
            </TabPanel>
            <TabPanel>
              <ActivityForm activitySubmission={defaultActivitySubmission}
                onCreated={onUpdate}
                initialActivity={editActivity}/>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalContent>
    </Modal>
  </Flex>;
};


const RecurringActivitySummary = ({ daysActivities, activity, activityDay, onUpdate } : { daysActivities?: Activity[] ,activity: RecurringActivity, activityDay: Date, onUpdate: (str: string) => void }) => {
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

const TODAY_BACKGROUND = `repeating-linear-gradient(
    135deg,
    #EDEDED,
    #EDEDED 2px,
    #FFFFFF 2px,
    #FFFFFF 14px
  );`;

const DaysActivities = ({ date, activities, recurringActivities, onUpdate }: { 
    date: Date,
    activities?: Activity[],
    recurringActivities: RecurringActivity[],
    onUpdate: (str: string) => void
}) => {
  // TODO: This *will* give us perf grief in the future - we should
  // instead calculate all relevant dates in view
  const relevantRecurringActivities = recurringActivities.filter(ra => {
    const dayDiff = differenceInDays(new Date(date.toISOString().split("T")[0]), new Date(ra.dateTimeStart.toISOString().split("T")[0]));
    return dayDiff === 0 || (dayDiff > 0 && dayDiff % ra.recurrEachDays === 0);
  });
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
      {!activities && !relevantRecurringActivities && <Box margin="0.25em 0" padding="0.25em">
        <Text>Rest</Text>
      </Box>}
      {activities && activities.map(x => <ActivitySummary key={x.id} 
        activity={x}
        onUpdate={onUpdate}/>)}
      {relevantRecurringActivities.filter(x => !completedRecurringActivityIds.includes(x.id)).map(x => <RecurringActivitySummary 
        key={x.id}
        activityDay={date}
        onUpdate={onUpdate}
        activity={x}/>)}</Box>
  </Flex>;
};

export const ActivityList = ({
  updated,
  targetDate = new Date() 
} : ActivityListProps) => {

  const [activities, setActivities] = useState<Activity[]>([]);
  const [recurringActivities, setRecurringActivities] = useState<RecurringActivity[]>([]);
  const [internalUpdate, setInternalUpdate] = useState(updated);
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
  }, [updated, internalUpdate, setActivities, setLoading, setError]);

  const activityDayMap = activities.reduce<{[key: string]: Activity[]}>((acc, curr)=>{
    const date = curr.dateTime.toISOString().split("T")[0];
    if (acc[date]) {
      acc[date] = [...acc[date], curr];
    } else {
      acc[date] = [curr];
    }
    return acc;
  }, {});

  return <div>
    {daysToDisplay.map(x => {
      const date = x.toISOString().split("T")[0];
      return <DaysActivities key={date} 
        date={x} 
        activities={activityDayMap[date]}
        recurringActivities={recurringActivities}
        onUpdate={setInternalUpdate}/>;
    })}
  </div>;
};
import { Box, Flex, IconButton, Modal, ModalContent, ModalOverlay, Text, useDisclosure } from "@chakra-ui/react";
import { addDays, format, subDays, isAfter, addMinutes } from "date-fns";
import { ViewIcon, CheckIcon } from "@chakra-ui/icons";
import { Activity, ActivityApiSubmission } from "../types";
import { useCallback, useEffect, useState } from "react";
import { plannerGetRequest, plannerPutRequest } from "../utilities/apiRequest";
import { ActivityForm, InitialFormValues } from "./ActivityEditor";

export type ActivityListProps = {
    updated: string,
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
        <ActivityForm activitySubmission={defaultActivitySubmission}
          onCreated={onUpdate}
          onClose={onClose}
          initialActivity={editActivity}/>
      </ModalContent>
    </Modal>
  </Flex>;
};

const TODAY_BACKGROUND = `repeating-linear-gradient(
    135deg,
    #EDEDED,
    #EDEDED 2px,
    #FFFFFF 2px,
    #FFFFFF 14px
  );`;

const DaysActivities = ({ date, activities, onUpdate }: { 
    date: Date,
    activities?: Activity[],
    onUpdate: (str: string) => void
}) => {
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
    <Box flex='1'>{!activities ? <Box margin="0.25em 0" padding="0.25em">
      <Text>Rest</Text>
    </Box> : activities.map(x => <ActivitySummary key={x.id} 
      activity={x}
      onUpdate={onUpdate}/>)}</Box>
  </Flex>;
};

export const ActivityList = ({
  updated,
  targetDate = new Date() 
} : ActivityListProps) => {

  const [activities, setActivities] = useState<Activity[]>([]);
  const [internalUpdate, setInternalUpdate] = useState(updated);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const totalDaysToLoad = 21;
  const preceedingDays = 7;
  const daysToDisplay = Array.apply(null, Array(totalDaysToLoad))
    .map((_, i) => addDays(subDays(targetDate, preceedingDays), i));

  useEffect(() => {
    setLoading(true);
    plannerGetRequest<Activity[]>("/activities")
      .then(acts => acts.map(a => {
        a.dateTime = new Date(a.dateTime);
        return a;
      }))
      .then(acts => {
        setError(false);
        setActivities(acts);
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
        onUpdate={setInternalUpdate}/>;
    })}
  </div>;
};
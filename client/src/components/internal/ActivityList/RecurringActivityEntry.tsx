import { Button, Flex, IconButton,Modal,ModalCloseButton,ModalContent,ModalOverlay,Tab,TabList,TabPanel,TabPanels,Tabs,Text, useDisclosure } from "@chakra-ui/react";
import { addDays, isAfter } from "date-fns";
import { CheckIcon, RepeatIcon, ViewIcon } from "@chakra-ui/icons";
import { Activity, ActivityApiSubmission, RecurringActivity, RecurringActivityApiSubmission } from "../../../types";
import { useCallback, useState } from "react";
import { plannerPostRequest, plannerPutRequest } from "../../../utilities/apiRequest";
import { ActivityDetails } from "../../ActivityDetails";
import { RecurringActivityForm } from "../../RecurringActivityEditor";

const editRecurringActivitySubmission = (activity: RecurringActivityApiSubmission) => {
  return plannerPutRequest<RecurringActivityApiSubmission, string>(`/recurring_activities/${activity.id}`, activity);
};

export const RecurringActivitySummary = ({ daysActivities, activity, activityDay, onUpdate } : { daysActivities?: Activity[] ,activity: RecurringActivity, activityDay: Date, onUpdate: (str: string) => void }) => {
  const [loading, isLoading] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const createAssociatedActivity = useCallback((recurringActivity: RecurringActivity, completed: boolean) => {
    isLoading(true);
    const {summary, stages, timeRelevant} = recurringActivity;
    const activity: ActivityApiSubmission = {
      summary,
      stages,
      timeRelevant,
      recurringActivityId: recurringActivity.id,
      dateTime: activityDay.toISOString(),
      completed,
      notes: "From Recurring Activity"
    };
    return plannerPostRequest<ActivityApiSubmission, string>("/activities", activity)
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
      onClick={() => createAssociatedActivity(activity, true)}
      isDisabled={loading}
      icon={<CheckIcon />} />}
    <IconButton size="sm"
      aria-label="View"
      marginLeft={!isCompletable ? "auto" : "0.5em"} 
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
            <Tab>Edit Recurring</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ActivityDetails activity={activity}/>
              <Button onClick={() => createAssociatedActivity(activity, false).then(onClose)}>Create Related Activity</Button>
            </TabPanel>
            <TabPanel>
              <RecurringActivityForm activitySubmission={editRecurringActivitySubmission}
                onCreated={onUpdate}
                onClose={() => { return; }}
                initialRecurringActivity={{...activity, date: activity.dateTimeStart.toISOString().split("T")[0]}}/>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalContent>
    </Modal>
  </Flex>;
};
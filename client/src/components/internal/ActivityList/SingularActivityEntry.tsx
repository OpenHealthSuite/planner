import { Flex, IconButton, Modal, ModalCloseButton, ModalContent, ModalOverlay, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useDisclosure } from "@chakra-ui/react";
import { isAfter, addMinutes } from "date-fns";
import { ViewIcon, CheckIcon } from "@chakra-ui/icons";
import { Activity, ActivityApiSubmission } from "../../../types";
import { useCallback, useState } from "react";
import { plannerDeleteRequest, plannerPutRequest } from "../../../utilities/apiRequest";
import { ActivityForm, InitialFormValues } from "../../ActivityEditor";
import { ActivityDetails } from "../../ActivityDetails";

const defaultActivitySubmission = (activity: ActivityApiSubmission) => {
  return plannerPutRequest<ActivityApiSubmission, Activity>(`/activities/${activity.id}`, activity)
    .then(() => Math.random().toString());
};

const defaultActivityDelete = async (activityId: string) => {
  await plannerDeleteRequest(`/activities/${activityId}`);
};

export const SingularActivitySummary = ({ activity, onUpdate } : { activity: Activity,
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
    alignItems={"center"}
    data-testid="singular-activity">
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
            <Tab data-testid="activity-view-tab">View</Tab>
            <Tab data-testid="activity-edit-tab">Edit</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ActivityDetails activity={activity}/>
            </TabPanel>
            <TabPanel>
              <ActivityForm activitySubmission={defaultActivitySubmission}
                onUpdate={onUpdate}
                onDelete={defaultActivityDelete}
                onClose={onClose}
                initialActivity={editActivity}/>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalContent>
    </Modal>
  </Flex>;
};

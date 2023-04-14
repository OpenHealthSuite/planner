// This should be replaced with the calendar ideal later

import { useEffect, useState } from "react";
import { plannerGetRequest, plannerPutRequest } from "../utilities/apiRequest";
import { Activity } from "../types";
import { Button, ListItem, Modal, ModalContent, ModalOverlay, UnorderedList, useDisclosure } from "@chakra-ui/react";
import { ActivityForm, InitialFormValues } from "../components/AddActivityInterface";


const editActivitySubmission = (activity: Activity) => {
  return plannerPutRequest<Activity, string>(`/activities/${activity.id}`, activity);
};

export const ActivityList = ({ updated }: { updated?: string }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [internalRefresh, setInternalRefresh] = useState("");

  const [editActivity, setEditActivity] = useState<InitialFormValues | undefined>(undefined);

  useEffect(() => {
    setLoading(true);
    plannerGetRequest<Activity[]>("/activities")
      .then(acts => {
        setError(false);
        setActivities(acts);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [updated, internalRefresh, setActivities, setLoading, setError]);

  const { isOpen, onOpen, onClose } = useDisclosure();

  if (loading) {
    return <div>Loading</div>;
  }

  if (error) {
    return <div>Error!</div>;
  }

  return <UnorderedList>
    {activities.map(x => <ListItem key={x.id}>{x.name} <Button onClick={() => {
      setEditActivity({...x, dateTime: new Date(x.dateTime).toISOString().split("T")[0]});
      onOpen();
    }}>Edit</Button></ListItem>)}
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        {!!editActivity && <ActivityForm activitySubmission={editActivitySubmission}
          onCreated={setInternalRefresh}
          onClose={onClose}
          initialActivity={editActivity}/>}
      </ModalContent>
    </Modal>
  </UnorderedList>;
};
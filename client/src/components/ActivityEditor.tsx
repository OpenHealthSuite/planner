import { Button, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, Select, Checkbox } from "@chakra-ui/react";
import { Activity, ActivityApiSubmission } from "../types";
import { plannerPostRequest } from "../utilities/apiRequest";
import { Formik } from "formik";
import * as Yup from "yup";

const defaultActivitySubmission = (activity: ActivityApiSubmission) => {
  return plannerPostRequest<ActivityApiSubmission, string>("/activities", activity);
};

type AddActivityInterfaceProps = { 
  activitySubmission?: typeof defaultActivitySubmission
  onCreated?: (newId: string) => void
}

export type InitialFormValues = Partial<Activity> &
  Omit<Activity, "id" | "userId" | "dateTime"> &
  { date: string; }

type ActivityFormProps = { 
  activitySubmission: typeof defaultActivitySubmission
  onCreated: (newId: string) => void
  onClose: () => void
  initialActivity: InitialFormValues
} 

const ActivitySchema =  Yup.object().shape({
  summary: Yup.string()
    .min(1, "Needs at least one character")
    .required("Required"),
  date: Yup.date().required("Required")
});

export const ActivityForm = ({
  activitySubmission,
  onCreated,
  onClose,
  initialActivity
}: ActivityFormProps) => {
  return <Formik
    initialValues={initialActivity}
    validationSchema={ActivitySchema}
    onSubmit={async (values) => {
      const { date, ...submission } = values;
      (submission as unknown as ActivityApiSubmission).dateTime = new Date(Date.parse(values.date)).toISOString()
      try {
        const id = await activitySubmission(submission as unknown as ActivityApiSubmission);
        onClose();
        onCreated(id);
      } catch {
        console.error("Bad Request");
      }
    }}
  >
    {({
      values,
      isValid,
      dirty,
      handleChange,
      handleSubmit,
    }) => (
      <form onSubmit={handleSubmit}>
        <ModalHeader>Adding Activity</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex flexDirection={"column"} gap={"1em"}>
            <FormControl>
              <FormLabel htmlFor="summary">Summary</FormLabel>
              <Input 
                id="summary"
                name="summary"
                type='text' onChange={handleChange} value={values.summary}/>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="date">Date</FormLabel>
              <Input 
                id="date"
                name="date" type='date' onChange={handleChange} value={values.date} />
            </FormControl>
            <FormControl>
              <Checkbox 
                id="completed"
                name="completed" onChange={handleChange} isChecked={values.completed}>Complete</Checkbox>
            </FormControl>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Flex w={"100%"} justifyContent={"space-between"}>
            <Button onClick={onClose} variant='ghost' type="button">Cancel</Button>
            <Button type="submit" isDisabled={!dirty || !isValid}>
             Save
            </Button>
          </Flex>
        </ModalFooter>
      </form>
    )}
  </Formik>;
};

export const AddActivityInterface = ({ 
  activitySubmission = defaultActivitySubmission,
  onCreated = () => { return; }
}: AddActivityInterfaceProps) => {

  const { isOpen, onOpen, onClose } = useDisclosure();

  return <Flex flexDirection={"column"} 
    padding={"1em"}
    position={"fixed"}
    width={"100%"}
    bottom={0}>
    <Button onClick={onOpen}>Add Activity</Button>
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ActivityForm activitySubmission={activitySubmission}
          onCreated={onCreated}
          onClose={onClose}
          initialActivity={{
            summary: "",
            stages: [],
            date: "",
            timeRelevant: false,
            completed: false,
            notes: ""
          }}/>
      </ModalContent>
    </Modal>
  </Flex>;
};
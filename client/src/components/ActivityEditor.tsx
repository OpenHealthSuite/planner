import { Button, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, Select, Checkbox } from "@chakra-ui/react";
import { Activity, ActivityType, activityTypes } from "../types";
import { plannerPostRequest } from "../utilities/apiRequest";
import { Formik } from "formik";
import * as Yup from "yup";

const defaultActivitySubmission = (activity: Activity) => {
  return plannerPostRequest<Activity, string>("/activities", activity);
};

type AddActivityInterfaceProps = { 
  activitySubmission?: typeof defaultActivitySubmission
  onCreated?: (newId: string) => void
}

export type InitialFormValues = Partial<Omit<Activity, "type" | "dateTime">> &
  Omit<Activity, "id" | "userId" | "type" | "dateTime"> &
  { dateTime: string; type: "" | ActivityType }

type ActivityFormProps = { 
  activitySubmission: typeof defaultActivitySubmission
  onCreated: (newId: string) => void
  onClose: () => void
  initialActivity: InitialFormValues
} 

const ActivitySchema =  Yup.object().shape({
  name: Yup.string()
    .min(1, "Needs at least one character")
    .required("Required"),
  type: Yup.string().required("Required"),
  dateTime: Yup.date().required("Required")
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
      values.dateTime = new Date(Date.parse(values.dateTime)).toISOString();
      try {
        const id = await activitySubmission(values as unknown as Activity);
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
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input 
                id="name"
                name="name"
                type='text' onChange={handleChange} value={values.name}/>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="type">Type</FormLabel>
              <Select 
                id="type"
                name="type" placeholder='Select Type' onChange={handleChange} value={values.type}>
                {activityTypes.map(a => <option key={a}>{a}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="dateTime">Date</FormLabel>
              <Input 
                id="dateTime"
                name="dateTime" type='date' onChange={handleChange} value={values.dateTime} />
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
            name: "",
            type: "",
            attributes: {},
            dateTime: "",
            timeRelevant: false,
            completed: false
          }}/>
      </ModalContent>
    </Modal>
  </Flex>;
};
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Button, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, FormControl, FormLabel, Input, Checkbox, Divider } from "@chakra-ui/react";
import { Activity, ActivityApiSubmission } from "../types";
import { plannerPostRequest } from "../utilities/apiRequest";
import { Formik } from "formik";
import * as Yup from "yup";
import { ActivityStageEditor } from "./internal/ActivityStageEditor";

const defaultActivitySubmission = (activity: ActivityApiSubmission) => {
  return plannerPostRequest<ActivityApiSubmission, string>("/activities", activity);
};

type AddActivityInterfaceProps = { 
  activitySubmission?: typeof defaultActivitySubmission
  onUpdate?: (newId: string) => void
}

export type InitialFormValues = Partial<Activity> &
  Omit<Activity, "id" | "userId" | "dateTime"> &
  { date: string; }

type ActivityFormProps = { 
  activitySubmission: typeof defaultActivitySubmission
  onUpdate: (newId: string) => void
  onDelete?: (deleteId: string) => Promise<void>
  onClose?: () => void
  initialActivity: InitialFormValues
} 

const ActivitySchema =  Yup.object().shape({
  summary: Yup.string()
    .min(1, "Needs at least one character")
    .required("Required"),
  date: Yup.date().required("Required"),
  stages: Yup.array().of(
    Yup.object().shape({
      order: Yup.number(),
      description: Yup.string()
        .min(1, "Needs at least one character")
        .required("Required"),
      repetitions: Yup.number().min(1).required(),
      metrics: Yup.array().of(Yup.object().shape({
        amount: Yup.number().min(0).required(),
        unit: Yup.string()
          .min(1, "Needs at least one character")
          .required("Required"),
      }))
    })
  )
});

export const ActivityForm = ({
  activitySubmission,
  onUpdate,
  onDelete,
  onClose,
  initialActivity
}: ActivityFormProps) => {
  return <Formik
    initialValues={initialActivity}
    validationSchema={ActivitySchema}
    onSubmit={async (values) => {
      const { date, ...submission } = values;
      (submission as unknown as ActivityApiSubmission).dateTime = new Date(Date.parse(date)).toISOString();
      try {
        const id = await activitySubmission(submission as unknown as ActivityApiSubmission);
        onClose ? onClose() : () => { return; };
        onUpdate(id);
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
      validateForm
    }) => (
      <form onSubmit={handleSubmit}>
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
          <ActivityStageEditor values={values} handleChange={handleChange} validateForm={validateForm}/>
        </Flex>
        <Divider margin={"1em 0"} />
        <Flex w={"100%"} justifyContent={"space-between"}>
          {onClose && onDelete && initialActivity.id && <Button onClick={() => onDelete(initialActivity.id!).then(() => onUpdate(Math.random().toString())).then(onClose)} variant='outline' type="button">Delete</Button>}
          {onClose && <Button onClick={onClose} variant='ghost' type="button">Cancel</Button>}
          <Button type="submit" isDisabled={!dirty || !isValid}>
             Save
          </Button>
        </Flex>
      </form>
    )}
  </Formik>;
};

export const AddActivityInterface = ({ 
  activitySubmission = defaultActivitySubmission,
  onUpdate = () => { return; }
}: AddActivityInterfaceProps) => {

  const { isOpen, onOpen, onClose } = useDisclosure();

  return <Flex flexDirection={"column"} 
    padding={"1em"}
    width={"100%"}>
    <Button onClick={onOpen}>Add Activity</Button>
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Adding Activity</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <ActivityForm activitySubmission={activitySubmission}
            onUpdate={onUpdate}
            onClose={onClose}
            initialActivity={{
              summary: "",
              stages: [],
              date: "",
              timeRelevant: false,
              completed: false,
              notes: ""
            }}/>
        </ModalBody>
      </ModalContent>
    </Modal>
  </Flex>;
};
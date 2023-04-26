import { Button, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, FormControl, FormLabel, Input, Divider } from "@chakra-ui/react";
import { RecurringActivity, RecurringActivityApiSubmission } from "../types";
import { plannerPostRequest } from "../utilities/apiRequest";
import { Formik } from "formik";
import * as Yup from "yup";
import { ActivityStageEditor } from "./internal/ActivityStageEditor";

const defaultRecurringActivitySubmission = (activity: RecurringActivityApiSubmission) => {
  return plannerPostRequest<RecurringActivityApiSubmission, string>("/recurring_activities", activity);
};

type AddRecurringActivityInterfaceProps = { 
  activitySubmission?: typeof defaultRecurringActivitySubmission
  onCreated?: (newId: string) => void
}

export type InitialFormValues = Partial<RecurringActivity> &
  Omit<RecurringActivity, "id" | "userId" | "dateTimeStart"> &
  { date: string; }

type RecurringActivityFormProps = { 
  activitySubmission: typeof defaultRecurringActivitySubmission
  onCreated: (newId: string) => void
  onClose: () => void
  initialRecurringActivity: InitialFormValues
} 

const RecurringActivitySchema =  Yup.object().shape({
  summary: Yup.string()
    .min(1, "Needs at least one character")
    .required("Required"),
  date: Yup.date().required("Required"),
  recurrEachDays: Yup.number().min(1, "Needs to be at least one").required("Required"),
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

export const RecurringActivityForm = ({
  activitySubmission,
  onCreated,
  onClose,
  initialRecurringActivity
}: RecurringActivityFormProps) => {
  return <Formik
    initialValues={initialRecurringActivity}
    validationSchema={RecurringActivitySchema}
    onSubmit={async (values) => {
      const { date, ...submission } = values;
      (submission as unknown as RecurringActivityApiSubmission).dateTimeStart = new Date(Date.parse(date)).toISOString();
      try {
        const id = await activitySubmission(submission as unknown as RecurringActivityApiSubmission);
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
            <FormLabel htmlFor={"recurrEachDays"}>Recurr Every n Days</FormLabel>
            <Input 
              id={"recurrEachDays"}
              name={"recurrEachDays"}
              type='number' onChange={handleChange} value={values.recurrEachDays}/>
          </FormControl>
          <ActivityStageEditor values={values} handleChange={handleChange} validateForm={validateForm}/>
        </Flex>
        <Divider margin={"1em 0"} />
        <Flex w={"100%"} justifyContent={"space-between"}>
          <Button onClick={onClose} variant='ghost' type="button">Cancel</Button>
          <Button type="submit" isDisabled={!dirty || !isValid}>
             Save
          </Button>
        </Flex>
      </form>
    )}
  </Formik>;
};

export const AddRecurringActivityInterface = ({ 
  activitySubmission = defaultRecurringActivitySubmission,
  onCreated = () => { return; }
}: AddRecurringActivityInterfaceProps) => {

  const { isOpen, onOpen, onClose } = useDisclosure();

  return <Flex flexDirection={"column"} 
    padding={"1em"}
    width={"100%"}>
    <Button onClick={onOpen}>Add Recurring Activity</Button>
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Adding Recurring Activity</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <RecurringActivityForm activitySubmission={activitySubmission}
            onCreated={onCreated}
            onClose={onClose}
            initialRecurringActivity={{
              summary: "",
              stages: [],
              date: "",
              timeRelevant: false,
              recurrEachDays: 1
            }}/>
        </ModalBody>
      </ModalContent>
    </Modal>
  </Flex>;
};
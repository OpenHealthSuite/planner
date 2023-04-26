import { Button, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, Accordion, AccordionItem, AccordionPanel, AccordionButton, Box, AccordionIcon } from "@chakra-ui/react";
import { RecurringActivity, RecurringActivityApiSubmission } from "../types";
import { plannerPostRequest } from "../utilities/apiRequest";
import { Formik } from "formik";
import * as Yup from "yup";

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
      (submission as unknown as RecurringActivityApiSubmission).dateTime = new Date(Date.parse(date)).toISOString();
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
        <ModalHeader>Adding Recurring Activity</ModalHeader>
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
              <FormLabel htmlFor={"recurrEachDays"}>Recurr Every n Days</FormLabel>
              <Input 
                id={"recurrEachDays"}
                name={"recurrEachDays"}
                type='number' onChange={handleChange} value={values.recurrEachDays}/>
            </FormControl>
            {values.stages.length > 0 && <Accordion allowToggle>
              {values.stages.map((stage, i) => {
                return <AccordionItem key={stage.order}>
                  
                  <h2>
                    <AccordionButton>
                      <Box as="span" flex='1' textAlign='left'>
                        {stage.repetitions > 1 ? stage.repetitions + " x " : ""}{stage.description}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <FormControl>
                      <FormLabel htmlFor={`stages[${i}].description`}>Description</FormLabel>
                      <Input 
                        id={`stages[${i}].description`}
                        name={`stages[${i}].description`}
                        type='text' onChange={handleChange} value={stage.description}/>
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor={`stages[${i}].repetitions`}>Repetitions</FormLabel>
                      <Input 
                        id={`stages[${i}].repetitions`}
                        name={`stages[${i}].repetitions`}
                        type='number' onChange={handleChange} value={stage.repetitions}/>
                    </FormControl>
                    <Flex flexDirection={"column"}>
                      {stage.metrics.map((metric, ii) => {
                        return <Box key={ii}>
                          <FormControl>
                            <FormLabel htmlFor={`stages[${i}].metrics[${ii}].amount`}>Amount</FormLabel>
                            <Input 
                              id={`stages[${i}].metrics[${ii}].amount`}
                              name={`stages[${i}].metrics[${ii}].amount`}
                              type='number' onChange={handleChange} value={metric.amount}/>
                          </FormControl>
                          <FormControl>
                            <FormLabel htmlFor={`stages[${i}].metrics[${ii}].unit`}>Unit</FormLabel>
                            <Input 
                              id={`stages[${i}].metrics[${ii}].unit`}
                              name={`stages[${i}].metrics[${ii}].unit`}
                              type='text' onChange={handleChange} value={metric.unit}/>
                          </FormControl>
                          <Button width={"100%"} 
                            mt={"1em"}
                            onClick={() => {
                              values.stages[i].metrics.splice(ii, 1);
                              validateForm();
                            }}>Delete Metric</Button>
                        </Box>;
                      })}
                    </Flex>
                    <Button width={"100%"} mt={"1em"}
                      onClick={() => {
                        values.stages[i].metrics.push({
                          amount: 1,
                          unit: "min(s)"
                        });
                        validateForm();
                      }}
                    >Add Metric</Button>
                    <Button width={"100%"} 
                      mt={"1em"}
                      onClick={() => {
                        values.stages.splice(i, 1);
                        values.stages = values.stages.map((s, i)=> {
                          s.order = i;
                          return s;
                        });
                        validateForm();
                      }}>Delete Stage</Button>
                  </AccordionPanel>
                </AccordionItem>;
              })}
            </Accordion>}
            <Button onClick={() => {
              values.stages.push({
                order: values.stages.length,
                repetitions: 1,
                metrics: [],
                description: `Stage ${values.stages.length + 1}`
              });
              validateForm();
            }}>Add Stage</Button>
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
      </ModalContent>
    </Modal>
  </Flex>;
};
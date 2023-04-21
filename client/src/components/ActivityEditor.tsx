import { Button, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, Checkbox, Accordion, AccordionItem, AccordionPanel, AccordionButton, Box, AccordionIcon } from "@chakra-ui/react";
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
  onCreated,
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
            {values.stages.length > 0 && <Accordion>
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
                          amount: 0,
                          unit: ""
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
                order: values.stages.length - 1,
                repetitions: 1,
                metrics: [],
                description: ""
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
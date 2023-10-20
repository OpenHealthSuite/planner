import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Checkbox, Flex, FormControl, FormLabel, Input } from "@chakra-ui/react";
import { ActivityStage } from "../../types";

type ActivityStageEditorProps = {
  values: {
    stages: ActivityStage[]
  },
  showCompleted?: boolean,
  handleChange?: React.ChangeEventHandler<HTMLInputElement> | undefined,
  validateForm: () => void
}

export const ActivityStageEditor = ({ values, showCompleted = false, handleChange, validateForm } : ActivityStageEditorProps) => {
  return <>{values.stages.length > 0 && <Accordion allowToggle>
    {values.stages.map((stage, i) => {
      return <AccordionItem key={stage.order}>

        <h2>
          <AccordionButton>
            <Box as="span" display='flex' flex='1' textAlign='left' gap='1em'>
              {stage.repetitions > 1 && <div>{stage.repetitions + " x "}</div>}

              <FormControl>
                <Input
                  aria-label="Description"
                  id={`stages[${i}].description`}
                  name={`stages[${i}].description`}
                  type='text' onChange={handleChange} value={stage.description}
                  onClick={(e) => e.stopPropagation()}
                />
              </FormControl>
            </Box>
            <AccordionIcon style={{ marginLeft: "1em" }} aria-label={"stage-" + i + "-toggle"} />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
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

          {showCompleted && <FormControl>
            <Checkbox
              id={`stages[${i}].completed`}
              name={`stages[${i}].completed`} onChange={handleChange} isChecked={stage.completed}>Complete</Checkbox>
          </FormControl>}
          <Button width={"100%"}
            mt={"1em"}
            onClick={() => {
              values.stages.splice(i, 1);
              values.stages = values.stages.map((s, i) => {
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
      description: `Stage ${values.stages.length + 1}`,
      completed: false
    });
    validateForm();
  }}>Add Stage</Button>
  </>;
};

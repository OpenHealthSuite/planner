import { useState, useCallback } from "react";
import { Box, ListItem, OrderedList, Heading, UnorderedList, Divider, IconButton, Text } from "@chakra-ui/react";
import { format } from "date-fns";
import { Activity, ActivityApiSubmission, RecurringActivity } from "../types";
import { CheckIcon } from "@chakra-ui/icons";
import { plannerPutRequest } from "../utilities/apiRequest";

export const ActivityDetails = ({ activity }: { activity: Activity | RecurringActivity }) => {
  const [, setState] = useState("");
  const isRecurring = "recurrEachDays" in activity;
  const markStageComplete = useCallback((act: Activity, index: number) => {
    act.stages[index].completed = true;
    const activ = {
      ...act,
      dateTime: act.dateTime.toISOString()
    };
    return plannerPutRequest<ActivityApiSubmission, Activity>(`/activities/${act.id}`, activ)
      .then(() => {
        setState(Math.random().toString());
      });
  }, [setState]);
  return <Box>
    <Heading as='h2' size='md'>{activity.summary}</Heading>
    {!isRecurring && <Heading as='h3' size='sm'>{format(activity.dateTime, "eeee do MMMM")}</Heading>}
    <Divider margin={"1em 0"} />
    <OrderedList display='flex' gap="0.5em" flexDirection={"column"}>
      {activity.stages && activity.stages.map((stg, i) => {
        return <ListItem key={stg.order}>
          <Heading as='h4' size='xs'>
            {!stg.completed && !isRecurring && <IconButton
              icon={<CheckIcon />}
              onClick={() => markStageComplete(activity, i)}
              aria-label="Mark Done"
              size={"xs"}
              marginRight={"0.5em"}></IconButton>}
            <Text as={stg.completed ? "s" : "b"}>{stg.repetitions > 1 ? `${stg.repetitions}x ` : ""}{stg.description}</Text>
          </Heading>
          {stg.metrics && <UnorderedList>
            {stg.metrics.map((mtr, i) => <ListItem key={"mtr-" + i}>{mtr.amount} {mtr.unit}</ListItem>)}
          </UnorderedList>}
        </ListItem>;
      })}
    </OrderedList>
  </Box>;
};

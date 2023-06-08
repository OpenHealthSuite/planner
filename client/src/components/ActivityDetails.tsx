import { Box, ListItem, OrderedList, Heading, UnorderedList, Divider } from "@chakra-ui/react";
import { format } from "date-fns";
import { Activity, RecurringActivity } from "../types";

export const ActivityDetails = ({ activity }: { activity: Activity | RecurringActivity }) => {
  const isRecurring = "recurrEachDays" in activity;
  return <Box>
    <Heading as='h2' size='md'>{activity.summary}</Heading>
    {!isRecurring && <Heading as='h3' size='sm'>{format(activity.dateTime, "eeee do MMMM")}</Heading>}
    <Divider margin={"1em 0"} />
    <OrderedList>
      {activity.stages && activity.stages.map(stg => {
        return <ListItem key={stg.order}>
          <Heading as='h4' size='xs'>{stg.repetitions > 1 ? `${stg.repetitions}x ` : ""}{stg.description}</Heading>
          {stg.metrics && <UnorderedList>
            {stg.metrics.map((mtr, i) => <ListItem key={"mtr-" + i}>{mtr.amount} {mtr.unit}</ListItem>)}
          </UnorderedList>}
        </ListItem>;
      })}
    </OrderedList>
  </Box>;
};

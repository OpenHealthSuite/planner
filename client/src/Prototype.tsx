import { Box, Button, Flex, Grid, GridItem, Center, ButtonGroup, Spacer } from "@chakra-ui/react";
import { useState } from "react";
import { AddActivityInterface } from "./components/AddActivityInterface";

type TimeSpan = "Week" | "Month"

const WeekView = () => {
  // mythical month time
  const daysInWeek = 7;
  const weekStartDate = 5;
  const weekDates: number[] = [];
  for (let i = weekStartDate; i < daysInWeek + weekStartDate; i++) {
    weekDates.push(i);
  }
  return <Flex flexDirection={"column"}>
    {weekDates.map((date, i) => <Box key={i}
      w='100%'
      h='10' 
      bg={date && i % 2 ? "#DDDDDD":"#FFFFFF" }
      padding={"0.5em"}>
      {date ? date : ""}
    </Box>)}
  </Flex>;
};

const MonthView = () => {
  // mythical month time
  const daysInMonth = 30;
  const daysOffset = 3;
  const weekDates: number[] = [];
  for (let i = 1; i <= daysOffset; i++) {
    weekDates.push(0);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    weekDates.push(i);
  }
  return <Grid
    templateColumns='repeat(7, 1fr)'>
    {weekDates.map((date, i) => <GridItem key={i}
      w='100%'
      h='10' 
      bg={date && i % 2 ? "#DDDDDD":"#FFFFFF" }
      padding={"0.5em"}>
      {date ? date : ""}
    </GridItem>)}
  </Grid>;
};


const Prototype = () => {
  const [timespan, setTimespan] = useState<TimeSpan>("Month");
  // Force users to "week" on mobile
  return <>
    <Flex flexDirection={"column"} padding={"1em"}>
      <Flex paddingBottom={"0.5em"}>
        <ButtonGroup size='sm'>
          <Button>&lt;</Button>
          <Center>{timespan === "Month" ? "Apr 2023" : "Week Two, Apr 2023"}</Center>
          <Button>&gt;</Button>
        </ButtonGroup>
        <Spacer />
        <ButtonGroup size='sm' isAttached>
          <Button 
            variant={timespan === "Week" ? undefined : "ghost"}
            onClick={() => setTimespan("Week")}>Week</Button>
          <Button 
            variant={timespan === "Month" ? undefined : "ghost"}
            onClick={() => setTimespan("Month")}>Month</Button>
        </ButtonGroup>
      </Flex>
      <Box>
        {timespan === "Week" && <WeekView />}
        {timespan === "Month" && <MonthView />}
      </Box>
    </Flex>
    <AddActivityInterface />
  </>;
};

export default Prototype;
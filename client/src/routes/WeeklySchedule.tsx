import { Flex } from "@chakra-ui/react";
import { ActivityList } from "../components/ActivityList";

export default function WeeklySchedule() {
  return <Flex height={"100vh"}
    width={"100vw"}
  >

    <ActivityList/>
  </Flex>;
}
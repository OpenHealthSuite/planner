import { useState } from "react";
import { AddActivityInterface } from "../components/ActivityEditor";
import { ActivityList } from "../components/ActivityList";

export default function WeeklySchedule() {
  const [newActivityId, setNewActivityId] = useState("");
  return <>
    <ActivityList updated={newActivityId}/>
    <AddActivityInterface onCreated={setNewActivityId}/>
  </>;
}
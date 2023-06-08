import { Button, IconButton, List, ListIcon, ListItem, Input } from "@chakra-ui/react";
import { TimeIcon, PlusSquareIcon, DeleteIcon } from "@chakra-ui/icons";
import { useCallback, useContext, useEffect, useState } from "react";
import { Plan } from "../types";
import { plannerDeleteRequest, plannerGetRequest, plannerPostRequest } from "../utilities/apiRequest";
import { ApplicationContext } from "../App";

export const PlanManager = () => {
  const { userPlans, setUserPlans } = useContext(ApplicationContext);
  const [loading, setLoading] = useState(true);
  const [newPlanId, setNewPlanId] = useState("");

  const [value, setValue] = useState("");
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value), [setValue]);

  const createPlan = useCallback((planName: string) => {
    setLoading(true);
    plannerPostRequest<{name: string, active: boolean}, string>("/plans", {
      name: planName,
      active: true
    }).then(setNewPlanId)
      .finally(() => setValue(""));
  }, [setLoading, setValue]);

  const deletePlan = useCallback((planId: string) => {
    setLoading(true);
    plannerDeleteRequest(`/plans/${planId}`)
      .finally(() => setNewPlanId(Math.random().toString()));
  }, [setLoading]);

  useEffect(() => {
    setLoading(true);
    plannerGetRequest<Plan[]>("/plans")
      .then(plans => {
        setUserPlans(plans);
      })
      .finally(() => setLoading(false));
  }, [setUserPlans, setLoading, newPlanId, setNewPlanId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <List spacing={3}>
    {userPlans.map(plan => <ListItem key={plan.id}>
      <ListIcon as={TimeIcon} color='green.500' />
      {plan.name}
      <IconButton aria-label="Delete" icon={<DeleteIcon />} onClick={() => deletePlan(plan.id)}/>
    </ListItem>)}

    <ListItem>
      <ListIcon as={PlusSquareIcon} color='green.500' />
      <Input placeholder="Add new plan" value={value} onChange={handleChange}/>
      <Button isDisabled={!value} onClick={() => createPlan(value)}>Add Plan</Button>
    </ListItem>
  </List>;
};

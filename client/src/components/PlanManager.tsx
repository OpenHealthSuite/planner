import { Button, List, ListIcon, ListItem, Input, Flex } from "@chakra-ui/react";
import { TimeIcon, PlusSquareIcon } from "@chakra-ui/icons";
import { useCallback, useContext, useEffect, useState } from "react";
import { Plan } from "../types";
import { plannerDeleteRequest, plannerGetRequest, plannerPostRequest, plannerPutRequest } from "../utilities/apiRequest";
import { ApplicationContext } from "../App";
import { PlanEditor } from "./PlanEditor";

function PlanListItem ({ plan, editPlan, deletePlan }: {plan: Plan, editPlan: (plan: Plan) => void, deletePlan: (planId: string) => void}): JSX.Element {
  return <ListItem display={"flex"} alignItems={"center"} gap={"0.5em"}>
    <ListIcon as={TimeIcon} color='green.500' />
    {plan.name}
    <PlanEditor
      styleProps={{
        marginRight: 0,
        marginLeft: "auto"
      }}
      plan={plan}
      editPlan={editPlan}
      deletePlan={deletePlan}
    />
  </ListItem>;
}

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
  }, [setLoading, setNewPlanId]);

  const editPlan = useCallback((plan: Plan) => {
    setLoading(true);
    plannerPutRequest(`/plans/${plan.id}`, plan)
      .finally(() => setNewPlanId(Math.random().toString()));
  }, [setLoading, setNewPlanId]);

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

  return <Flex padding={"1em"}>
    <List spacing={3}>
      {userPlans.map(plan => <PlanListItem key={plan.id} plan={plan} editPlan={editPlan} deletePlan={deletePlan}/>)}

      <ListItem display={"flex"} alignItems={"center"} gap={"0.5em"}>
        <ListIcon as={PlusSquareIcon} color='green.500' />
        <Input placeholder="Add new plan" value={value} onChange={handleChange}/>
        <Button aria-label="Delete"
          marginRight={0}
          marginLeft={"auto"}
          isDisabled={!value} onClick={() => createPlan(value)}>
            Add Plan
        </Button>
      </ListItem>
    </List>
  </Flex>;
};

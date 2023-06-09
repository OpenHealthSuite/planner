import { IconButton } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { Plan } from "../types";

type PlanEditorProps = {
  plan: Plan,
  editPlan: (plan: Plan) => void,
  deletePlan: (planId: string) => void,
  styleProps: { [key: string]: string | number }
};

export const PlanEditor = ({ plan, editPlan, deletePlan, styleProps }: PlanEditorProps) => {
  return <IconButton aria-label="Edit"
    {...styleProps}
    icon={<EditIcon />}
    onClick={() => deletePlan(plan.id)}
  />;
};

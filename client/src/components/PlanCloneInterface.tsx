/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Button, ModalBody, FormControl, FormLabel, Input, Checkbox, ModalFooter } from "@chakra-ui/react";
import { Plan } from "../types";
import { plannerPostRequest } from "../utilities/apiRequest";
import { Formik } from "formik";
import * as Yup from "yup";
type ClonePlanArguments = {
  id: string,
  date: string,
  shiftOnStart: boolean
}

const defaultClonePlan = async (args: ClonePlanArguments) => {
  const body: {[key:string]: any} = {
    id: args.id
  };

  if (args.shiftOnStart) {
    body.newStartDateTime = args.date + "T12:00:00Z";
  } else {
    body.newEndDateTime = args.date + "T12:00:00Z";
  }
  await plannerPostRequest("/plans/clone", body);
};

type PlanEditorFormProps = {
  plan: Plan,
  clonePlan?: (clone: ClonePlanArguments) => void,
  onClose: () => void
};

const PlanSchema = Yup.object().shape({
  date: Yup.date().required("Required"),
  shiftOnStart: Yup.boolean()
});

export const PlanCloneInterface = ({ plan, clonePlan = defaultClonePlan, onClose }: PlanEditorFormProps) => {
  return <Formik
    initialValues={{ id: plan.id, date: (new Date().toISOString()).split("T")[0], shiftOnStart: false } as ClonePlanArguments}
    validationSchema={PlanSchema}
    onSubmit={async (values) => {
      clonePlan(values);
      onClose();
    }}
  >
    {({
      values,
      isValid,
      handleChange,
      handleSubmit
    }) => (
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FormControl>
            <FormLabel htmlFor={"date"}>New Start/End date</FormLabel>
            <Input
              id={"date"}
              name={"date"}
              type='date'
              onChange={handleChange} value={values.date}/>
          </FormControl>
          <FormControl>
            <Checkbox
              id={"shiftOnStart"}
              name={"shiftOnStart"}
              onChange={handleChange} isChecked={values.shiftOnStart}>
              Shift on Start
            </Checkbox>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant={"ghost"} onClick={onClose}>Cancel</Button>
          <Button type="submit" isDisabled={!isValid}>Clone</Button>
        </ModalFooter>
      </form>)}
  </Formik>;
};

import { Button, Checkbox, FormControl, FormLabel, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { Plan } from "../types";
import { Formik } from "formik";
import * as Yup from "yup";

type PlanEditorFormProps = {
  plan: Plan,
  editPlan: (plan: Plan) => void,
  deletePlan: (planId: string) => void,
  onClose: () => void
};

type PlanEditorProps = {
  plan: Plan,
  editPlan: (plan: Plan) => void,
  deletePlan: (planId: string) => void,
  styleProps: { [key: string]: string | number }
};

const PlanSchema = Yup.object().shape({
  name: Yup.string()
    .min(1, "Needs at least one character")
    .required("Required"),
  active: Yup.boolean().required("Required")
});

export const PlanEditorForm = ({ plan, editPlan, deletePlan, onClose }: PlanEditorFormProps) => {
  return <Formik
    initialValues={plan}
    validationSchema={PlanSchema}
    onSubmit={async (values) => {
      onClose();
      editPlan(values);
    }}
  >
    {({
      values,
      isValid,
      dirty,
      handleChange,
      handleSubmit
    }) => (
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FormControl>
            <FormLabel htmlFor={"name"}>Name</FormLabel>
            <Input
              id={"name"}
              name={"name"}
              onChange={handleChange} value={values.name}/>
          </FormControl>
          <FormControl>
            <Checkbox
              id={"active"}
              name={"active"}
              onChange={handleChange} isChecked={values.active}>
              Active
            </Checkbox>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant={"ghost"} onClick={onClose}>Cancel</Button>
          <Button variant={"outline"} onClick={() => { deletePlan(plan.id); onClose(); }}>Delete</Button>
          <Button type="submit" isDisabled={!dirty || !isValid}>Save</Button>
        </ModalFooter>
      </form>)}
  </Formik>;
};

export const PlanEditor = ({ plan, editPlan, deletePlan, styleProps }: PlanEditorProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return <><IconButton aria-label="Edit"
    {...styleProps}
    icon={<EditIcon />}
    onClick={onOpen}
  />
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Edit plan</ModalHeader>
      <ModalCloseButton />
      <PlanEditorForm plan={plan}
        editPlan={editPlan}
        deletePlan={deletePlan}
        onClose={onClose} />
    </ModalContent>
  </Modal></>;
};

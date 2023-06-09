import { IconButton, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { Plan } from "../types";

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

export const PlanEditorForm = ({ plan, editPlan, deletePlan, onClose }: PlanEditorFormProps) => {
  return <>Form</>;
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
      <ModalBody>
        <PlanEditorForm plan={plan}
          editPlan={editPlan}
          deletePlan={deletePlan}
          onClose={onClose} />
      </ModalBody>
    </ModalContent>
  </Modal></>;
};

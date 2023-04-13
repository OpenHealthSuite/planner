import { Button, Flex, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, Select, Checkbox } from "@chakra-ui/react";
import { Activity, activityTypes } from "../types";
import { plannerPostRequest } from "../utilities/apiRequest";
import { useFormik } from "formik";

const defaultActivityCreationFunction = (activity: Activity) => {
  return plannerPostRequest<Activity, string>('/activities', activity)
}

type AddActivityInterfaceProps = { 
  activityCreationFunction?: typeof defaultActivityCreationFunction
  onCreated?: (newId: string) => void
} 

export const AddActivityInterface = ({ 
  activityCreationFunction = defaultActivityCreationFunction,
  onCreated = () => {}
 }: AddActivityInterfaceProps) => {

  const { isOpen, onOpen, onClose } = useDisclosure()

  const formik = useFormik({
    initialValues: {
      name: "",
      type: "",
      attributes: {},
      dateTime: "",
      timeRelevant: false,
      completed: false
    } as any,
    onSubmit: async (values) => {
      values.dateTime = new Date(Date.parse(values.dateTime)).toISOString()
      try {
        const id = await activityCreationFunction(values)
        onClose()
        onCreated(id)
      } catch {

      }
    },
  })

  return <Flex flexDirection={'column'} 
      padding={'1em'}
      position={'fixed'}
      width={'100%'}
      bottom={0}>
      <Button onClick={onOpen}>Add Activity</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={formik.handleSubmit}>
          <ModalHeader>Adding Activity</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex flexDirection={'column'} gap={'1em'}>

              <FormControl>
                <FormLabel htmlFor="name">Name</FormLabel>
                <Input 
                id="name"
                name="name"
                type='text' onChange={formik.handleChange} value={formik.values.name}/>
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="type">Type</FormLabel>
                <Select 
                id="type"
                name="type" placeholder='Select Type' onChange={formik.handleChange} value={formik.values.type}>
                  {activityTypes.map(a => <option key={a}>{a}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="dateTime">Date</FormLabel>
                <Input 
                id="dateTime"
                name="dateTime" type='date' onChange={formik.handleChange} value={formik.values.dateTime} />
              </FormControl>
              <FormControl>
                <Checkbox 
                id="completed"
                name="completed" onChange={formik.handleChange} isChecked={formik.values.completed}>Complete</Checkbox>
              </FormControl>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Flex w={'100%'} justifyContent={'space-between'}>
              <Button onClick={onClose} variant='ghost' type="button">Cancel</Button>
              <Button type="submit">
                Save
              </Button>
            </Flex>
          </ModalFooter>

          </form>
        </ModalContent>
      </Modal>
    </Flex>
}
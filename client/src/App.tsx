import { Button, ChakraProvider, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, Spinner, extendTheme, useDisclosure } from "@chakra-ui/react";
import { createContext, useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AddActivityInterface } from "./components/ActivityEditor";
import { Plan } from "./types";
import { plannerGetRequest } from "./utilities/apiRequest";
import { AddRecurringActivityInterface } from "./components/RecurringActivityEditor";

const colors = {
  brand: {},
};

const theme = extendTheme({ colors });

export type ApplicationContextType = {
  userPlans: Plan[]
  setUserPlans: (plans: Plan[]) => void
  latestCreatedActivityId: string
  setLatestCreatedActivityId: (activityId: string) => void
}

export const ApplicationContext = createContext<ApplicationContextType>({
  userPlans: [],
  setUserPlans: () => { return; },
  latestCreatedActivityId: "",
  setLatestCreatedActivityId: () => { return; }
});

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [userPlans, setUserPlans] = useState<Plan[]>([]);
  const [latestCreatedActivityId, setLatestCreatedActivityId] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    plannerGetRequest<Plan[]>("/plans")
      .then(setUserPlans)
      .finally(() => setLoading(false));
  }, []);

  const updateAndClose = useCallback((newId: string) => {
    setLatestCreatedActivityId(newId);
    onClose();
  }, [onClose, setLatestCreatedActivityId]);

  return (
    <ChakraProvider theme={theme}>
      {loading && <Spinner size='xl' />}
      {!loading && <ApplicationContext.Provider value={{
        userPlans,
        setUserPlans,
        latestCreatedActivityId,
        setLatestCreatedActivityId
      }}>
        {!isOpen && <Button position={"fixed"}
          bottom={0}
          right={0}
          padding={"1em"}
          margin={"1em"}
          zIndex={9999}
          onClick={onOpen}>
      Menu
        </Button>}
        <Drawer
          isOpen={isOpen}
          placement='right'
          onClose={onClose}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Planner</DrawerHeader>

            <DrawerBody display={"flex"} 
              flexDirection={"column"}
              gap={"1em"}>
              <Button variant="ghost" onClick={() => {navigate("/"); onClose();}}>Schedule</Button>
              <Button variant="ghost" onClick={() => {navigate("/plans"); onClose();}}>Plans</Button>
            </DrawerBody>

            <DrawerFooter display={"flex"} flexDirection={"column"}>
              <AddActivityInterface onUpdate={updateAndClose} />
              <AddRecurringActivityInterface onUpdate={updateAndClose}/>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <Outlet />
      </ApplicationContext.Provider>}
    </ChakraProvider>
  );
}

export default App;

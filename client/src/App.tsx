import { Button, ChakraProvider, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, MenuItem, MenuList, Spinner, extendTheme, useDisclosure } from "@chakra-ui/react";
import { createContext, useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { AddActivityInterface } from "./components/ActivityEditor";
import { Plan } from "./types";
import { plannerGetRequest } from "./utilities/apiRequest";

const colors = {
  brand: {},
};

const theme = extendTheme({ colors });

export type ApplicationContextType = {
  userPlans: Plan[],
  latestCreatedActivityId: string
}

export const ApplicationContext = createContext<ApplicationContextType>({
  userPlans: [],
  latestCreatedActivityId: ""
});

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [applicationContext, setApplicationContext] = useState<ApplicationContextType>({
    userPlans: [],
    latestCreatedActivityId: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    plannerGetRequest<Plan[]>("/plans")
      .then(plans => setApplicationContext({
        userPlans: plans,
        latestCreatedActivityId: ""
      }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ChakraProvider theme={theme}>
      {loading && <Spinner size='xl' />}
      {!loading && <ApplicationContext.Provider value={applicationContext}>
        <Button position={"fixed"}
          bottom={0}
          right={0}
          padding={"1em"}
          margin={"1em"}
          onClick={onOpen}>
      Menu
        </Button>
        <Drawer
          isOpen={isOpen}
          placement='right'
          onClose={onClose}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader>Planner</DrawerHeader>

            <DrawerBody display={"flex"} 
              flexDirection={"column"}
              gap={"1em"}>
              <Button variant="ghost" onClick={() => {navigate("/"); onClose();}}>Schedule</Button>
              <Button variant="ghost" onClick={() => {navigate("/plans"); onClose();}}>Plans</Button>
            </DrawerBody>

            <DrawerFooter>
              <AddActivityInterface />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <Outlet />
      </ApplicationContext.Provider>}
    </ChakraProvider>
  );
}

export default App;

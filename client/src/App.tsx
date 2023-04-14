import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { ActivityList } from "./prototype/ActivityList";
import { AddActivityInterface } from "./components/AddActivityInterface";
import { useState } from "react";

const colors = {
  brand: {},
};

const theme = extendTheme({ colors });


function App() {
  const [newActivityId, setNewActivityId] = useState("");
  return (
    <ChakraProvider theme={theme}>
      <ActivityList updated={newActivityId}/>
      <AddActivityInterface onCreated={setNewActivityId}/>
    </ChakraProvider>
  );
}

export default App;

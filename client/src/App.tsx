import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { ActivityList } from "./prototype/ActivityList";
import { AddActivityInterface } from "./components/AddActivityInterface";

const colors = {
  brand: {},
};

const theme = extendTheme({ colors });

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ActivityList />
      <AddActivityInterface />
    </ChakraProvider>
  );
}

export default App;

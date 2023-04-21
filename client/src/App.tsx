import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";

const colors = {
  brand: {},
};

const theme = extendTheme({ colors });


function App() {
  return (
    <ChakraProvider theme={theme}>
      <Outlet />
    </ChakraProvider>
  );
}

export default App;

import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import Prototype from './Prototype';

const colors = {
  brand: {},
};

const theme = extendTheme({ colors });

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Prototype />
    </ChakraProvider>
  )
}

export default App

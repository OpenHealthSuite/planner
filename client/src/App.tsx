import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import Prototype from './Prototype';
import { ActivityList } from './prototype/ActivityList';

const colors = {
  brand: {},
};

const theme = extendTheme({ colors });

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ActivityList />
    </ChakraProvider>
  )
}

export default App

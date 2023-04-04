import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import Calendar from './views/Calendar'


const colors = {
  brand: {},
};

const theme = extendTheme({ colors });


function App() {
  return (
    <ChakraProvider theme={theme}>
      <Calendar />
    </ChakraProvider>
  )
}

export default App

import React from 'react';
import { useToast as useChakraToast } from '@chakra-ui/react';
import AppRoutes from './routes';

function App() {
  const toast = useChakraToast();

  // Global error handler
  React.useEffect(() => {
    const handleError = (event) => {
      console.error('Global error:', event.error);
      toast({
        title: 'An error occurred',
        description: event.error?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [toast]);

  return <AppRoutes />;
}

export default App;

import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Flex minH="100vh" bg={bgColor}>
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onClose={onClose} />

      {/* Main Content */}
      <Flex flex="1" direction="column" ml={{ base: 0, md: '280px' }} w={{ base: '100%', md: 'auto' }}>
        {/* Mobile Menu Button */}
        <Box display={{ base: 'flex', md: 'none' }} p={4} position="sticky" top={0} bg={bgColor} zIndex={1} borderBottomWidth="1px" borderColor="gray.200">
          <IconButton
            onClick={onOpen}
            variant="outline"
            aria-label="open menu"
            icon={<FiMenu />}
            size={{ base: "md", sm: "lg" }}
          />
        </Box>

        {/* Page Content */}
        <Box 
          as="main" 
          flex="1" 
          p={{ base: 3, sm: 4, md: 6, lg: 8 }} 
          overflow="auto"
          w="100%"
          maxW="100%"
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;

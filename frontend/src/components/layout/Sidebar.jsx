import React from 'react';
import {
  Box,
  CloseButton,
  Flex,
  Icon,
  Link,
  Drawer,
  DrawerContent,
  Text,
  VStack,
  Avatar,
} from '@chakra-ui/react';
import {
  FiHome,
  FiUser,
  FiActivity,
  FiHeart,
  FiTarget,
  FiTrendingUp,
  FiAward,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getImageUrl } from '../../services/api';

const SidebarContent = ({ onClose, ...rest }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const LinkItems = [
    { name: 'ダッシュボード', icon: FiHome, path: '/dashboard' },
    { name: '測定', icon: FiActivity, path: '/measurements' },
    { name: '栄養', icon: FiHeart, path: '/nutrition' },
    { name: 'ワークアウト', icon: FiTarget, path: '/workouts' },
    { name: '進捗', icon: FiTrendingUp, path: '/progress' },
    { name: '設定', icon: FiSettings, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      bg="#1e293b"
      w={{ base: 'full', md: '280px' }}
      pos="fixed"
      h="full"
      overflowY="auto"
      display="flex"
      flexDirection="column"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#475569',
          borderRadius: '24px',
        },
      }}
      {...rest}
    >
      {/* Logo Section */}
      <Flex h="16" alignItems="center" px="6" py="4" justifyContent="space-between" mb={2}>
        <Flex alignItems="center" gap={3}>
          <Box
            p={0}
            borderRadius="xl"
            boxShadow="0 4px 12px rgba(139, 92, 246, 0.3)"
            w="48px"
            h="48px"
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="none"
          >
            <img src="/favicon.svg" alt="FitNutrition Logo" style={{ width: 44, height: 44, display: 'block' }} />
          </Box>
          <Text fontSize="24px" fontWeight="extrabold" color="white" letterSpacing="tight">
            FitNutrition
          </Text>
        </Flex>
        <CloseButton 
          display={{ base: 'flex', md: 'none' }} 
          onClick={onClose} 
          color="gray.400"
          _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
          borderRadius="lg"
        />
      </Flex>

      {/* User Profile Section */}
      <Box px="5" py="3" mb={6}>
        <Link as={RouterLink} to="/profile" style={{ textDecoration: 'none' }}>
          <Flex
            align="center"
            p={4}
            borderRadius="2xl"
            bg="linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)"
            borderWidth="1px"
            borderColor="rgba(139, 92, 246, 0.3)"
            boxShadow="0 4px 16px rgba(139, 92, 246, 0.1)"
            transition="all 0.3s"
            cursor="pointer"
            _hover={{
              borderColor: "rgba(139, 92, 246, 0.5)",
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(139, 92, 246, 0.2)"
            }}
          >
            <Avatar
              size="md"
              name={user?.first_name || 'User'}
              src={getImageUrl(user?.profile_picture)}
              bg="purple.500"
              mr={4}
              borderWidth="2px"
              borderColor="purple.400"
              boxShadow="0 2px 8px rgba(139, 92, 246, 0.4)"
            />
            <Box flex="1" minW="0">
              <Text fontSize="15px" fontWeight="bold" color="white" noOfLines={1} mb={0.5}>
                {user?.first_name || 'User'}
              </Text>
              <Text fontSize="13px" color="gray.400" noOfLines={1}>
                {user?.email}
              </Text>
            </Box>
          </Flex>
        </Link>
      </Box>

      {/* Navigation Items */}
      <VStack spacing={1.5} align="stretch" px={4} flex="1">
        {LinkItems.map((link) => (
          <NavItem
            key={link.name}
            icon={link.icon}
            path={link.path}
            isActive={location.pathname === link.path}
            onClose={onClose}
          >
            {link.name}
          </NavItem>
        ))}
      </VStack>

      {/* Logout Button at Bottom */}
      <Box p={5} borderTop="1px" borderColor="#334155" mt="auto">
        <Flex
          align="center"
          px="5"
          py="3.5"
          borderRadius="2xl"
          cursor="pointer"
          color="#94a3b8"
          fontWeight="semibold"
          bg="transparent"
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            bg: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            transform: 'translateX(4px)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
          }}
          onClick={handleLogout}
          role="group"
        >
          <Icon 
            as={FiLogOut} 
            mr="4" 
            fontSize="22"
            transition="all 0.3s"
            _groupHover={{
              transform: 'scale(1.1) rotate(-10deg)',
            }}
          />
          <Text fontSize="15px" letterSpacing="tight">ログアウト</Text>
        </Flex>
      </Box>
    </Box>
  );
};

const NavItem = ({ icon, children, path, isActive, onClose, ...rest }) => {
  const handleClick = () => {
    // Close sidebar on mobile after clicking
    if (onClose) {
      onClose();
    }
  };

  return (
    <Link
      as={RouterLink}
      to={path}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
      onClick={handleClick}
    >
      <Flex
        align="center"
        px="5"
        py="3.5"
        borderRadius="2xl"
        role="group"
        cursor="pointer"
        bg={isActive ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)' : 'transparent'}
        color={isActive ? 'white' : '#94a3b8'}
        fontWeight={isActive ? 'bold' : 'medium'}
        position="relative"
        overflow="hidden"
        boxShadow={isActive ? '0 4px 12px rgba(139, 92, 246, 0.2)' : 'none'}
        _before={{
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: isActive ? '60%' : '0%',
          bg: '#8b5cf6',
          borderRadius: '0 4px 4px 0',
          transition: 'height 0.3s',
        }}
        _hover={{
          bg: isActive ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.2) 100%)' : 'rgba(255, 255, 255, 0.08)',
          color: 'white',
          transform: 'translateX(4px)',
          boxShadow: isActive ? '0 6px 16px rgba(139, 92, 246, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="22"
            as={icon}
            transition="all 0.3s"
            _groupHover={{
              transform: 'scale(1.1)',
            }}
          />
        )}
        <Text fontSize="15px" letterSpacing="tight">{children}</Text>
      </Flex>
    </Link>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Desktop sidebar */}
      <SidebarContent
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
      />
    </>
  );
};

export default Sidebar;

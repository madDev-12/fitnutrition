import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  useColorModeValue,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { FiMenu, FiBell, FiSettings, FiLogOut, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Navbar = ({ onOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={{ base: 4, md: 8 }}
      py={4}
    >
      <Flex alignItems="center" justifyContent="space-between">
        {/* Mobile menu button */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          variant="outline"
          aria-label="open menu"
          icon={<FiMenu />}
        />

        {/* Logo/Title */}
        <Text
          fontSize="2xl"
          fontWeight="bold"
          bgGradient="linear(to-r, brand.400, brand.600)"
          bgClip="text"
          display={{ base: 'none', md: 'block' }}
        >
          FitNutrition
        </Text>

        {/* Right side */}
        <HStack spacing={4}>
          {/* Notifications */}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiBell />}
              variant="ghost"
              position="relative"
            >
              <Badge
                colorScheme="red"
                position="absolute"
                top="0"
                right="0"
                fontSize="xs"
              >
                3
              </Badge>
            </MenuButton>
            <MenuList>
              <MenuItem>新しいワークアウトプランが利用可能です</MenuItem>
              <MenuItem>週間目標を達成しました！</MenuItem>
              <MenuItem>測定値を記録する時間です</MenuItem>
            </MenuList>
          </Menu>

          {/* User menu */}
          <Menu>
            <MenuButton>
              <HStack spacing={2}>
                <Avatar
                  size="sm"
                  name={user?.first_name || 'User'}
                  src={user?.avatar}
                  bg="brand.500"
                />
                <Box display={{ base: 'none', md: 'block' }} textAlign="left">
                  <Text fontSize="sm" fontWeight="medium">
                    {user?.first_name || 'User'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {user?.email}
                  </Text>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />} onClick={() => navigate('/profile')}>
                プロフィール
              </MenuItem>
              <MenuItem icon={<FiSettings />} onClick={() => navigate('/settings')}>
                設定
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                ログアウト
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;

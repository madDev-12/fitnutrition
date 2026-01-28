import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Grid,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Spinner,
  Center,
  useColorModeValue,
  Avatar,
  VStack,
  HStack,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { FiSave, FiUser, FiCamera, FiUpload } from 'react-icons/fi';
import usersService from '../services/users';
import { useAuthStore } from '../store/authStore';
import { ACTIVITY_LEVELS, FITNESS_GOALS } from '../utils/constants';
import { getImageUrl } from '../services/api';

const Profile = () => {
  const toast = useToast();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    height: '',
    target_weight: '',
    target_body_fat_percentage: '',
    activity_level: '',
    fitness_goal: '',
  });
  const [originalData, setOriginalData] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    loadProfile();
  }, []);

  // Check for unsaved changes when formData or selectedProfilePicture changes
  useEffect(() => {
    if (originalData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData) || selectedProfilePicture !== null;
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, originalData, selectedProfilePicture]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '変更が保存されていません。ページを離れますか？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await usersService.getProfile();
      const userData = response.data;
      const userProfile = userData.profile || {};
      
      setProfile(userData);
      const profileData = {
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        height: userProfile.height || '',
        target_weight: userProfile.target_weight || '',
        target_body_fat_percentage: userProfile.target_body_fat_percentage || '',
        activity_level: userProfile.activity_level || '',
        fitness_goal: userProfile.fitness_goal || '',
      };
      setFormData(profileData);
      setOriginalData(profileData);
      setHasUnsavedChanges(false);
    } catch (error) {
      toast({
        title: 'プロフィール読み込みエラー',
        description: error.response?.data?.detail || 'プロフィールの読み込みに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let uploadResponse = null;
      
      // Upload profile picture first if selected
      if (selectedProfilePicture) {
        uploadResponse = await usersService.uploadProfilePicture(selectedProfilePicture);
      }

      // Separate user data and profile data
      const userData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        date_of_birth: formData.date_of_birth || null,
      };

      const profileData = {
        gender: formData.gender || null,
        height: formData.height ? parseFloat(formData.height) : null,
        target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
        target_body_fat_percentage: formData.target_body_fat_percentage ? parseFloat(formData.target_body_fat_percentage) : null,
        activity_level: formData.activity_level || null,
        fitness_goal: formData.fitness_goal || null,
      };

      // Update user basic info
      await usersService.updateProfile(userData);
      
      // Update profile details
      await usersService.updateProfileDetails(profileData);

      // Update user in authStore with new profile picture if uploaded
      if (uploadResponse && uploadResponse.user) {
        updateUser(uploadResponse.user);
      }

      // Reset unsaved changes flag
      setOriginalData(formData);
      setHasUnsavedChanges(false);
      setSelectedProfilePicture(null);
      setPreviewImage(null);

      toast({
        title: 'プロフィールを更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadProfile();
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'プロフィール更新エラー',
        description: error.response?.data?.detail || error.response?.data?.error || 'プロフィールの更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'ファイル形式エラー',
        description: '対応している画像形式: JPG, PNG, GIF, WEBP',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'ファイルサイズエラー',
        description: '画像サイズは5MB以下にしてください',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Store selected file for later upload
    setSelectedProfilePicture(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Show info toast
    toast({
      title: '画像が選択されました',
      description: '変更を保存するには「変更を保存」ボタンをクリックしてください',
      status: 'info',
      duration: 4000,
      isClosable: true,
    });

    // Reset file input
    e.target.value = '';
  };

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={{ base: 4, md: 6, lg: 8 }}>
        <Heading size={{ base: "sm", md: "md" }} mb={2}>プロフィール設定</Heading>
        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">個人情報と設定を管理</Text>
      </Box>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>未保存の変更があります</AlertTitle>
            <AlertDescription>
              変更を保存するには、下の「変更を保存」ボタンをクリックしてください。
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <Grid templateColumns={{ base: '1fr', lg: '300px 1fr' }} gap={{ base: 3, md: 4, lg: 6 }}>
        {/* Profile Card */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4}>
              <Box position="relative">
                <Avatar
                  size="2xl"
                  name={`${formData.first_name} ${formData.last_name}`}
                  src={previewImage || getImageUrl(profile?.profile_picture)}
                  bg="brand.500"
                />
                <IconButton
                  icon={<FiCamera />}
                  size="sm"
                  colorScheme={selectedProfilePicture ? "green" : "brand"}
                  borderRadius="full"
                  position="absolute"
                  bottom="0"
                  right="0"
                  onClick={handleProfilePictureClick}
                  aria-label="プロフィール画像を変更"
                  boxShadow="md"
                />
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  display="none"
                />
              </Box>
              <Box textAlign="center">
                <Heading size="md">{formData.first_name} {formData.last_name}</Heading>
                <Text color="gray.600" fontSize="sm">{formData.email}</Text>
                {selectedProfilePicture && (
                  <Badge colorScheme="orange" mt={2} fontSize="xs">
                    新しい画像が選択されました
                  </Badge>
                )}
              </Box>
              <Divider />
              <VStack align="stretch" w="full" spacing={2}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">登録日</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '未設定'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">目標体重</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formData.target_weight ? `${formData.target_weight} kg` : '未設定'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">活動レベル</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {ACTIVITY_LEVELS.find(l => l.value === formData.activity_level)?.label || '未設定'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">フィットネス目標</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {FITNESS_GOALS.find(g => g.value === formData.fitness_goal)?.label || '未設定'}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Profile Form */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">個人情報</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                {/* Basic Information */}
                <Box>
                  <Heading size="sm" mb={4}>基本情報</Heading>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <FormControl isRequired>
                      <FormLabel>名</FormLabel>
                      <Input
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="太郎"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>姓</FormLabel>
                      <Input
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="山田"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>年齢</FormLabel>
                      <Input
                        value={profile?.age ? `${profile.age} 歳` : '未設定'}
                        isReadOnly
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        cursor="not-allowed"
                        _focus={{ outline: 'none', boxShadow: 'none' }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>性別</FormLabel>
                      <Input
                        value={profile?.profile?.gender === 'male' ? '男性' :
                               profile?.profile?.gender === 'female' ? '女性' :
                               profile?.profile?.gender === 'other' ? 'その他' : '未設定'}
                        isReadOnly
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        cursor="not-allowed"
                        _focus={{ outline: 'none', boxShadow: 'none' }}
                      />
                    </FormControl>
                  </Grid>
                </Box>

                <Divider />

                {/* Fitness Information */}
                <Box>
                  <Heading size="sm" mb={4}>フィットネス情報</Heading>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <FormControl>
                      <FormLabel>身長 (cm)</FormLabel>
                      <Input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        placeholder="170"
                        step="0.1"
                        min="50"
                        max="300"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>目標体重 (kg)</FormLabel>
                      <Input
                        type="number"
                        name="target_weight"
                        value={formData.target_weight}
                        onChange={handleChange}
                        placeholder="70"
                        step="0.1"
                        min="20"
                        max="500"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>体脂肪率目標 (%)</FormLabel>
                      <Input
                        type="number"
                        name="target_body_fat_percentage"
                        value={formData.target_body_fat_percentage}
                        onChange={handleChange}
                        placeholder="15"
                        step="0.1"
                        min="3"
                        max="60"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>活動レベル</FormLabel>
                      <Select
                        name="activity_level"
                        value={formData.activity_level}
                        onChange={handleChange}
                        placeholder="活動レベルを選択"
                      >
                        {ACTIVITY_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>フィットネス目標</FormLabel>
                      <Select
                        name="fitness_goal"
                        value={formData.fitness_goal}
                        onChange={handleChange}
                        placeholder="目標を選択"
                      >
                        {FITNESS_GOALS.map((goal) => (
                          <option key={goal.value} value={goal.value}>
                            {goal.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Box>

                <Divider />

                {/* Action Buttons */}
                <HStack justify="flex-end" spacing={4}>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      loadProfile();
                      setSelectedProfilePicture(null);
                      setPreviewImage(null);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="brand"
                    leftIcon={<FiSave />}
                    isLoading={submitting}
                  >
                    変更を保存
                  </Button>
                </HStack>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </Grid>

      {/* Account Statistics */}
      <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} mt={6}>
        <CardHeader>
          <Heading size="md">アカウント統計</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
            <Box textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="brand.500">
                {profile?.total_measurements || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">記録した測定値</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="green.500">
                {profile?.total_meals || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">記録した食事</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="purple.500">
                {profile?.total_workouts || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">完了したワークアウト</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                {profile?.days_active || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">アクティブ日数</Text>
            </Box>
          </Grid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Profile;

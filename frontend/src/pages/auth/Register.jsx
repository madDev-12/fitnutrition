import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  Link,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Flex,
  useColorModeValue,
  Select,
  Grid,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import authService from '../../services/auth';
import { ACTIVITY_LEVELS, FITNESS_GOALS, GENDER_OPTIONS } from '../../utils/constants';

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    height: '',
    weight: '',
    activity_level: '',
    fitness_goal: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Password validation state
  const passwordValidation = useMemo(() => {
    const password = formData.password;
    const email = formData.email;
    const firstName = formData.first_name.toLowerCase();
    const lastName = formData.last_name.toLowerCase();
    
    // Common passwords list (subset)
    const commonPasswords = [
      'password', 'password123', '12345678', 'qwerty', 'abc123',
      'password1', '123456789', 'qwerty123', 'admin', 'admin123',
      'letmein', 'welcome', 'monkey', '1234567890', 'password12'
    ];

    return {
      minLength: password.length >= 8,
      hasLetterAndNumber: /[a-zA-Z]/.test(password) && /[0-9]/.test(password),
      notOnlyNumeric: !/^\d+$/.test(password),
      notCommon: !commonPasswords.includes(password.toLowerCase()),
      notSimilarToUser: (() => {
        if (!password) return true;
        const lowerPassword = password.toLowerCase();
        const emailPrefix = email.split('@')[0].toLowerCase();
        
        // Check similarity with email, first name, last name
        if (emailPrefix && lowerPassword.includes(emailPrefix)) return false;
        if (firstName && firstName.length > 2 && lowerPassword.includes(firstName)) return false;
        if (lastName && lastName.length > 2 && lowerPassword.includes(lastName)) return false;
        
        return true;
      })(),
      passwordsMatch: formData.password && formData.password2 && formData.password === formData.password2,
    };
  }, [formData.password, formData.password2, formData.email, formData.first_name, formData.last_name]);

  const allPasswordRequirementsMet = useMemo(() => {
    return passwordValidation.minLength &&
           passwordValidation.hasLetterAndNumber &&
           passwordValidation.notOnlyNumeric &&
           passwordValidation.notCommon &&
           passwordValidation.notSimilarToUser;
  }, [passwordValidation]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.password2) {
      toast({
        title: 'パスワードが一致しません',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      // Normalize payload to backend-expected field values
      const payload = { ...formData };

      // Ensure username exists (backend also derives it, but include to be explicit)
      if (!payload.username && payload.email) {
        payload.username = payload.email.split('@')[0];
      }

      // (No mapping needed: constants now match backend choices)

      // Convert numeric strings to numbers and remove empty values so backend doesn't try to create an incomplete profile
      if (payload.height === '') delete payload.height;
      else if (payload.height != null) payload.height = Number(payload.height);

      if (payload.weight === '') delete payload.weight;
      else if (payload.weight != null) payload.weight = Number(payload.weight);

      const response = await authService.register(payload);
      
      toast({
        title: '登録成功',
        description: '認証情報でログインしてください',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/login');
    } catch (error) {
      // Handle various error formats
      let errorMessage = '登録に失敗しました。もう一度お試しください。';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.email) {
          errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.username) {
          errorMessage = Array.isArray(data.username) ? data.username[0] : data.username;
        } else if (data.password) {
          errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        }
      }
      
      toast({
        title: '登録失敗',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg={useColorModeValue('gray.50', 'gray.900')} py={12}>
      <Container maxW="2xl">
        <Box
          bg={bgColor}
          p={8}
          borderRadius="xl"
          boxShadow="xl"
          border="1px"
          borderColor={borderColor}
        >
          {/* Logo/Title */}
          <Box textAlign="center" mb={8}>
            <Heading
              size="2xl"
              bgGradient="linear(to-r, brand.400, brand.600)"
              bgClip="text"
              mb={2}
            >
              FitNutrition
            </Heading>
            <Text color="gray.600">アカウントを作成</Text>
          </Box>

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              {/* Personal Information */}
              <Heading size="md" color="gray.700">個人情報</Heading>
              
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              <FormControl isRequired>
                  <FormLabel>姓</FormLabel>
                  <Input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="山田"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>名</FormLabel>
                  <Input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="太郎"
                  />
                </FormControl>
              </Grid>

              <FormControl isRequired>
                <FormLabel>メールアドレス</FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>パスワード</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="最低8文字"
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                    />
                  </InputRightElement>
                </InputGroup>
                
                {/* Password Requirements Indicator */}
                {formData.password && (
                  <Box mt={3} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                    <Text fontSize="sm" fontWeight="semibold" mb={2} color={useColorModeValue('gray.700', 'gray.200')}>
                      パスワード要件:
                    </Text>
                    <List spacing={1}>
                      <ListItem fontSize="sm" color={passwordValidation.minLength ? 'green.500' : 'red.500'}>
                        <ListIcon as={passwordValidation.minLength ? FiCheck : FiX} />
                        最低8文字
                      </ListItem>
                      <ListItem fontSize="sm" color={passwordValidation.hasLetterAndNumber ? 'green.500' : 'red.500'}>
                        <ListIcon as={passwordValidation.hasLetterAndNumber ? FiCheck : FiX} />
                        文字と数字の組み合わせ
                      </ListItem>
                      <ListItem fontSize="sm" color={passwordValidation.notOnlyNumeric ? 'green.500' : 'red.500'}>
                        <ListIcon as={passwordValidation.notOnlyNumeric ? FiCheck : FiX} />
                        数字のみは不可
                      </ListItem>
                      <ListItem fontSize="sm" color={passwordValidation.notCommon ? 'green.500' : 'red.500'}>
                        <ListIcon as={passwordValidation.notCommon ? FiCheck : FiX} />
                        一般的なパスワードは不可
                      </ListItem>
                      <ListItem fontSize="sm" color={passwordValidation.notSimilarToUser ? 'green.500' : 'red.500'}>
                        <ListIcon as={passwordValidation.notSimilarToUser ? FiCheck : FiX} />
                        個人情報と類似していない
                      </ListItem>
                    </List>
                  </Box>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>パスワード確認</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword2 ? 'text' : 'password'}
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    placeholder="パスワードを再入力"
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={showPassword2 ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowPassword2(!showPassword2)}
                      aria-label={showPassword2 ? 'パスワードを隠す' : 'パスワードを表示'}
                    />
                  </InputRightElement>
                </InputGroup>
                
                {/* Password Match Indicator */}
                {formData.password2 && (
                  <Box mt={2}>
                    <Text 
                      fontSize="sm" 
                      color={passwordValidation.passwordsMatch ? 'green.500' : 'red.500'}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Box as={passwordValidation.passwordsMatch ? FiCheck : FiX} />
                      {passwordValidation.passwordsMatch ? 'パスワードが一致します' : 'パスワードが一致しません'}
                    </Text>
                  </Box>
                )}
              </FormControl>

              {/* Physical Information */}
              <Heading size="md" color="gray.700" mt={4}>身体情報</Heading>
              
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>生年月日</FormLabel>
                  <Input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>性別</FormLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    placeholder="性別を選択"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>身長 (cm)</FormLabel>
                  <Input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="175"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>体重 (kg)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="70.5"
                  />
                </FormControl>
              </Grid>

              {/* Fitness Information */}
              <Heading size="md" color="gray.700" mt={4}>フィットネス目標</Heading>
              
              <FormControl isRequired>
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

              <FormControl isRequired>
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

              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                fontSize="md"
                isLoading={loading}
                loadingText="アカウント作成中..."
                mt={4}
              >
                アカウント作成
              </Button>
            </Stack>
          </form>

          {/* Links */}
          <Stack mt={6} spacing={2}>
            <Text textAlign="center" fontSize="sm">
              すでにアカウントをお持ちですか？{' '}
              <Link as={RouterLink} to="/login" color="brand.500" fontWeight="semibold">
                ログイン
              </Link>
            </Text>
          </Stack>
        </Box>
      </Container>
    </Flex>
  );
};

export default Register;

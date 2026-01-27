import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Grid,
  useToast,
  Spinner,
  Center,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Badge,
  IconButton,
  HStack,
  Icon,
  Flex,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, CalendarIcon } from '@chakra-ui/icons';
import { FiActivity, FiPercent, FiZap, FiTrendingUp } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import measurementsService from '../services/measurements';
import analyticsService from '../services/analytics';
import { formatDate, calculateBMI, calculateBMR, calculateTDEE } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';

const Measurements = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();
  const toast = useToast();
  const { user } = useAuthStore();
  const [measurements, setMeasurements] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [chartStartIndex, setChartStartIndex] = useState(0);
  const [chartPointsToShow] = useState(7); // Show 7 days at a time
  const [tableStartIndex, setTableStartIndex] = useState(0);
  const [tableItemsToShow] = useState(7); // Show 7 items at a time in table
  const [formData, setFormData] = useState({
    date: '',
    weight: '',
    body_fat_percentage: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    calves: '',
  });
  const [placeholders, setPlaceholders] = useState({
    weight: '70.5',
    body_fat_percentage: '18.5',
    chest: '98',
    waist: '82',
    hips: '95',
    arms: '35',
    thighs: '58',
    calves: '38',
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    loadMeasurements();
    loadDashboardData();
  }, []);

  // Update placeholders whenever measurements change
  useEffect(() => {
    const updatePlaceholders = async () => {
      if (measurements.length > 0) {
        try {
          // Get full details of the latest measurement
          const latestMeasurement = await measurementsService.getById(measurements[0].id);
          
          const getAverageOrValue = (left, right) => {
            if (left && right) {
              return ((parseFloat(left) + parseFloat(right)) / 2).toFixed(1);
            }
            return left || right || '';
          };
          
          const newPlaceholders = {
            weight: latestMeasurement.weight || '70.5',
            body_fat_percentage: latestMeasurement.body_fat_percentage || '18.5',
            chest: latestMeasurement.chest || '98',
            waist: latestMeasurement.waist || '82',
            hips: latestMeasurement.hips || '95',
            arms: getAverageOrValue(latestMeasurement.arms_left, latestMeasurement.arms_right) || '35',
            thighs: getAverageOrValue(latestMeasurement.thighs_left, latestMeasurement.thighs_right) || '58',
            calves: getAverageOrValue(latestMeasurement.calves_left, latestMeasurement.calves_right) || '38',
          };
          
          setPlaceholders(newPlaceholders);
        } catch (error) {
          console.error('Error fetching latest measurement details:', error);
          // Fallback to basic fields if detailed fetch fails
          const latest = measurements[0];
          const newPlaceholders = {
            weight: latest.weight || '70.5',
            body_fat_percentage: latest.body_fat_percentage || '18.5',
            chest: latest.chest || '98',
            waist: latest.waist || '82',
            hips: latest.hips || '95',
            arms: '35',
            thighs: '58',
            calves: '38',
          };
          setPlaceholders(newPlaceholders);
        }
      }
    };
    
    updatePlaceholders();
  }, [measurements]);

  const loadMeasurements = async () => {
    try {
      setLoading(true);
      const response = await measurementsService.getMeasurements();
      
      // Handle paginated response from DRF
      const data = response?.results || response || [];
      setMeasurements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load measurements error:', error);
      toast({
        title: '測定値の読み込みエラー',
        description: error.response?.data?.detail || 'データの読み込みに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setMeasurements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const dashboardResponse = await analyticsService.getDashboard();
      const data = dashboardResponse.data || dashboardResponse;
      console.log('Dashboard data for Measurements:', data);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(null);
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
      // Filter out empty string values before sending to API
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Only include non-empty values
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      if (editingId) {
        // Update existing measurement
        await measurementsService.updateMeasurement(editingId, cleanedData);
        toast({
          title: '測定値を更新しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new measurement
        await measurementsService.createMeasurement(cleanedData);
        toast({
          title: '測定値を追加しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      loadMeasurements();
      loadDashboardData(); // Reload dashboard data to update BMR and TDEE
      resetForm();
    } catch (error) {
      toast({
        title: editingId ? '測定値の更新エラー' : '測定値の追加エラー',
        description: error.response?.data?.detail || '操作に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      weight: '',
      body_fat_percentage: '',
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: '',
      calves: '',
    });
    setEditingId(null);
  };

  const handleEdit = async (measurement) => {
    try {
      // Fetch full measurement details from API
      const fullMeasurement = await measurementsService.getById(measurement.id);
      console.log('Full measurement data:', fullMeasurement); // Debug log
      
      // For arms, thighs, calves - use left value, or right value, or average if both exist
      const getAverageOrValue = (left, right) => {
        if (left && right) {
          return ((parseFloat(left) + parseFloat(right)) / 2).toFixed(1);
        }
        return left || right || '';
      };
      
      const formValues = {
        date: fullMeasurement.date || '',
        weight: fullMeasurement.weight || '',
        body_fat_percentage: fullMeasurement.body_fat_percentage || '',
        chest: fullMeasurement.chest || '',
        waist: fullMeasurement.waist || '',
        hips: fullMeasurement.hips || '',
        arms: getAverageOrValue(fullMeasurement.arms_left, fullMeasurement.arms_right),
        thighs: getAverageOrValue(fullMeasurement.thighs_left, fullMeasurement.thighs_right),
        calves: getAverageOrValue(fullMeasurement.calves_left, fullMeasurement.calves_right),
      };
      
      console.log('Form values:', formValues); // Debug log
      setEditingId(measurement.id);
      setFormData(formValues);
      onOpen();
    } catch (error) {
      console.error('Error fetching measurement details:', error);
      toast({
        title: 'データ取得エラー',
        description: '測定値の詳細を取得できませんでした',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    try {
      await measurementsService.deleteMeasurement(deleteId);
      toast({
        title: '測定値を削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadMeasurements();
      loadDashboardData(); // Reload dashboard data to update BMR and TDEE
      onDeleteClose();
    } catch (error) {
      toast({
        title: '削除エラー',
        description: error.response?.data?.detail || '削除に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  // Handle opening the add measurement modal with today's date as default
  const handleAddMeasurement = () => {
    // Set default date to today's date
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      date: today,
      weight: placeholders.weight,
      body_fat_percentage: placeholders.body_fat_percentage,
      chest: placeholders.chest,
      waist: placeholders.waist,
      hips: placeholders.hips,
      arms: placeholders.arms,
      thighs: placeholders.thighs,
      calves: placeholders.calves,
    });
    onOpen();
  };

  // Get today's date for max date constraint
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const latestMeasurement = measurements[0];
  const userHeight = user?.profile?.height;
  const bmi = (latestMeasurement && userHeight) ? parseFloat(calculateBMI(latestMeasurement.weight, userHeight)) : null;
  
  // Calculate age from date_of_birth
  const calculateAge = (dob) => {
    if (!dob) return 25; // Default age
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  // Get user data from profile
  const userAge = user?.date_of_birth ? calculateAge(user.date_of_birth) : 25;
  const userGender = user?.profile?.gender || 'male';
  const userActivityLevel = user?.profile?.activity_level || 'moderate';
  
  // Use BMR and TDEE from dashboard data (same calculation as Dashboard page)
  const bmr = dashboardData?.metabolism?.bmr || null;
  const tdee = dashboardData?.metabolism?.tdee || null;

  // Format date for chart (more compact)
  const formatChartDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric' 
    });
  };

  // Prepare chart data - implement scrolling functionality
  const sortedMeasurements = measurements
    .slice() // Create a copy to avoid mutating original
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending (newest first)
  
  const totalDataPoints = sortedMeasurements.length;
  const maxStartIndex = Math.max(0, totalDataPoints - chartPointsToShow);
  const actualStartIndex = Math.min(chartStartIndex, maxStartIndex);
  const endIndex = Math.min(actualStartIndex + chartPointsToShow, totalDataPoints);
  
  const chartData = sortedMeasurements
    .slice(actualStartIndex, endIndex)
    .reverse() // Reverse to show oldest to newest in chart
    .map(m => ({
      date: formatChartDate(m.date), // Use compact date format for chart
      fullDate: formatDate(m.date), // Keep full date for tooltip
      weight: m.weight,
      bodyFat: m.body_fat_percentage,
    }));
  
  // Navigation functions
  const canGoLeft = actualStartIndex > 0;
  const canGoRight = actualStartIndex < maxStartIndex;
  
  const goToPrevious = () => {
    if (canGoLeft) {
      setChartStartIndex(Math.max(0, chartStartIndex - chartPointsToShow));
    }
  };
  
  const goToNext = () => {
    if (canGoRight) {
      setChartStartIndex(Math.min(maxStartIndex, chartStartIndex + chartPointsToShow));
    }
  };
  
  const goToLatest = () => {
    setChartStartIndex(0);
  };
  
  // Table data preparation and navigation
  const sortedTableMeasurements = measurements
    .slice() // Create a copy to avoid mutating original
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending (newest first)
  
  const totalTableItems = sortedTableMeasurements.length;
  const maxTableStartIndex = Math.max(0, totalTableItems - tableItemsToShow);
  const actualTableStartIndex = Math.min(tableStartIndex, maxTableStartIndex);
  const tableEndIndex = Math.min(actualTableStartIndex + tableItemsToShow, totalTableItems);
  
  const displayedMeasurements = sortedTableMeasurements
    .slice(actualTableStartIndex, tableEndIndex);
  
  // Table navigation functions
  const canGoTableLeft = actualTableStartIndex > 0;
  const canGoTableRight = actualTableStartIndex < maxTableStartIndex;
  
  const goToTablePrevious = () => {
    if (canGoTableLeft) {
      setTableStartIndex(Math.max(0, tableStartIndex - tableItemsToShow));
    }
  };
  
  const goToTableNext = () => {
    if (canGoTableRight) {
      setTableStartIndex(Math.min(maxTableStartIndex, tableStartIndex + tableItemsToShow));
    }
  };
  
  const goToTableLatest = () => {
    setTableStartIndex(0);
  };

  // Get dates that have measurement data
  const getMeasurementDates = () => {
    return measurements.map(m => m.date).filter(Boolean);
  };

  // Custom Calendar Component
  const CustomCalendar = ({ selectedDate, onDateSelect, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const measurementDates = getMeasurementDates();
    
    const today = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const weeks = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }
    
    const formatDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const hasData = (date) => {
      return measurementDates.includes(formatDateString(date));
    };
    
    const isToday = (date) => {
      return formatDateString(date) === formatDateString(today);
    };
    
    const isSelected = (date) => {
      return selectedDate && formatDateString(date) === selectedDate;
    };
    
    const isCurrentMonth = (date) => {
      return date.getMonth() === month;
    };
    
    const canSelectDate = (date) => {
      return date <= today;
    };
    
    const handleDateClick = (date) => {
      if (canSelectDate(date)) {
        onDateSelect(formatDateString(date));
        onClose();
      }
    };
    
    const goToPreviousMonth = () => {
      setCurrentMonth(new Date(year, month - 1, 1));
    };
    
    const goToNextMonth = () => {
      setCurrentMonth(new Date(year, month + 1, 1));
    };
    
    return (
      <Box p={4} minW="320px">
        <Flex justify="space-between" align="center" mb={4}>
          <IconButton
            aria-label="前の月"
            icon={<ChevronLeftIcon />}
            size="sm"
            variant="ghost"
            onClick={goToPreviousMonth}
          />
          <Text fontWeight="bold" fontSize="lg">
            {year}年{month + 1}月
          </Text>
          <IconButton
            aria-label="次の月"
            icon={<ChevronRightIcon />}
            size="sm"
            variant="ghost"
            onClick={goToNextMonth}
            isDisabled={month >= today.getMonth() && year >= today.getFullYear()}
          />
        </Flex>
        
        <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <Text key={day} textAlign="center" fontSize="sm" fontWeight="bold" color="gray.500">
              {day}
            </Text>
          ))}
        </Grid>
        
        <Grid templateColumns="repeat(7, 1fr)" gap={1}>
          {weeks.flat().map((date, index) => (
            <Button
              key={index}
              size="sm"
              variant="ghost"
              minH="32px"
              p={1}
              fontSize="sm"
              color={isCurrentMonth(date) ? 'inherit' : 'gray.400'}
              bg={
                isSelected(date) ? 'blue.500' :
                hasData(date) ? 'green.100' :
                isToday(date) ? 'blue.50' : 'transparent'
              }
              _hover={{
                bg: canSelectDate(date) ? (
                  hasData(date) ? 'green.200' : 'gray.100'
                ) : 'transparent'
              }}
              isDisabled={!canSelectDate(date)}
              onClick={() => handleDateClick(date)}
              border={hasData(date) ? '2px solid' : 'none'}
              borderColor={hasData(date) ? 'green.300' : 'transparent'}
            >
              {date.getDate()}
            </Button>
          ))}
        </Grid>
        
        <Box mt={4} p={3} bg={useColorModeValue('gray.50', 'gray.600')} borderRadius="md">
          <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')} mb={2}>
            <strong>凡例:</strong>
          </Text>
          <Flex gap={4} flexWrap="wrap">
            <Flex align="center" gap={1}>
              <Box 
                w={3} 
                h={3} 
                bg={useColorModeValue('green.100', 'green.200')} 
                border="2px solid" 
                borderColor={useColorModeValue('green.300', 'green.400')} 
                borderRadius="sm" 
              />
              <Text fontSize="xs" color={useColorModeValue('gray.700', 'gray.200')}>データあり</Text>
            </Flex>
            <Flex align="center" gap={1}>
              <Box w={3} h={3} bg={useColorModeValue('blue.50', 'blue.200')} borderRadius="sm" />
              <Text fontSize="xs" color={useColorModeValue('gray.700', 'gray.200')}>今日</Text>
            </Flex>
            <Flex align="center" gap={1}>
              <Box w={3} h={3} bg={useColorModeValue('blue.500', 'blue.400')} borderRadius="sm" />
              <Text fontSize="xs" color={useColorModeValue('gray.700', 'gray.200')}>選択中</Text>
            </Flex>
          </Flex>
        </Box>
      </Box>
    );
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
      <Box mb={{ base: 4, md: 6, lg: 8 }} display="flex" flexDirection={{ base: "column", sm: "row" }} justifyContent="space-between" alignItems={{ base: "flex-start", sm: "center" }} gap={{ base: 3, sm: 0 }}>
        <Box>
          <Heading size={{ base: "md", md: "lg" }} mb={2}>身体測定</Heading>
          <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>体組成と進捗を記録</Text>
        </Box>
        <Button colorScheme="brand" onClick={handleAddMeasurement} size={{ base: "sm", md: "md" }} w={{ base: "full", sm: "auto" }}>
          測定値を追加
        </Button>
      </Box>

      {/* Stats Cards */}
      {latestMeasurement && (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 3, md: 4, lg: 6 }} mb={{ base: 4, md: 6, lg: 8 }}>
          {/* Card 1: Current Weight */}
          <Card 
            bg={bgColor} 
            borderWidth="1px" 
            borderColor={borderColor}
            borderLeftWidth="4px"
            borderLeftColor="blue.500"
            position="relative"
            overflow="hidden"
          >
            <CardBody>
              <Flex justify="space-between" align="flex-start">
                  <Box flex="1">
                    <Text fontSize="xs" color="gray.600" mb={2}>現在の体重</Text>
                  <Text fontSize="2xl" fontWeight="bold" mb={1}>
                    {latestMeasurement.weight} kg
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {formatDate(latestMeasurement.date)}
                  </Text>
                </Box>
                <Box
                  bg="blue.100"
                  p={3}
                  borderRadius="lg"
                >
                  <Icon as={FiActivity} boxSize={6} color="blue.600" />
                </Box>
              </Flex>
            </CardBody>
          </Card>

          {/* Card 2: BMI */}
          <Card 
            bg={bgColor} 
            borderWidth="1px" 
            borderColor={borderColor}
            borderLeftWidth="4px"
            borderLeftColor="green.500"
            position="relative"
            overflow="hidden"
          >
            <CardBody>
              <Flex justify="space-between" align="flex-start">
                <Box flex="1">
                  <Text fontSize="xs" color="gray.600" mb={2}>BMI</Text>
                  <Text fontSize="2xl" fontWeight="bold" mb={1}>
                    {bmi ? bmi.toFixed(1) : '-'}
                  </Text>
                  <Badge colorScheme={bmi < 18.5 ? 'yellow' : bmi < 25 ? 'green' : bmi < 30 ? 'orange' : 'red'}>
                    {bmi < 18.5 ? '低体重' : bmi < 25 ? '標準' : bmi < 30 ? '過体重' : '肥満'}
                  </Badge>
                </Box>
                <Box
                  bg="green.100"
                  p={3}
                  borderRadius="lg"
                >
                  <Icon as={FiTrendingUp} boxSize={6} color="green.600" />
                </Box>
              </Flex>
            </CardBody>
          </Card>

          {/* Card 3: BMR */}
          <Card 
            bg={bgColor} 
            borderWidth="1px" 
            borderColor={borderColor}
            borderLeftWidth="4px"
            borderLeftColor="purple.500"
            position="relative"
            overflow="hidden"
          >
            <CardBody>
              <Flex justify="space-between" align="flex-start">
                <Box flex="1">
                  <Text fontSize="xs" color="gray.600" mb={2}>基礎代謝量</Text>
                  <Text fontSize="2xl" fontWeight="bold" mb={1}>
                    {bmr ? Math.round(bmr) : '-'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    BMR (kcal)
                  </Text>
                </Box>
                <Box
                  bg="purple.100"
                  p={3}
                  borderRadius="lg"
                >
                  <Icon as={FiZap} boxSize={6} color="purple.600" />
                </Box>
              </Flex>
            </CardBody>
          </Card>

          {/* Card 4: TDEE */}
          <Card 
            bg={bgColor} 
            borderWidth="1px" 
            borderColor={borderColor}
            borderLeftWidth="4px"
            borderLeftColor="orange.500"
            position="relative"
            overflow="hidden"
          >
            <CardBody>
              <Flex justify="space-between" align="flex-start">
                <Box flex="1">
                  <Text fontSize="xs" color="gray.600" mb={2}>1日の消費カロリー</Text>
                  <Text fontSize="2xl" fontWeight="bold" mb={1}>
                    {tdee ? Math.round(tdee) : '-'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    TDEE (kcal)
                  </Text>
                </Box>
                <Box
                  bg="orange.100"
                  p={3}
                  borderRadius="lg"
                >
                  <Icon as={FiPercent} boxSize={6} color="orange.600" />
                </Box>
              </Flex>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Weight Chart */}
      {chartData.length > 0 && (
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} mb={{ base: 4, md: 6, lg: 8 }}>
          <CardHeader>
            <Flex justify="space-between" align="center" mb={2}>
              <Heading size="md">体重の推移</Heading>
              <HStack spacing={2}>
                <Button size="xs" variant="outline" onClick={goToLatest}>
                  最新
                </Button>
                <IconButton
                  aria-label="前のデータを表示"
                  icon={<ChevronLeftIcon />}
                  size="sm"
                  variant="outline"
                  onClick={goToNext}
                  isDisabled={!canGoRight}
                />
                <IconButton
                  aria-label="次のデータを表示"
                  icon={<ChevronRightIcon />}
                  size="sm"
                  variant="outline"
                  onClick={goToPrevious}
                  isDisabled={!canGoLeft}
                />
              </HStack>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.500">
                {totalDataPoints > 0 ? 
                  `${actualStartIndex + 1}〜${endIndex}件目を表示 (全${totalDataPoints}件)` : 
                  '表示するデータがありません'
                }
              </Text>
            </Flex>
          </CardHeader>
          <CardBody px={{ base: 2, md: 4 }} py={{ base: 3, md: 4 }}>
            <Box height={{ base: "250px", md: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label, payload) => 
                      payload && payload[0] ? payload[0].payload.fullDate : label
                    }
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#4F46E5" 
                    name="体重 (kg)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  {chartData[0]?.bodyFat && (
                    <Line 
                      type="monotone" 
                      dataKey="bodyFat" 
                      stroke="#10B981" 
                      name="体脂肪率 %"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>
      )}

      {/* Measurements History */}
      <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Flex justify="space-between" align="center" mb={2}>
            <Heading size="md">測定履歴</Heading>
            {totalTableItems > tableItemsToShow && (
              <HStack spacing={2}>
                <Button size="xs" variant="outline" onClick={goToTableLatest}>
                  最新
                </Button>
                <IconButton
                  aria-label="前のデータを表示"
                  icon={<ChevronUpIcon />}
                  size="sm"
                  variant="outline"
                  onClick={goToTablePrevious}
                  isDisabled={!canGoTableLeft}
                />
                <IconButton
                  aria-label="次のデータを表示"
                  icon={<ChevronDownIcon />}
                  size="sm"
                  variant="outline"
                  onClick={goToTableNext}
                  isDisabled={!canGoTableRight}
                />
              </HStack>
            )}
          </Flex>
          {totalTableItems > 0 && (
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.500">
                {totalTableItems > 0 ? 
                  `${actualTableStartIndex + 1}〜${tableEndIndex}件目を表示 (全${totalTableItems}件)` : 
                  '表示するデータがありません'
                }
              </Text>
            </Flex>
          )}
        </CardHeader>
        <CardBody px={{ base: 0, md: 4 }} py={{ base: 2, md: 4 }}>
          {measurements.length > 0 ? (
            <>
              {/* Desktop View */}
              <Box display={{ base: "none", lg: "block" }}>
                <Table variant="simple" size="md">
                  <Thead>
                    <Tr>
                      <Th>日付</Th>
                      <Th isNumeric>体重 (kg)</Th>
                      <Th isNumeric>体脂肪率 %</Th>
                      <Th isNumeric>BMI</Th>
                      <Th isNumeric>ウエスト (cm)</Th>
                      <Th>操作</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {displayedMeasurements.map((measurement) => (
                      <Tr key={measurement.id}>
                        <Td>{formatDate(measurement.date)}</Td>
                        <Td isNumeric>{measurement.weight}</Td>
                        <Td isNumeric>{measurement.body_fat_percentage || '-'}</Td>
                        <Td isNumeric>{userHeight ? parseFloat(calculateBMI(measurement.weight, userHeight)).toFixed(1) : '-'}</Td>
                        <Td isNumeric>{measurement.waist || '-'}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="編集"
                              icon={<EditIcon />}
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleEdit(measurement)}
                            />
                            <IconButton
                              aria-label="削除"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDeleteClick(measurement.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {/* Mobile View - Card Layout */}
              <Box display={{ base: "block", lg: "none" }}>
                {displayedMeasurements.map((measurement) => (
                  <Card key={measurement.id} mb={3} size="sm" variant="outline">
                    <CardBody>
                      <Flex justify="space-between" align="flex-start" mb={3}>
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" color="brand.600">
                            {formatDate(measurement.date)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            BMI: {userHeight ? parseFloat(calculateBMI(measurement.weight, userHeight)).toFixed(1) : '-'}
                          </Text>
                        </Box>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="編集"
                            icon={<EditIcon />}
                            size="xs"
                            colorScheme="blue"
                            onClick={() => handleEdit(measurement)}
                          />
                          <IconButton
                            aria-label="削除"
                            icon={<DeleteIcon />}
                            size="xs"
                            colorScheme="red"
                            onClick={() => handleDeleteClick(measurement.id)}
                          />
                        </HStack>
                      </Flex>
                      <Grid templateColumns="repeat(2, 1fr)" gap={2} fontSize="sm">
                        <Box>
                          <Text color="gray.600" fontSize="xs">体重</Text>
                          <Text fontWeight="semibold">{measurement.weight} kg</Text>
                        </Box>
                        {measurement.body_fat_percentage && (
                          <Box>
                            <Text color="gray.600" fontSize="xs">体脂肪率</Text>
                            <Text fontWeight="semibold">{measurement.body_fat_percentage}%</Text>
                          </Box>
                        )}
                        {measurement.waist && (
                          <Box>
                            <Text color="gray.600" fontSize="xs">ウエスト</Text>
                            <Text fontWeight="semibold">{measurement.waist} cm</Text>
                          </Box>
                        )}
                      </Grid>
                    </CardBody>
                  </Card>
                ))}
              </Box>
            </>
          ) : (
            <Center py={8}>
              <Text color="gray.500">まだ測定値がありません。最初の測定値を追加しましょう！</Text>
            </Center>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Measurement Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>{editingId ? '測定値を編集' : '新しい測定値を追加'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>日付</FormLabel>
                  <Popover>
                    <PopoverTrigger>
                      <Button
                        variant="outline"
                        w="100%"
                        justifyContent="flex-start"
                        leftIcon={<CalendarIcon />}
                        isReadOnly={!!editingId}
                        bg={useColorModeValue(
                          editingId ? 'gray.100' : 'white',
                          editingId ? 'gray.600' : 'gray.700'
                        )}
                        borderColor={useColorModeValue('gray.200', 'gray.600')}
                        color={useColorModeValue(
                          formData.date ? 'gray.800' : 'gray.500',
                          formData.date ? 'white' : 'gray.400'
                        )}
                        _hover={editingId ? {} : {
                          bg: useColorModeValue('gray.50', 'gray.600'),
                          borderColor: useColorModeValue('gray.300', 'gray.500')
                        }}
                        _focus={editingId ? {} : {
                          borderColor: useColorModeValue('blue.500', 'blue.300'),
                          boxShadow: `0 0 0 1px ${useColorModeValue('#3182ce', '#63b3ed')}`
                        }}
                        cursor={editingId ? 'not-allowed' : 'pointer'}
                        isDisabled={!!editingId}
                      >
                        {formData.date ? formatDate(formData.date) : '日付を選択'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverArrow />
                      <PopoverBody p={0}>
                        <CustomCalendar
                          selectedDate={formData.date}
                          onDateSelect={(date) => setFormData({ ...formData, date })}
                          onClose={() => {}}
                        />
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>体重 (kg)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder={placeholders.weight}
                    onKeyPress={(e) => {
                      if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>体脂肪率 %</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="body_fat_percentage"
                    value={formData.body_fat_percentage}
                    onChange={handleChange}
                    placeholder={placeholders.body_fat_percentage}
                    onKeyPress={(e) => {
                      if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>胸囲 (cm)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="chest"
                    value={formData.chest}
                    onChange={handleChange}
                    placeholder={placeholders.chest}
                    onKeyPress={(e) => {
                      if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>ウエスト (cm)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="waist"
                    value={formData.waist}
                    onChange={handleChange}
                    placeholder={placeholders.waist}
                    onKeyPress={(e) => {
                      if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>ヒップ (cm)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="hips"
                    value={formData.hips}
                    onChange={handleChange}
                    placeholder={placeholders.hips}
                    onKeyPress={(e) => {
                      if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>腕周り (cm)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="arms"
                    value={formData.arms}
                    onChange={handleChange}
                    placeholder={placeholders.arms}
                    onKeyPress={(e) => {
                      if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>太もも (cm)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="thighs"
                    value={formData.thighs}
                    onChange={handleChange}
                    placeholder={placeholders.thighs}
                    onKeyPress={(e) => {
                      if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>ふくらはぎ (cm)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="calves"
                    value={formData.calves}
                    onChange={handleChange}
                    placeholder={placeholders.calves}
                    onKeyPress={(e) => {
                      if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>
              </Grid>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleModalClose}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                {editingId ? '更新' : '追加'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              測定値を削除
            </AlertDialogHeader>

            <AlertDialogBody>
              この測定値を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                削除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Measurements;

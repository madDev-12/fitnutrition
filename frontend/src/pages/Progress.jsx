import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  SimpleGrid,
  useColorModeValue,
  VStack,
  Heading,
  Icon,
  Flex,
  Input,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Center,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatGroup,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  Progress as ChakraProgress,
  useToken,
} from '@chakra-ui/react';
import { Link as RouterLink, Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiTarget, FiCheckCircle, FiDownload } from 'react-icons/fi';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import analyticsService from '../services/analytics';
import measurementsService from '../services/measurements';
import { formatDate } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';

const GoalProgressCard = ({ title, currentValue, targetValue, unit, icon, colorScheme }) => {
  const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  const remaining = targetValue - currentValue;

  return (
    <Box p={5} borderWidth="1px" borderRadius="xl" boxShadow="sm">
      <HStack justify="space-between" mb={3}>
        <Text fontSize="md" fontWeight="bold">{title}</Text>
        <Icon as={icon} boxSize={6} color={`${colorScheme}.500`} />
      </HStack>
      <VStack align="start" spacing={2}>
        <Text fontSize="2xl" fontWeight="bold" color={`${colorScheme}.500`}>
          {currentValue || '0'} <Text as="span" fontSize="lg" fontWeight="medium">{unit}</Text>
        </Text>
        <Text fontSize="sm" color="gray.500">
          目標: {targetValue || '未設定'} {unit}
        </Text>
        <Box w="full">
          <ChakraProgress 
            value={progress} 
            size="sm" 
            colorScheme={colorScheme} 
            borderRadius="full" 
            mb={1}
          />
          <Text fontSize="xs" color="gray.500" textAlign="right">
            {progress.toFixed(0)}% 達成
          </Text>
        </Box>
        {targetValue && (
          <Text fontSize="sm" color="gray.600">
            {remaining > 0 ? `残り ${remaining.toFixed(1)} ${unit}` : '目標達成!'}
          </Text>
        )}
      </VStack>
    </Box>
  );
};


const Progress = () => {
  const toast = useToast();
  const [progressData, setProgressData] = useState(null);
  const [latestMeasurement, setLatestMeasurement] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Date range state
  const getDefaultEndDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const getDefaultStartDate = () => {
    const today = new Date();
    const AWeeksAgo = new Date(today);
    AWeeksAgo.setDate(today.getDate() - 7);
    return AWeeksAgo.toISOString().split('T')[0];
    
    // const thirtyDaysAgo = new Date(today);
    // thirtyDaysAgo.setDate(today.getDate() - 30);
    // return thirtyDaysAgo.toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  
  const [selectedMealPlan, setSelectedMealPlan] = useState(() => {
    const saved = localStorage.getItem('selectedMealPlan');
    return saved ? JSON.parse(saved) : null;
  });

  const [tooltipBg, tooltipBorder] = useToken(
    'colors',
    useColorModeValue(['gray.100', 'gray.200'], ['gray.700', 'gray.600'])
  );

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    loadProgressData();
    loadLatestMeasurement();
  }, []);

  // Listen for changes to selected meal plan in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('selectedMealPlan');
      setSelectedMealPlan(saved ? JSON.parse(saved) : null);
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case change happened in same tab
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadLatestMeasurement = async () => {
    try {
      const measurementResponse = await measurementsService.getLatestMeasurement();
      const data = measurementResponse.data || measurementResponse;
      setLatestMeasurement(data);
    } catch (error) {
      console.error('Error loading latest measurement:', error);
      setLatestMeasurement(null);
    }
  };

  const loadProgressData = async () => {
    // Validate dates
    if (!startDate || !endDate) {
      toast({
        title: 'エラー',
        description: '開始日と終了日を入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: 'エラー',
        description: '開始日は終了日より前である必要があります',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoading(true);
      const data = await analyticsService.getProgress({ 
        start_date: startDate,
        end_date: endDate
      });
      console.log('Progress data received:', data); // Debug log
      setProgressData(data);
    } catch (error) {
      console.error('Progress data error:', error); // Debug log
      toast({
        title: '進捗データ読み込みエラー',
        description: error.response?.data?.detail || 'データの読み込みに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleApplyDateRange = () => {
    loadProgressData();
  };

  const exportData = (format) => {
    if (!progressData) {
      toast({
        title: 'エクスポート失敗',
        description: 'エクスポートするデータがありません。',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const fileName = `progress_report_${startDate}_to_${endDate}`;
    
    // Generate daily data based on start and end date
    const generateDailyData = () => {
      const dailyData = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Create a map for quick lookup of existing data
      const weightMap = new Map();
      const bodyFatMap = new Map();
      const calorieMap = new Map();
      const exerciseMap = new Map();
      
      // Populate maps with existing data
      progressData?.weight_history?.forEach(item => {
        weightMap.set(item.date, item.weight);
      });
      
      progressData?.body_fat_history?.forEach(item => {
        bodyFatMap.set(item.date, item.body_fat_percentage);
      });
      
      progressData?.calorie_trends?.forEach(item => {
        calorieMap.set(item.date, { intake: item.intake || 0, burned: item.burned || 0 });
      });
      
      // Create exercise type string (this would be daily if we had daily exercise data)
      const exerciseTypes = progressData?.exercise_types?.map(ex => ex.name).join(', ') || '';
      
      // Generate data for each day in the range
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const formattedDate = formatDate(dateStr);
        
        // Get current weight and weight change (compared to previous day if available)
        const currentWeight = weightMap.get(dateStr);
        let weightChange = 0;
        if (currentWeight) {
          // Find previous weight data
          const previousDate = new Date(date);
          previousDate.setDate(previousDate.getDate() - 1);
          const prevDateStr = previousDate.toISOString().split('T')[0];
          const previousWeight = weightMap.get(prevDateStr);
          if (previousWeight) {
            weightChange = currentWeight - previousWeight;
          }
        }
        
        // Get body fat change (compared to previous day if available)
        const currentBodyFat = bodyFatMap.get(dateStr);
        let bodyFatChange = 0;
        if (currentBodyFat) {
          const previousDate = new Date(date);
          previousDate.setDate(previousDate.getDate() - 1);
          const prevDateStr = previousDate.toISOString().split('T')[0];
          const previousBodyFat = bodyFatMap.get(prevDateStr);
          if (previousBodyFat) {
            bodyFatChange = currentBodyFat - previousBodyFat;
          }
        }
        
        const calorieData = calorieMap.get(dateStr);
        
        dailyData.push({
          '日時': formattedDate,
          '現体重': currentWeight ? currentWeight.toFixed(1) + ' kg' : '',
          '体重変化': weightChange ? weightChange.toFixed(2) + ' kg' : '',
          '体脂肪率': currentBodyFat ? currentBodyFat.toFixed(1) + ' %' : '',
          '体脂肪率変化': bodyFatChange ? bodyFatChange.toFixed(1) + ' %' : '',
          'エクササイズタイプ': exerciseTypes,
          '摂取カロリー': calorieData?.intake || '',
          '消費カロリー': calorieData?.burned || ''
        });
      }
      
      return dailyData;
    };

    const dailyProgressData = generateDailyData();

    if (format === 'csv' || format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      
      // Main progress data sheet
      const progressWs = XLSX.utils.json_to_sheet(dailyProgressData);
      XLSX.utils.book_append_sheet(wb, progressWs, '進捗データ');

      if (format === 'xlsx') {
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else {
        // Export as CSV
        const csvOutput = XLSX.utils.sheet_to_csv(progressWs);
        const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${fileName}.csv`);
      }
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('進捗レポート', 14, 16);
      doc.setFontSize(10);
      doc.text(`期間: ${startDate} から ${endDate}`, 14, 22);

      // Progress Data Table
      doc.autoTable({
        startY: 30,
        head: [['日時', '現体重', '体重変化', '体脂肪率', '体脂肪率変化', 'エクササイズタイプ', '摂取カロリー', '消費カロリー']],
        body: dailyProgressData.map(item => [
          item['日時'],
          item['現体重'],
          item['体重変化'],
          item['体脂肪率'],
          item['体脂肪率変化'],
          item['エクササイズタイプ'],
          item['摂取カロリー'],
          item['消費カロリー']
        ]),
        theme: 'grid',
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 18 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 20 },
          5: { cellWidth: 30 },
          6: { cellWidth: 18 },
          7: { cellWidth: 18 }
        }
      });

      doc.save(`${fileName}.pdf`);
    }
  };

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  if (!progressData) {
    return (
      <Box>
        <Heading size="lg" mb={4}>進捗追跡</Heading>
        <Center h="400px" flexDirection="column">
          <Text fontSize="lg" color="gray.600" mb={4}>
            進捗データを読み込めませんでした
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            体重や体脂肪率、ワークアウト、栄養データが必要です。<br/>
            まずはこれらのデータを登録してください。
          </Text>
        </Center>
      </Box>
    );
  }

  // Format date for chart (more compact)
  const formatChartDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric' 
    });
  };

  // Prepare chart data with fallbacks
  const weightData = progressData?.weight_history?.map(item => ({
    date: formatChartDate(item.date),
    fullDate: formatDate(item.date),
    weight: item.weight,
  })) || [];

  const bodyFatData = progressData?.body_fat_history?.map(item => ({
    date: formatChartDate(item.date),
    fullDate: formatDate(item.date),
    bodyFat: item.body_fat_percentage,
  })) || [];

  const exerciseTypeData = progressData?.exercise_types || [];

  const calorieData = progressData?.calorie_trends?.map(item => ({
    date: formatChartDate(item.date),
    fullDate: formatDate(item.date),
    intake: item.intake || 0,
    burned: item.burned || 0,
  })) || [];

  // Calculate Y-axis domains for better visualization
  const getYAxisDomain = (data, dataKey, padding = 20) => {
    if (data.length === 0) return [0, 100];
    const values = data.map(item => item[dataKey]).filter(val => val != null);
    if (values.length === 0) return [0, 100];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const paddingValue = range > 0 ? range * 0.3 : padding; // 30% padding
    return [
      Math.max(0, Math.floor(min - paddingValue)),
      Math.ceil(max + paddingValue)
    ];
  };

  const weightDomain = getYAxisDomain(weightData, 'weight');
  const bodyFatDomain = getYAxisDomain(bodyFatData, 'bodyFat');
  
  // Calculate domain for calorie chart (both intake and burned)
  const getCalorieDomain = () => {
    if (calorieData.length === 0) return [0, 3000];
    const allValues = calorieData.flatMap(item => [item.intake, item.burned]).filter(val => val > 0);
    if (allValues.length === 0) return [0, 3000];
    const max = Math.max(...allValues);
    return [0, Math.ceil(max * 1.2)];
  };
  const calorieDomain = getCalorieDomain();

  // Colors for pie chart
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Calculate total calories from calorie data
  const totalCaloriesIntake = calorieData.reduce((sum, item) => sum + (item.intake || 0), 0);
  const totalCaloriesBurned = calorieData.reduce((sum, item) => sum + (item.burned || 0), 0);

  console.log('Chart data prepared:', { weightData, bodyFatData, exerciseTypeData, calorieData }); // Debug log
  console.log('Progress data full:', progressData); // Debug log

  return (
    <Box>
      {/* Header */}
      <Box mb={{ base: 4, md: 6, lg: 8 }}>
        <Box mb={4}>
          <Heading size={{ base: "sm", md: "md" }} mb={2}>進捗追跡</Heading>
          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">フィットネスの進捗と達成状況を確認</Text>
        </Box>
        
        {/* Date Range Picker & Export */}
        <Flex 
          direction={{ base: "column", md: "row" }} 
          gap={4} 
          alignItems={{ base: "stretch", md: "center" }}
          p={4}
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          boxShadow="sm"
        >
          <HStack spacing={3} flex="1" flexWrap={{ base: "wrap", sm: "nowrap" }}>
            <Box flex="1" minW="150px">
              <Text fontSize="sm" mb={1} fontWeight="medium">開始日</Text>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size={{ base: "sm", md: "md" }}
              />
            </Box>
            <Text pt={{ base: 0, sm: 6 }} fontSize="lg" fontWeight="bold">〜</Text>
            <Box flex="1" minW="150px">
              <Text fontSize="sm" mb={1} fontWeight="medium">終了日</Text>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size={{ base: "sm", md: "md" }}
              />
            </Box>
          </HStack>
          <HStack mt={{ base: 3, md: 0 }} spacing={3}>
            <Button
              colorScheme="brand"
              onClick={handleApplyDateRange}
              size={{ base: "sm", md: "md" }}
              mt={{ base: 2, sm: 6 }}
              minW="100px"
            >
              適用
            </Button>
            <Menu>
              <MenuButton 
                as={Button} 
                rightIcon={<FiDownload />} 
                colorScheme="gray" 
                variant="outline"
                size={{ base: "sm", md: "md" }}
                mt={{ base: 2, sm: 6 }}
              >
                エクスポート
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => exportData('csv')}>CSV</MenuItem>
                <MenuItem onClick={() => exportData('xlsx')}>Excel</MenuItem>
                <MenuItem onClick={() => exportData('pdf')}>PDF</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Summary Stats */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 3, md: 4, lg: 6 }} mb={{ base: 4, md: 6, lg: 8 }}>
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>体重変化</StatLabel>
              <StatNumber>{progressData?.weight_change?.toFixed(1) || 0} kg</StatNumber>
              <StatHelpText>
                {progressData?.weight_change && (
                  <StatArrow 
                    type={progressData.weight_change < 0 ? 'decrease' : 'increase'} 
                    color={progressData.weight_change < 0 ? 'green.500' : 'red.500'}
                  />
                )}
                期間内
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>体脂肪率変化</StatLabel>
              <StatNumber>{progressData?.body_fat_change?.toFixed(1) || 0}%</StatNumber>
              <StatHelpText>
                {progressData?.body_fat_change && (
                  <StatArrow 
                    type={progressData.body_fat_change < 0 ? 'decrease' : 'increase'} 
                    color={progressData.body_fat_change < 0 ? 'green.500' : 'red.500'}
                  />
                )}
                期間内
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>総ワークアウト数</StatLabel>
              <StatNumber>{progressData?.total_workouts || 0}</StatNumber>
              <StatHelpText>
                継続率 {progressData?.workout_consistency || 0}%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>総摂取カロリー vs 総消費カロリー</StatLabel>
              <StatNumber>
                {totalCaloriesIntake} vs {totalCaloriesBurned}
              </StatNumber>
              <StatHelpText>
                {totalCaloriesIntake - totalCaloriesBurned > 0 ? (
                  <StatArrow type='increase' color='red.500' />
                ) : (
                  <StatArrow type='decrease' color='green.500' />
                )}
                差: {Math.abs(totalCaloriesIntake - totalCaloriesBurned)} kcal
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Goals Section */}
      <Box mb={{ base: 4, md: 6, lg: 8 }}>
        <Heading size="md" mb={4}>目標の進捗</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 4, lg: 6 }}>
          <GoalProgressCard
            title="体重目標"
            // currentValue={latestMeasurement?.weight || progressData?.current_weight}
            currentValue={progressData?.current_weight}
            targetValue={progressData?.weight_goal}
            unit="kg"
            icon={FiTrendingUp}
            colorScheme="brand"
          />
          <GoalProgressCard
            title="体脂肪率目標"
            // currentValue={latestMeasurement?.body_fat_percentage || progressData?.current_body_fat}
            currentValue={progressData?.current_body_fat}
            targetValue={progressData?.body_fat_goal}
            unit="%"
            icon={FiTarget}
            colorScheme="orange"
          />
          <GoalProgressCard
            title="週間ワークアウト目標"
            currentValue={progressData?.total_workouts}
            targetValue={progressData?.workout_goal}
            unit="回"
            icon={FiCheckCircle}
            colorScheme="purple"
          />
        </SimpleGrid>
        {!progressData?.workout_goal && (
          <Link as={RouterLink} to="/workouts" state={{ tab: 2 }} style={{ textDecoration: 'none' }}>
            <Flex 
              mt={4} 
              p={4} 
              bg="orange.100" 
              borderRadius="lg" 
              align="center"
              border="1px"
              borderColor="orange.200"
              transition="background-color 0.2s"
              _hover={{ bg: "orange.200", cursor: "pointer" }}
            >
              <Icon as={FiTarget} color="orange.600" mr={4} boxSize={6} />
              <Box>
                <Text fontSize="md" color="orange.800" fontWeight="bold">
                  ワークアウトプランが選択されていません
                </Text>
                <Text fontSize="sm" color="orange.700">
                  こちらをクリックしてプランを選択し、目標を設定しましょう。
                </Text>
              </Box>
            </Flex>
          </Link>
        )}
      </Box>

      {/* Charts */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={{ base: 3, md: 4, lg: 6 }} mb={{ base: 4, md: 6, lg: 8 }}>
        {/* Weight Progress */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">体重の推移</Heading>
          </CardHeader>
          <CardBody px={{ base: 2, md: 4 }} py={{ base: 3, md: 4 }}>
            {weightData.length > 0 ? (
              <Box height={{ base: "250px", md: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData} margin={{ bottom: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      ticks={weightData.length > 10 ? [
                        weightData[0].date,
                        weightData[Math.floor((weightData.length - 1) / 2)].date,
                        weightData[weightData.length - 1].date
                      ] : undefined}
                      interval={weightData.length > 10 ? 0 : 0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={weightDomain} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`
                      }}
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label, payload) => 
                        payload && payload[0] ? payload[0].payload.fullDate : label
                      }
                    />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#4F46E5" name="体重 (kg)" strokeWidth={2} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Center h="300px">
                <Text color="gray.500">体重データがありません</Text>
              </Center>
            )}
          </CardBody>
        </Card>

        {/* Body Fat Progress */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">体脂肪率</Heading>
          </CardHeader>
          <CardBody px={{ base: 2, md: 4 }} py={{ base: 3, md: 4 }}>
            {bodyFatData.length > 0 ? (
              <Box height={{ base: "250px", md: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyFatData} margin={{ bottom: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      ticks={bodyFatData.length > 10 ? [
                        bodyFatData[0].date,
                        bodyFatData[Math.floor((bodyFatData.length - 1) / 2)].date,
                        bodyFatData[bodyFatData.length - 1].date
                      ] : undefined}
                      interval={bodyFatData.length > 10 ? 0 : 0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={bodyFatDomain} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`
                      }}
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label, payload) => 
                        payload && payload[0] ? payload[0].payload.fullDate : label
                      }
                    />
                    <Legend />
                    <Line type="monotone" dataKey="bodyFat" stroke="#F59E0B" name="体脂肪率 %" strokeWidth={2} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Center h="300px">
                <Text color="gray.500">体脂肪データがありません</Text>
              </Center>
            )}
          </CardBody>
        </Card>

        {/* Exercise Type Distribution */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">エクササイズタイプ</Heading>
          </CardHeader>
          <CardBody px={{ base: 2, md: 4 }} py={{ base: 3, md: 4 }}>
            {exerciseTypeData.length > 0 ? (
              <Box height={{ base: "250px", md: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={exerciseTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {exerciseTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`
                      }}
                      itemStyle={{ color: useColorModeValue('black', 'white') }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Center h="300px" flexDirection="column">
                <Text color="gray.500" mb={2}>エクササイズデータがありません</Text>
              </Center>
            )}
          </CardBody>
        </Card>

        {/* Calorie Intake vs Burned */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">摂取カロリー 対 消費カロリー</Heading>
          </CardHeader>
          <CardBody px={{ base: 2, md: 4 }} py={{ base: 3, md: 4 }}>
            {calorieData.length > 0 ? (
              <Box height={{ base: "250px", md: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calorieData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      ticks={calorieData.length > 10 ? [
                        calorieData[0].date,
                        calorieData[Math.floor((calorieData.length - 1) / 2)].date,
                        calorieData[calorieData.length - 1].date
                      ] : undefined}
                      interval={calorieData.length > 10 ? 0 : 0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={calorieDomain} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`
                      }}
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label, payload) => 
                        payload && payload[0] ? payload[0].payload.fullDate : label
                      }
                    />
                    <Legend />
                    <Bar dataKey="intake" fill="#EF4444" name="摂取カロリー" />
                    <Bar dataKey="burned" fill="#3B82F6" name="消費カロリー" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Center h="300px">
                <Text color="gray.500">カロリーデータがありません</Text>
              </Center>
            )}
          </CardBody>
        </Card>
      </Grid>
    </Box>
  );
};

export default Progress;
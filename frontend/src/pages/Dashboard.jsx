import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  useColorModeValue,
  Spinner,
  Center,
  VStack,
  HStack,
  Icon,
  Button,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Stat as ChakraStat,
  StatLabel as ChakraStatLabel,
  StatNumber as ChakraStatNumber,
} from '@chakra-ui/react';
import { FiActivity, FiTrendingDown, FiTrendingUp, FiTarget, FiCalendar, FiZap, FiPercent, FiMinus, FiPieChart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import analyticsService from '../services/analytics';
import measurementsService from '../services/measurements';
import nutritionService from '../services/nutrition';
import workoutsService from '../services/workouts';
import { formatDate, calculateBMI } from '../utils/helpers';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// Helper function to generate 7-day date range with today in the center
const generateSevenDayRange = () => {
  const dates = [];
  const today = new Date();
  
  // Create dates from 3 days ago to 3 days from now
  for (let i = -3; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

// Helper function to format date for display
const formatDayDisplay = (date) => {
  const today = new Date();
  //const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
  
  // if (diffDays === 0) return '今日';
  // if (diffDays === -1) return '昨日';
  // if (diffDays === 1) return '明日';
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
};

// Nutrition Modal Component
const NutritionModal = ({ isOpen, onClose, selectedDate, mealData, planData, formatDayDisplay }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  if (!selectedDate) return null;
  
  // Calculate actual nutrition from meals
  const actualNutrition = {
    calories: mealData?.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) || 0,
    protein: mealData?.reduce((sum, meal) => sum + (meal.total_protein || 0), 0) || 0,
    carbs: mealData?.reduce((sum, meal) => sum + (meal.total_carbs || 0), 0) || 0,
    fat: mealData?.reduce((sum, meal) => sum + (meal.total_fat || 0), 0) || 0
  };
  
  // Get plan nutrition
  // Debug: log plan data structure
  console.log('Plan data in modal:', planData);
  
  const planNutrition = {
    calories: planData?.daily_calories || 0,
    protein: planData?.daily_protein || planData?.protein || 0,
    carbs: planData?.daily_carbs || planData?.carbs || planData?.carbohydrates || 0,
    fat: planData?.daily_fat || planData?.fat || planData?.fats || 0
  };
  
  // If individual macros are not available but calories are, calculate estimated breakdown
  if (planNutrition.calories > 0 && 
      planNutrition.protein === 0 && 
      planNutrition.carbs === 0 && 
      planNutrition.fat === 0) {
    // Use general macro distribution: 25% protein, 45% carbs, 30% fat
    const proteinCalories = planNutrition.calories * 0.25;
    const carbsCalories = planNutrition.calories * 0.45;
    const fatCalories = planNutrition.calories * 0.30;
    
    planNutrition.protein = proteinCalories / 4; // 4 kcal per gram of protein
    planNutrition.carbs = carbsCalories / 4;     // 4 kcal per gram of carbs
    planNutrition.fat = fatCalories / 9;         // 9 kcal per gram of fat
  }
  
  console.log('Calculated plan nutrition:', planNutrition);
  
  // Create comparison chart data combining actual vs plan
  const comparisonChartData = {
    labels: ['タンパク質', '炭水化物', '脂質'],
    datasets: [
      {
        label: '実際の摂取量',
        data: [actualNutrition.protein, actualNutrition.carbs, actualNutrition.fat],
        backgroundColor: [
          '#3182CE', // Blue for protein
          '#38A169', // Green for carbs  
          '#D69E2E'  // Orange for fat
        ],
        borderWidth: 2,
        borderColor: useColorModeValue('#fff', '#1A202C')
      },
      {
        label: 'プラン目標値',
        data: [planNutrition.protein, planNutrition.carbs, planNutrition.fat],
        backgroundColor: [
          '#63B3ED', // Lighter blue for protein
          '#68D391', // Lighter green for carbs  
          '#F6E05E'  // Lighter yellow for fat
        ],
        borderWidth: 2,
        borderColor: useColorModeValue('#fff', '#1A202C'),
        borderDash: [5, 5] // Dashed border for plan values
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          fontSize: 12,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label || '';
            const label = context.label || '';
            const value = Math.round(context.raw);
            return `${datasetLabel} - ${label}: ${value} kcal`;
          }
        }
      }
    },
    cutout: '50%'
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent 
        bg={bgColor} 
        borderColor={borderColor}
        borderRadius="2xl"
        shadow="2xl"
        maxH="95vh"
        overflow="auto"
      >
        <ModalHeader 
          bg={useColorModeValue('gradient.50', 'gray.800')} 
          borderBottomWidth="1px" 
          borderColor={useColorModeValue('gray.100', 'gray.700')}
          py={6}
        >
          <VStack spacing={3} align="start">
            <HStack spacing={4}>
              <Box p={2} bg="green.100" borderRadius="lg">
                <Icon as={FiPieChart} color="green.600" boxSize={6} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  栄養分析レポート
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {formatDayDisplay(selectedDate)} の詳細比較
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody p={0} overflowY="auto">
          {planData ? (
            <VStack spacing={0} align="stretch">
              {/* Main Content Area */}
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={0} minH="300px">
                {/* Chart Section */}
                <Box p={6} bg={useColorModeValue('gray.50', 'gray.900')}>
                  <VStack spacing={4} h="full">
                    <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                      📊 栄養バランス比較
                    </Text>
                    <Box flex="1" w="full" maxH="280px" position="relative">
                      {(actualNutrition.calories > 0 || planNutrition.calories > 0) ? (
                        <Doughnut data={comparisonChartData} options={chartOptions} />
                      ) : (
                        <Center h="full">
                          <VStack spacing={3}>
                            <Icon as={FiPieChart} boxSize={20} color="gray.300" />
                            <Text color="gray.500" fontSize="sm">データがありません</Text>
                          </VStack>
                        </Center>
                      )}
                    </Box>
                  </VStack>
                </Box>
                
                {/* Progress Section */}
                <Box p={6} bg={useColorModeValue('gray.50', 'gray.900')}>
                  <VStack spacing={6} h="full">
                    <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                      🎯 目標達成度
                    </Text>
                    
                    {/* Calories Progress */}
                    <Box w="full" p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="xl" shadow="sm">
                      <VStack spacing={3}>
                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm" fontWeight="bold">総カロリー</Text>
                          <Badge 
                            colorScheme={actualNutrition.calories <= planNutrition.calories ? "green" : "red"}
                            fontSize="sm" px={3} py={1}
                          >
                            {planNutrition.calories > 0 ? Math.round((actualNutrition.calories / planNutrition.calories) * 100) : 0}%
                          </Badge>
                        </HStack>
                        <Box w="full">
                          <Progress 
                            value={planNutrition.calories > 0 ? Math.min((actualNutrition.calories / planNutrition.calories) * 100, 100) : 0}
                            colorScheme={actualNutrition.calories <= planNutrition.calories ? "green" : "red"}
                            size="lg"
                            borderRadius="full"
                          />
                        </Box>
                        <HStack justify="space-between" w="full" fontSize="sm">
                          <Text color="green.600" fontWeight="semibold">
                            {actualNutrition.calories.toLocaleString()} kcal
                          </Text>
                          <Text color="gray.500">目標</Text>
                          <Text color="purple.600" fontWeight="semibold">
                            {planNutrition.calories.toLocaleString()} kcal
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>
                    
                    {/* Macronutrients Progress */}
                    <VStack spacing={4} w="full">
                      {/* Protein */}
                      <Box w="full" p={3} bg={useColorModeValue('white', 'gray.700')} borderRadius="lg">
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="sm" fontWeight="semibold" color="blue.700">🥩 タンパク質</Text>
                          <Text fontSize="sm" color="blue.600" fontWeight="bold">
                            {actualNutrition.protein.toFixed(1)}g / {planNutrition.protein.toFixed(1)}g
                          </Text>
                        </HStack>
                        <Progress 
                          value={planNutrition.protein > 0 ? Math.min((actualNutrition.protein / planNutrition.protein) * 100, 100) : 0}
                          colorScheme={actualNutrition.protein <= planNutrition.protein ? "blue" : "orange"}
                          size="sm"
                          borderRadius="full"
                        />
                      </Box>
                      
                      {/* Carbohydrates */}
                      <Box w="full" p={3} bg={useColorModeValue('white', 'gray.700')} borderRadius="lg">
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="sm" fontWeight="semibold" color="green.700">🌾 炭水化物</Text>
                          <Text fontSize="sm" color="green.600" fontWeight="bold">
                            {actualNutrition.carbs.toFixed(1)}g / {planNutrition.carbs.toFixed(1)}g
                          </Text>
                        </HStack>
                        <Progress 
                          value={planNutrition.carbs > 0 ? Math.min((actualNutrition.carbs / planNutrition.carbs) * 100, 100) : 0}
                          colorScheme={actualNutrition.carbs <= planNutrition.carbs ? "green" : "orange"}
                          size="sm"
                          borderRadius="full"
                        />
                      </Box>
                      
                      {/* Fat */}
                      <Box w="full" p={3} bg={useColorModeValue('white', 'gray.700')} borderRadius="lg">
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="sm" fontWeight="semibold" color="orange.700">🧈 脂質</Text>
                          <Text fontSize="sm" color="orange.600" fontWeight="bold">
                            {actualNutrition.fat.toFixed(1)}g / {planNutrition.fat.toFixed(1)}g
                          </Text>
                        </HStack>
                        <Progress 
                          value={planNutrition.fat > 0 ? Math.min((actualNutrition.fat / planNutrition.fat) * 100, 100) : 0}
                          colorScheme={actualNutrition.fat <= planNutrition.fat ? "orange" : "red"}
                          size="sm"
                          borderRadius="full"
                        />
                      </Box>
                    </VStack>
                  </VStack>
                </Box>
              </SimpleGrid>
            </VStack>
          ) : (
            <Center py={20}>
              <VStack spacing={4}>
                <Icon as={FiTarget} boxSize={16} color="gray.300" />
                <VStack spacing={2} textAlign="center">
                  <Text color="gray.500" fontSize="lg" fontWeight="medium">
                    この日のプランが設定されていません
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    栄養プランを設定すると詳細な比較ができます
                  </Text>
                </VStack>
              </VStack>
            </Center>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Workout Modal Component
const WorkoutModal = ({ isOpen, onClose, selectedDate, workoutData, formatDayDisplay }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  if (!selectedDate) return null;
  
  // Calculate total calories and duration from workouts
  const totalCalories = workoutData?.reduce((sum, workout) => sum + (workout.total_calories_burned || 0), 0) || 0;
  const totalDuration = workoutData?.reduce((sum, workout) => sum + (workout.duration_minutes || 0), 0) || 0;
  const completedWorkouts = workoutData?.filter(w => w.status === 'completed').length || 0;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent 
        bg={bgColor} 
        borderColor={borderColor}
        borderRadius="2xl"
        shadow="2xl"
        maxH="95vh"
        overflow="auto"
      >
        <ModalHeader 
          bg={useColorModeValue('gradient.50', 'gray.800')} 
          borderBottomWidth="1px" 
          borderColor={useColorModeValue('gray.100', 'gray.700')}
          py={6}
        >
          <VStack spacing={3} align="start">
            <HStack spacing={4}>
              <Box p={2} bg="purple.100" borderRadius="lg">
                <Icon as={FiActivity} color="purple.600" boxSize={6} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  ワークアウト分析レポート
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {formatDayDisplay(selectedDate)} の詳細情報
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody p={6}>
          {workoutData && workoutData.length > 0 ? (
            <VStack spacing={6} align="stretch">
              {/* Summary Cards */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Box p={4} bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="xl">
                  <VStack spacing={2}>
                    <Icon as={FiZap} boxSize={8} color="purple.600" />
                    <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                      {Math.round(totalCalories).toLocaleString()}
                    </Text>
                    <Text fontSize="sm" color="gray.600">消費カロリー (kcal)</Text>
                  </VStack>
                </Box>
                
                <Box p={4} bg={useColorModeValue('blue.50', 'blue.900')} borderRadius="xl">
                  <VStack spacing={2}>
                    <Icon as={FiCalendar} boxSize={8} color="blue.600" />
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {totalDuration}
                    </Text>
                    <Text fontSize="sm" color="gray.600">総運動時間 (分)</Text>
                  </VStack>
                </Box>
                
                <Box p={4} bg={useColorModeValue('green.50', 'green.900')} borderRadius="xl">
                  <VStack spacing={2}>
                    <Icon as={FiTarget} boxSize={8} color="green.600" />
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {completedWorkouts}
                    </Text>
                    <Text fontSize="sm" color="gray.600">完了ワークアウト</Text>
                  </VStack>
                </Box>
              </SimpleGrid>
              
              {/* Workout List */}
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.700">
                  📋 ワークアウト詳細
                </Text>
                <VStack spacing={3}>
                  {workoutData.map((workout, index) => (
                    <Box 
                      key={index} 
                      p={4} 
                      bg={useColorModeValue('white', 'gray.700')} 
                      borderRadius="lg" 
                      borderWidth="1px" 
                      borderColor={borderColor}
                      w="full"
                      shadow="sm"
                    >
                      <Flex justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" fontSize="md">
                            {workout.name || 'ワークアウト'}
                          </Text>
                        </VStack>
                        <Badge 
                          colorScheme={workout.status === 'completed' ? 'green' : 'orange'}
                          size="sm"
                        >
                          {workout.status === 'completed' ? '完了' : '進行中'}
                        </Badge>
                      </Flex>
                      
                      {/* Enhanced Exercise Display with exercise_checks data */}
                      {(() => {
                        let exercises = [];
                        
                        // Parse exercise_checks if it exists
                        if (workout.exercise_checks) {
                          try {
                            let parsedData;
                            if (typeof workout.exercise_checks === 'string') {
                              parsedData = JSON.parse(workout.exercise_checks);
                            } else {
                              parsedData = workout.exercise_checks;
                            }
                            
                            console.log('🔍 Exercise Checks Data:', {
                              workoutName: workout.name || 'Unknown',
                              rawData: workout.exercise_checks,
                              parsedData: parsedData,
                              dataType: typeof parsedData,
                              isArray: Array.isArray(parsedData)
                            });
                            
                            // Handle both object and array formats
                            if (Array.isArray(parsedData)) {
                              exercises = parsedData;
                              console.log('✅ Data is array format');
                            } else if (typeof parsedData === 'object' && parsedData !== null) {
                              // Convert object to array using Object.values()
                              exercises = Object.values(parsedData);
                              console.log('🔄 Converting object to array:', {
                                objectKeys: Object.keys(parsedData),
                                exerciseCount: exercises.length
                              });
                            } else {
                              exercises = [];
                              console.log('⚠️ Unexpected data format');
                            }
                          } catch (error) {
                            console.error('❌ Error parsing exercise_checks:', error);
                            exercises = workout.exercises || [];
                          }
                        } else {
                          exercises = workout.exercises || [];
                          console.log('⚠️ No exercise_checks data, using workout.exercises');
                        }
                        
                        console.log('📊 Processing exercises:', {
                          totalCount: exercises.length,
                          exercises: exercises.map(ex => ({
                            name: ex.exercise_name || ex.name,
                            checked: ex.checked
                          }))
                        });
                        
                        // Separate completed and uncompleted exercises based on checked field
                        const checkedExercises = exercises.filter(ex => ex.checked === true);
                        const uncheckedExercises = exercises.filter(ex => ex.checked === false);
                        
                        console.log('✅ Final categorization:', {
                          completedCount: checkedExercises.length,
                          uncompletedCount: uncheckedExercises.length,
                          completedNames: checkedExercises.map(ex => ex.exercise_name || ex.name),
                          uncompletedNames: uncheckedExercises.map(ex => ex.exercise_name || ex.name)
                        });
                        
                        if (exercises.length === 0) return null;
                        
                        return (
                          <Box mt={4} pt={4} borderTopWidth="1px" borderColor={borderColor}>
                            <Text fontSize="sm" fontWeight="bold" mb={3} color="gray.700">
                              エクササイズ詳細 ({exercises.length} 種目)
                            </Text>
                            
                            {/* Checked Exercises Section */}
                            {checkedExercises.length > 0 && (
                              <Box mb={4}>
                                <HStack spacing={2} mb={3}>
                                  <Icon as={FiTarget} color="green.600" boxSize={4} />
                                  <Text fontSize="sm" fontWeight="semibold" color="green.600">
                                    完了済み ({checkedExercises.length})
                                  </Text>
                                </HStack>
                                <VStack spacing={2} align="stretch">
                                  {checkedExercises.map((exercise, exerciseIndex) => (
                                    <Box 
                                      key={`checked-${exerciseIndex}`}
                                      p={3}
                                      bg={useColorModeValue('green.50', 'green.900')}
                                      borderRadius="md"
                                      borderWidth="1px"
                                      borderColor={useColorModeValue('green.200', 'green.700')}
                                    >
                                      <Flex justify="space-between" align="center" mb={2}>
                                        <HStack spacing={2}>
                                          <Box
                                            w={4}
                                            h={4}
                                            borderRadius="full"
                                            bg="green.500"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                          >
                                            <Text color="white" fontSize="xs" fontWeight="bold">
                                              ✓
                                            </Text>
                                          </Box>
                                          <VStack align="start" spacing={0}>
                                            <Text 
                                              fontSize="sm" 
                                              fontWeight="medium" 
                                              color="green.700"
                                            >
                                              {exercise.exercise_name || exercise.name || `エクササイズ ${exerciseIndex + 1}`}
                                            </Text>
                                            {exercise.muscle_group && (
                                              <Text fontSize="2xs" color="green.600">
                                                {exercise.muscle_group}
                                              </Text>
                                            )}
                                          </VStack>
                                        </HStack>
                                      </Flex>
                                      <SimpleGrid columns={4} spacing={2} fontSize="2xs" color="green.600">
                                        {exercise.sets && (
                                          <Text><strong>セット:</strong> {exercise.sets}</Text>
                                        )}
                                        {exercise.reps && (
                                          <Text><strong>回数:</strong> {exercise.reps}</Text>
                                        )}
                                        {exercise.weight && (
                                          <Text><strong>重量:</strong> {exercise.weight} kg</Text>
                                        )}
                                        {exercise.duration && (
                                          <Text><strong>時間:</strong> {exercise.duration} 秒</Text>
                                        )}
                                      </SimpleGrid>
                                    </Box>
                                  ))}
                                </VStack>
                              </Box>
                            )}
                            
                            {/* Unchecked Exercises Section */}
                            {uncheckedExercises.length > 0 && (
                              <Box>
                                <HStack spacing={2} mb={3}>
                                  <Icon as={FiMinus} color="gray.500" boxSize={4} />
                                  <Text fontSize="sm" fontWeight="semibold" color="gray.500">
                                    未完了 ({uncheckedExercises.length})
                                  </Text>
                                </HStack>
                                <VStack spacing={2} align="stretch">
                                  {uncheckedExercises.map((exercise, exerciseIndex) => (
                                    <Box 
                                      key={`unchecked-${exerciseIndex}`}
                                      p={3}
                                      bg={useColorModeValue('gray.50', 'gray.700')}
                                      borderRadius="md"
                                      borderWidth="1px"
                                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                                    >
                                      <Flex justify="space-between" align="center" mb={2}>
                                        <HStack spacing={2}>
                                          <Box
                                            w={4}
                                            h={4}
                                            borderRadius="full"
                                            bg="gray.400"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                          >
                                            <Text color="white" fontSize="xs" fontWeight="bold">
                                              ×
                                            </Text>
                                          </Box>
                                          <VStack align="start" spacing={0}>
                                            <Text 
                                              fontSize="sm" 
                                              fontWeight="medium" 
                                              color="gray.600"
                                            >
                                              {exercise.exercise_name || exercise.name || `エクササイズ ${exerciseIndex + 1}`}
                                            </Text>
                                            {exercise.muscle_group && (
                                              <Text fontSize="2xs" color="gray.500">
                                                {exercise.muscle_group}
                                              </Text>
                                            )}
                                          </VStack>
                                        </HStack>
                                      </Flex>
                                      <SimpleGrid columns={4} spacing={2} fontSize="2xs" color="gray.500">
                                        {exercise.sets && (
                                          <Text><strong>セット:</strong> {exercise.sets}</Text>
                                        )}
                                        {exercise.reps && (
                                          <Text><strong>回数:</strong> {exercise.reps}</Text>
                                        )}
                                        {exercise.weight && (
                                          <Text><strong>重量:</strong> {exercise.weight} kg</Text>
                                        )}
                                        {exercise.duration && (
                                          <Text><strong>時間:</strong> {exercise.duration} 秒</Text>
                                        )}
                                      </SimpleGrid>
                                    </Box>
                                  ))}
                                </VStack>
                              </Box>
                            )}
                            
                            {/* Progress Summary */}
                            <Box mt={4} pt={3} borderTopWidth="1px" borderColor={borderColor}>
                              <Flex justify="space-between" fontSize="sm">
                                <Text color="gray.600">
                                  <strong>進捗:</strong> {checkedExercises.length} / {exercises.length} 完了
                                </Text>
                                <Badge 
                                  colorScheme={checkedExercises.length === exercises.length ? 'green' : 'orange'}
                                  fontSize="xs"
                                >
                                  {exercises.length > 0 
                                    ? Math.round((checkedExercises.length / exercises.length) * 100)
                                    : 0}%
                                </Badge>
                              </Flex>
                            </Box>
                          </Box>
                        );
                      })()}
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>
          ) : (
            <Center py={20}>
              <VStack spacing={4}>
                <Icon as={FiActivity} boxSize={16} color="gray.300" />
                <VStack spacing={2} textAlign="center">
                  <Text color="gray.500" fontSize="lg" fontWeight="medium">
                    この日にワークアウトが記録されていません
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    ワークアウトを記録すると詳細な情報を表示できます
                  </Text>
                </VStack>
              </VStack>
            </Center>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Calorie Calendar Component
const CalorieCalendar = ({ type, selectedPlan, dashboardData }) => {
  const [weekData, setWeekData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allMeals, setAllMeals] = useState([]);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedModalDate, setSelectedModalDate] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const dates = generateSevenDayRange();
  const isIntake = type === 'intake';
  
  useEffect(() => {
    loadWeekCalories();
  }, [type]);
  
  // Function to get active meal plan for a specific date
  const getActivePlanForDate = (dateString) => {
    if (!mealPlans || mealPlans.length === 0) return null;
    
    return mealPlans.find(plan => {
      if (!plan.start_date || !plan.end_date) return false;
      
      const planStart = new Date(plan.start_date);
      const planEnd = new Date(plan.end_date);
      const checkDate = new Date(dateString);
      
      planStart.setHours(0, 0, 0, 0);
      planEnd.setHours(23, 59, 59, 999);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= planStart && checkDate <= planEnd;
    });
  };
  
  const loadWeekCalories = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isIntake) {
        // Load all meals data and meal plans (same as Nutrition page)
        const [mealsResponse, plansResponse] = await Promise.all([
          nutritionService.meals.getAll(),
          nutritionService.mealPlans.getAll()
        ]);
        
        const meals = mealsResponse?.results || mealsResponse || [];
        const plans = plansResponse?.results || plansResponse || [];
        
        setAllMeals(meals);
        setMealPlans(plans);
        
        // Calculate calories for each date from all meals data
        const data = {};
        dates.forEach(date => {
          const dateString = date.toISOString().split('T')[0];
          const dayMeals = meals.filter(m => m.date === dateString);
          const totalCalories = dayMeals.reduce((total, meal) => total + (meal.total_calories || 0), 0);
          data[dateString] = totalCalories;
        });
        
        setWeekData(data);
      } else {
        // Load all workout data
        try {
          const response = await workoutsService.workouts.getAll();
          const workouts = response?.results || response || [];
          console.log('Loaded workouts for dashboard:', workouts);
          setAllWorkouts(workouts);
          
          // Calculate calories for each date from all workouts data
          const data = {};
          dates.forEach(date => {
            const dateString = date.toISOString().split('T')[0];
            const dayWorkouts = workouts.filter(w => w.date && w.date.startsWith(dateString));
            console.log(`Workouts for ${dateString}:`, dayWorkouts);
            
            const totalCalories = dayWorkouts.reduce((total, workout) => {
              const calories = Number(workout.total_calories_burned) || 0;
              console.log(`Workout "${workout.name || 'Unknown'}" calories:`, calories);
              return total + calories;
            }, 0);
            
            data[dateString] = totalCalories;
            console.log(`Total calories for ${dateString}: ${totalCalories}`);
          });
          
          console.log('Week data for burned calories:', data);
          setWeekData(data);
        } catch (workoutError) {
          console.error('Error loading workouts, trying alternative method:', workoutError);
          // Fallback to getThisWeek if getAll doesn't exist
          try {
            const response = await workoutsService.workouts.getThisWeek();
            const workouts = response?.data || response || [];
            console.log('Loaded workouts (fallback method):', workouts);
            setAllWorkouts(workouts);
            
            const data = {};
            dates.forEach(date => {
              const dateString = date.toISOString().split('T')[0];
              const dayWorkouts = workouts.filter(w => w.date && w.date.startsWith(dateString));
              console.log(`Fallback workouts for ${dateString}:`, dayWorkouts);
              
              const totalCalories = dayWorkouts.reduce((total, workout) => {
                const calories = Number(workout.total_calories_burned) || 0;
                console.log(`Fallback workout "${workout.name || 'Unknown'}" calories:`, calories);
                return total + calories;
              }, 0);
              
              data[dateString] = totalCalories;
            });
            
            console.log('Week data (fallback) for burned calories:', data);
            setWeekData(data);
          } catch (fallbackError) {
            console.error('Fallback workout loading failed:', fallbackError);
            // Set all dates to 0 if both methods fail
            const data = {};
            dates.forEach(date => {
              const dateString = date.toISOString().split('T')[0];
              data[dateString] = 0;
            });
            setWeekData(data);
          }
        }
      }
    } catch (error) {
      console.error(`Error loading ${type} calories:`, error);
      setError(`${type === 'intake' ? '摂取' : '消費'}カロリーの読み込みに失敗しました`);
      // Set all dates to 0 in case of error
      const data = {};
      dates.forEach(date => {
        const dateString = date.toISOString().split('T')[0];
        data[dateString] = 0;
      });
      setWeekData(data);
    } finally {
      setLoading(false);
    }
  };
  
  const getMaxCalories = () => {
    const values = Object.values(weekData);
    return values.length > 0 ? Math.max(...values) : 100;
  };
  
  const maxCalories = getMaxCalories();
  
  // Handle date click for both intake and burned calories
  const handleDateClick = (date) => {
    setSelectedModalDate(date);
    onOpen();
  };
  
  // Get meals for selected date
  const getSelectedDateMeals = () => {
    if (!selectedModalDate || !allMeals) return [];
    const dateString = selectedModalDate.toISOString().split('T')[0];
    return allMeals.filter(meal => meal.date === dateString);
  };
  
  // Get plan for selected date
  const getSelectedDatePlan = () => {
    if (!selectedModalDate) return null;
    const dateString = selectedModalDate.toISOString().split('T')[0];
    return getActivePlanForDate(dateString);
  };
  
  // Get workouts for selected date
  const getSelectedDateWorkouts = () => {
    if (!selectedModalDate || !allWorkouts) return [];
    const dateString = selectedModalDate.toISOString().split('T')[0];
    return allWorkouts.filter(workout => workout.date && workout.date.startsWith(dateString));
  };
  
  if (loading) {
    return (
      <Center py={8}>
        <VStack spacing={3}>
          <Spinner size="md" color={type === 'intake' ? 'green.500' : 'purple.500'} />
          <Text fontSize="sm" color="gray.500">
            {type === 'intake' ? '摂取' : '消費'}カロリーを読み込み中...
          </Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={8}>
        <VStack spacing={3}>
          <Icon as={FiActivity} boxSize={8} color="gray.400" />
          <Text fontSize="sm" color="gray.500" textAlign="center">
            {error}
          </Text>
          <Button size="sm" colorScheme={type === 'intake' ? 'green' : 'purple'} onClick={loadWeekCalories}>
            再読み込み
          </Button>
        </VStack>
      </Center>
    );
  }
  
  return (
    <VStack spacing={4}>
      <Grid 
        templateColumns="repeat(7, 1fr)" 
        gap={{ base: 1, md: 2 }} 
        w="full"
      >
        {dates.map((date) => {
          const dateString = date.toISOString().split('T')[0];
          const calories = weekData[dateString] || 0;
          const isToday = new Date().toDateString() === date.toDateString();
          
          // Use target calories logic for intake, max calories for burned
          let progressPercentage = 0;
          let targetCalories = 2200; // Default fallback
          
          if (isIntake) {
            // For intake calories: get active plan for this specific date
            const activePlanForDate = getActivePlanForDate(dateString);
            
            if (activePlanForDate?.daily_calories) {
              targetCalories = activePlanForDate.daily_calories;
            } else if (selectedPlan?.daily_calories) {
              targetCalories = selectedPlan.daily_calories;
            } else if (dashboardData?.metabolism?.tdee) {
              targetCalories = Math.round(dashboardData.metabolism.tdee);
            }
            
            progressPercentage = targetCalories > 0 ? Math.round(Math.min((calories / targetCalories) * 100, 100)) : 0;
            
            // Debug logging - show plan info
            console.log(`Dashboard Progress - Date: ${dateString}, Calories: ${calories}, Target: ${targetCalories}, Progress: ${progressPercentage.toFixed(1)}%, Plan: ${activePlanForDate ? activePlanForDate.name : 'None'}`);
            
            // Ensure minimum visible progress for any calories > 0
            if (calories > 0 && progressPercentage < 5) {
              progressPercentage = 5; // Minimum 5% to make it clearly visible
            }
          } else {
            // For burned calories: use progress_percentage from workout data
            const dateString = date.toISOString().split('T')[0];
            const dayWorkouts = allWorkouts.filter(w => w.date && w.date.startsWith(dateString));
            
            if (dayWorkouts.length > 0) {
              // Use the average progress_percentage if multiple workouts on the same day
              const totalProgressPercentage = dayWorkouts.reduce((total, workout) => total + (workout.progress_percentage || 0), 0);
              progressPercentage = dayWorkouts.length > 0 ? Math.round(totalProgressPercentage / dayWorkouts.length) : 0;
            } else {
              progressPercentage = 0;
            }
            
            // Ensure minimum visible progress for any calories > 0
            if (calories > 0 && progressPercentage < 5) {
              progressPercentage = 5; // Minimum 5% to make it visible
            }
          }
          
          return (
            <VStack
              key={dateString}
              spacing={{ base: 1, md: 2 }}
              p={{ base: 2, md: 3 }}
              bg={isToday ? 
                (isIntake ? 
                  useColorModeValue('green.50', 'green.900') : 
                  useColorModeValue('purple.50', 'purple.900')
                ) : bgColor
              }
              borderWidth="1px"
              borderColor={isToday ? 
                (isIntake ? 
                  useColorModeValue('green.200', 'green.600') : 
                  useColorModeValue('purple.200', 'purple.600')
                ) : borderColor
              }
              borderRadius="md"
              minH={{ base: "70px", md: "90px" }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => handleDateClick(date)}
              _hover={{
                transform: "translateY(-2px)",
                shadow: "md",
                bg: isToday ? 
                  (isIntake ? 
                    useColorModeValue('green.100', 'green.800') :
                    useColorModeValue('purple.100', 'purple.800')
                  ) : 
                  useColorModeValue('gray.50', 'gray.700')
              }}
            >
              <Text
                fontSize={{ base: "2xs", md: "xs" }}
                fontWeight={isToday ? "bold" : "medium"}
                color={isToday ? 
                  (isIntake ? 'green.600' : 'purple.600') : 
                  'gray.600'
                }
                textAlign="center"
              >
                {formatDayDisplay(date)}
              </Text>
              
              <Text
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="bold"
                color={isToday ? 
                  (isIntake ? 'green.700' : 'purple.700') : 
                  useColorModeValue('gray.900', 'white')
                }
                textAlign="center"
              >
                {Math.round(calories).toLocaleString()}
              </Text>
              
              <Text fontSize="2xs" color="gray.500" textAlign="center">
                kcal
              </Text>
              
              {/* Progress bar */}
              <Box w="full" px={1}>
                <Progress
                  value={Math.max(progressPercentage, calories > 0 ? 2 : 0)}
                  size="xs"
                  colorScheme={isIntake ? (calories > targetCalories ? 'red' : 'green') : 'purple'}
                  bg={useColorModeValue('gray.100', 'gray.700')}
                  borderRadius="full"
                  hasStripe={calories > 0}
                  isAnimated={calories > 0}
                />
                {/* Show target info for intake calories */}
                {/* {isIntake && calories > 0 && (
                  <Text fontSize="2xs" color="gray.400" textAlign="center" mt={1}>
                    目標: {Math.round(targetCalories).toLocaleString()}
                  </Text>
                )} */}
              </Box>
            </VStack>
          );
        })}
      </Grid>
      
      {/* Summary */}
      <Box 
        w="full" 
        p={3} 
        bg={useColorModeValue('gray.50', 'gray.700')} 
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <Text fontSize="xs" color="gray.600" fontWeight="medium">
            7日間の{isIntake ? '摂取' : '消費'}カロリー
          </Text>
          <Badge 
            colorScheme={isIntake ? 'green' : 'purple'} 
            fontSize="xs"
            px={3}
            py={1}
            borderRadius="full"
          >
            合計: {(() => {
              if (!weekData || typeof weekData !== 'object') {
                console.log('Invalid weekData:', weekData);
                return '0';
              }
              
              const values = Object.values(weekData);
              const validValues = values.filter(val => {
                const num = Number(val);
                return !isNaN(num) && isFinite(num);
              });
              
              const sum = validValues.reduce((total, val) => total + Number(val), 0);
              const total = Math.round(sum);
              
              console.log(`${type} calories calculation:`, {
                weekData,
                values,
                validValues,
                sum,
                total
              });
              
              return isNaN(total) || !isFinite(total) ? '0' : total.toLocaleString();
            })()} kcal
          </Badge>
        </Flex>
        <Text fontSize="2xs" color="gray.500" mt={1}>
          平均: {(() => {
            if (!weekData || typeof weekData !== 'object') return '0';
            
            const values = Object.values(weekData);
            const validValues = values.filter(val => {
              const num = Number(val);
              return !isNaN(num) && isFinite(num);
            });
            
            if (validValues.length === 0) return '0';
            
            const sum = validValues.reduce((total, val) => total + Number(val), 0);
            const average = sum / 7; // Always divide by 7 days
            const roundedAverage = Math.round(average);
            
            return isNaN(roundedAverage) || !isFinite(roundedAverage) ? '0' : roundedAverage.toLocaleString();
          })()} kcal/日
        </Text>
      </Box>
      
      {/* Nutrition Modal */}
      {isIntake ? (
        <NutritionModal 
          isOpen={isOpen}
          onClose={onClose}
          selectedDate={selectedModalDate}
          mealData={getSelectedDateMeals()}
          planData={getSelectedDatePlan()}
          formatDayDisplay={formatDayDisplay}
        />
      ) : (
        <WorkoutModal 
          isOpen={isOpen}
          onClose={onClose}
          selectedDate={selectedModalDate}
          workoutData={getSelectedDateWorkouts()}
          formatDayDisplay={formatDayDisplay}
        />
      )}
    </VStack>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [latestMeasurement, setLatestMeasurement] = useState(null);
  const [todayCalories, setTodayCalories] = useState(null);
  const [weekWorkouts, setWeekWorkouts] = useState(null);
  const [mealPlans, setMealPlans] = useState([]);
  const [errors, setErrors] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const saved = localStorage.getItem('selectedMealPlan');
    return saved ? JSON.parse(saved) : null;
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const progressBlueBg = useColorModeValue('blue.50', 'blue.900');
  const progressGreenBg = useColorModeValue('green.50', 'green.900');
  const progressPurpleBg = useColorModeValue('purple.50', 'purple.900');
  // Pre-define all color mode values to avoid hooks order issues
  const blueIconBorderColor = useColorModeValue('blue.200', 'blue.600');
  const greenIconBorderColor = useColorModeValue('green.200', 'green.600');
  const purpleIconBorderColor = useColorModeValue('purple.200', 'purple.600');

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Listen for changes to selected meal plan
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'selectedMealPlan') {
        const newPlan = e.newValue ? JSON.parse(e.newValue) : null;
        setSelectedPlan(newPlan);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setErrors([]);
      
      // Load data separately to handle individual errors
      let dashboardError = null;
      let measurementError = null;
      
      try {
        const dashboardResponse = await analyticsService.getDashboard();
        const data = dashboardResponse.data || dashboardResponse;
        console.log('Dashboard API response:', data);
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        dashboardError = 'ダッシュボードデータの読み込みに失敗しました';
        setDashboardData(null);
      }
      
      try {
        const measurementResponse = await measurementsService.getLatestMeasurement();
        const data = measurementResponse.data || measurementResponse;
        console.log('Latest measurement:', data);
        setLatestMeasurement(data);
      } catch (error) {
        console.error('Error loading measurement data:', error);
        measurementError = '測定値の読み込みに失敗しました';
        setLatestMeasurement(null);
      }

      // Load today's calories
      try {
        const mealsResponse = await nutritionService.meals.getToday();
        const meals = mealsResponse.data || mealsResponse;
        console.log('Today meals:', meals);
        setTodayCalories(meals);
      } catch (error) {
        console.error('Error loading today calories:', error);
        setTodayCalories(null);
      }

      // Load this week's workouts
      try {
        const workoutsResponse = await workoutsService.workouts.getThisWeek();
        const workouts = workoutsResponse.data || workoutsResponse;
        console.log('Week workouts:', workouts);
        setWeekWorkouts(workouts);
      } catch (error) {
        console.error('Error loading week workouts:', error);
        setWeekWorkouts(null);
      }

      // Load meal plans for today's target calculation
      try {
        const plansResponse = await nutritionService.mealPlans.getAll();
        const plansData = plansResponse.data || plansResponse;
        // Extract results array from Django REST framework response format
        const plans = plansData?.results || plansData || [];
        console.log('Meal plans for dashboard:', plans);
        setMealPlans(plans);
      } catch (error) {
        console.error('Error loading meal plans:', error);
        setMealPlans([]);
      }
      
      // Collect errors
      const errorList = [];
      if (dashboardError) errorList.push(dashboardError);
      if (measurementError) errorList.push(measurementError);
      
      if (errorList.length > 0) {
        setErrors(errorList);
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setErrors(['データの読み込みに失敗しました']);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }
  
  // Show single consolidated error message if there are errors
  const hasErrors = errors.length > 0;

  const bmi = latestMeasurement ? calculateBMI(latestMeasurement.weight, latestMeasurement.height) : null;

  // Calculate today's total calories
  const calculateTodayCalories = () => {
    if (!todayCalories || !Array.isArray(todayCalories)) return 0;
    return todayCalories.reduce((total, meal) => {
      return total + (meal.total_calories || 0);
    }, 0);
  };

  // Get today's active plan (same logic as CalorieCalendar getActivePlanForDate)
  const getTodayActivePlan = () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (!mealPlans || !Array.isArray(mealPlans) || mealPlans.length === 0) return null;
    
    return mealPlans.find(plan => {
      if (!plan.start_date || !plan.end_date) return false;
      
      const planStart = new Date(plan.start_date);
      const planEnd = new Date(plan.end_date);
      const checkDate = new Date(today);
      
      planStart.setHours(0, 0, 0, 0);
      planEnd.setHours(23, 59, 59, 999);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= planStart && checkDate <= planEnd;
    });
  };

  // Get calorie target using same logic as NutritionModal 総カロリー section: planData?.daily_calories || 0
  const getCalorieTarget = () => {
    const planData = getTodayActivePlan();
    return planData?.daily_calories || 0;
  };

  // Calculate this week's workout stats
  const calculateWeekWorkoutStats = () => {
    if (!weekWorkouts || !Array.isArray(weekWorkouts)) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    const completed = weekWorkouts.filter(w => w.status === 'completed').length;
    const total = weekWorkouts.length; // Total workouts this week
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  // Calculate monthly weight change
  const getMonthlyWeightChange = () => {
    if (!dashboardData?.recent_progress) return null;
    const change = dashboardData.recent_progress.weight_change;
    return change !== undefined && change !== null ? change : null;
  };

  // Calculate monthly body fat change
  const getMonthlyBodyFatChange = () => {
    if (!dashboardData?.recent_progress) return null;
    const change = dashboardData.recent_progress.body_fat_change;
    return change !== undefined && change !== null ? change : null;
  };

  const todayCaloriesTotal = calculateTodayCalories();
  const calorieTarget = getCalorieTarget();
  const workoutStats = calculateWeekWorkoutStats();
  const monthlyWeightChange = getMonthlyWeightChange();
  const monthlyBodyFatChange = getMonthlyBodyFatChange();

  return (
    <Box>
      {/* Header */}
      <Box mb={{ base: 4, md: 6, lg: 8 }}>
        <Heading size={{ base: "sm", md: "md" }} mb={2}>ダッシュボード</Heading>
        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">こんにちは、あなたの健康状態の概要です。</Text>
      </Box>

      {/* Single Error Alert */}
      {hasErrors && (
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>データ読み込みエラー</AlertTitle>
            <AlertDescription>
              ダッシュボードの一部のデータを読み込めませんでした。最新の測定値を記録すると問題が解決する場合があります。
            </AlertDescription>
          </Box>
          <Button size="sm" colorScheme="orange" onClick={() => navigate('/measurements')}>
            測定値を記録
          </Button>
        </Alert>
      )}

      {/* Stats Cards - New Design */}
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
                <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.600" mb={2}>現在の体重</Text>
                <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" mb={1}>
                  {latestMeasurement?.weight || dashboardData?.goal_progress?.current_weight || 'N/A'} kg
                </Text>
                {monthlyWeightChange !== null && (
                  <HStack 
                    spacing={1} 
                    color={
                      monthlyWeightChange === 0 
                        ? "gray.400" 
                        : monthlyWeightChange < 0 
                          ? "green.500" 
                          : "red.500"
                    } 
                    fontSize="xs"
                  >
                    <Icon as={
                      monthlyWeightChange === 0 
                        ? FiMinus 
                        : monthlyWeightChange < 0 
                          ? FiTrendingDown 
                          : FiTrendingUp
                    } />
                    <Text>今月 {monthlyWeightChange > 0 ? '+' : ''}{monthlyWeightChange.toFixed(1)} kg</Text>
                  </HStack>
                )}
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

        {/* Card 2: Today's Calories */}
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
                <Text fontSize="xs" color="gray.600" mb={2}>今日のカロリー</Text>
                <Text fontSize="2xl" fontWeight="bold" mb={1}>
                  {todayCaloriesTotal.toLocaleString()}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  目標: {calorieTarget.toLocaleString()} kcal
                </Text>
              </Box>
              <Box
                bg="green.100"
                p={3}
                borderRadius="lg"
              >
                <Icon as={FiZap} boxSize={6} color="green.600" />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        {/* Card 3: This Week's Workouts */}
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
                <Text fontSize="xs" color="gray.600" mb={2}>今週のワークアウト</Text>
                <Text fontSize="2xl" fontWeight="bold" mb={1}>
                  {workoutStats.completed}/{workoutStats.total}
                </Text>
                <HStack spacing={1} color="purple.500" fontSize="xs">
                  <Icon as={FiTarget} />
                  <Text>{workoutStats.percentage}% 完了</Text>
                </HStack>
              </Box>
              <Box
                bg="purple.100"
                p={3}
                borderRadius="lg"
              >
                <Icon as={FiActivity} boxSize={6} color="purple.600" />
              </Box>
            </Flex>
          </CardBody>
        </Card>

        {/* Card 4: Body Fat Percentage */}
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
                <Text fontSize="xs" color="gray.600" mb={2}>体脂肪率</Text>
                <Text fontSize="2xl" fontWeight="bold" mb={1}>
                  {latestMeasurement?.body_fat_percentage ? `${latestMeasurement.body_fat_percentage}%` : 'N/A'}
                </Text>
                {monthlyBodyFatChange !== null && (
                  <HStack 
                    spacing={1} 
                    color={
                      monthlyBodyFatChange === 0 
                        ? "gray.400" 
                        : monthlyBodyFatChange < 0 
                          ? "green.500" 
                          : "red.500"
                    } 
                    fontSize="xs"
                  >
                    <Icon as={
                      monthlyBodyFatChange === 0 
                        ? FiMinus 
                        : monthlyBodyFatChange < 0 
                          ? FiTrendingDown 
                          : FiTrendingUp
                    } />
                    <Text>今月 {monthlyBodyFatChange > 0 ? '+' : ''}{monthlyBodyFatChange}%</Text>
                  </HStack>
                )}
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

      {/* Progress Summary Section */}
      <Card 
        bg={bgColor} 
        borderWidth="1px" 
        borderColor={borderColor} 
        mb={{ base: 6, md: 8 }}
        shadow="md"
        borderRadius="xl"
      >
        <CardHeader pb={4}>
          <HStack spacing={3}>
            <Box
              bg="brand.100"
              p={2}
              borderRadius="lg"
            >
              <Icon as={FiTrendingUp} boxSize={5} color="brand.600" />
            </Box>
            <Heading size="lg" color="brand.600">進捗サマリー</Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          {dashboardData?.recent_progress ? (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 6 }}>
              <Box 
                p={5} 
                bg={progressBlueBg} 
                borderRadius="xl"
                borderWidth="1px"
                borderColor={blueIconBorderColor}
                transition="all 0.2s"
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              >
                <VStack align="start" spacing={2}>
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="semibold" fontSize="md" color="blue.700">体重変化</Text>
                    <Badge 
                      colorScheme={dashboardData.recent_progress.weight_progress?.weight_change < 0 ? 'green' : 'orange'}
                      fontSize="sm"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {dashboardData.recent_progress.weight_progress?.weight_change > 0 ? '+' : ''}
                      {dashboardData.recent_progress.weight_progress?.weight_change?.toFixed(1) || 0} kg
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    過去7日間: {dashboardData.recent_progress.weight_progress?.start_weight?.toFixed(1)} kg → {dashboardData.recent_progress.weight_progress?.current_weight?.toFixed(1)} kg
                  </Text>
                </VStack>
              </Box>
              
              <Box 
                p={5} 
                bg={progressGreenBg} 
                borderRadius="xl"
                borderWidth="1px"
                borderColor={greenIconBorderColor}
                transition="all 0.2s"
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              >
                <VStack align="start" spacing={2}>
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="semibold" fontSize="md" color="green.700">体脂肪の変化</Text>
                    <Badge 
                      colorScheme={
                        dashboardData.recent_progress.body_fat_change === undefined || 
                        dashboardData.recent_progress.body_fat_change === null ||
                        dashboardData.recent_progress.body_fat_change === 0
                          ? 'gray' 
                          : dashboardData.recent_progress.body_fat_change < 0 
                            ? 'green' 
                            : 'orange'
                      }
                      fontSize="sm"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {dashboardData.recent_progress.body_fat_change !== undefined && 
                       dashboardData.recent_progress.body_fat_change !== null ? (
                        <>
                          {dashboardData.recent_progress.body_fat_change > 0 ? '+' : ''}
                          {dashboardData.recent_progress.body_fat_change}%
                        </>
                      ) : (
                        '0 %'
                      )}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    過去7日間: {dashboardData.recent_progress.start_body_fat?.toFixed(1)}% → {dashboardData.recent_progress.current_body_fat?.toFixed(1)}%
                  </Text>
                </VStack>
              </Box>
              
              <Box 
                p={5} 
                bg={progressPurpleBg} 
                borderRadius="xl"
                borderWidth="1px"
                borderColor={purpleIconBorderColor}
                transition="all 0.2s"
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              >
                <VStack align="start" spacing={2}>
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="semibold" fontSize="md" color="purple.700">ワークアウト</Text>
                    <Badge 
                      colorScheme="purple"
                      fontSize="sm"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {dashboardData.recent_progress.workout_trends?.total_workouts || 0} 回
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    過去7日間 • {dashboardData.recent_progress.workout_trends?.total_duration_minutes || 0} 分
                  </Text>
                </VStack>
              </Box>
            </SimpleGrid>
          ) : (
            <Center py={8}>
              <VStack spacing={4}>
                <Icon as={FiActivity} boxSize={16} color="gray.300" />
                <VStack spacing={2}>
                  <Text color="gray.500" fontSize="lg" fontWeight="medium">進捗を記録して、ここに表示させましょう。</Text>
                  <Text color="gray.400" fontSize="sm">測定値やワークアウトを記録して進捗を管理しましょう</Text>
                </VStack>
                <Button 
                  colorScheme="brand" 
                  size="md" 
                  leftIcon={<FiActivity />}
                  onClick={() => navigate('/measurements')}
                  shadow="md"
                >
                  測定値を記録
                </Button>
              </VStack>
            </Center>
          )}
        </CardBody>
      </Card>

      {/* Calorie Calendars Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, lg: 8 }}>
        {/* Intake Calories Calendar */}
        <Card 
          bg={bgColor} 
          borderWidth="1px" 
          borderColor={borderColor} 
          shadow="lg" 
          borderRadius="xl"
          transition="all 0.3s ease"
          _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
        >
          <CardHeader pb={3}>
            <HStack spacing={4}>
              <Box
                bg="green.100"
                p={3}
                borderRadius="xl"
                shadow="sm"
              >
                <Icon as={FiZap} boxSize={6} color="green.600" />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" color="green.600">摂取カロリー</Heading>
                <Text fontSize="sm" color="gray.500">過去7日間の摂取カロリー推移</Text>
              </VStack>
            </HStack>
          </CardHeader>
            <CardBody pt={0}>
              <CalorieCalendar type="intake" selectedPlan={selectedPlan} dashboardData={dashboardData} />
            </CardBody>
          </Card>

        {/* Burned Calories Calendar */}
        <Card 
          bg={bgColor} 
          borderWidth="1px" 
          borderColor={borderColor} 
          shadow="lg" 
          borderRadius="xl"
          transition="all 0.3s ease"
          _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
        >
          <CardHeader pb={3}>
            <HStack spacing={4}>
              <Box
                bg="purple.100"
                p={3}
                borderRadius="xl"
                shadow="sm"
              >
                <Icon as={FiActivity} boxSize={6} color="purple.600" />
              </Box>
              <VStack align="start" spacing={1}>
                <Heading size="lg" color="purple.600">消費カロリー</Heading>
                <Text fontSize="sm" color="gray.500">過去7日間の消費カロリー推移</Text>
              </VStack>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <CalorieCalendar type="burned" selectedPlan={selectedPlan} dashboardData={dashboardData} />
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Goals Section */}
      <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} mt={6}>
        <CardHeader>
          <Heading size="md">あなたの目標</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>目標体重</Text>
              <Text fontSize="xl" fontWeight="bold" color="brand.500">
                {dashboardData?.goal_progress?.target_weight || '未設定'} kg
              </Text>
              <Text fontSize="xs" color="gray.600" mb={1}>
                {dashboardData?.goal_progress?.weight_remaining !== null
                  ? Math.abs(dashboardData.goal_progress.weight_remaining) <= 1
                    ? "目標体重を達成しました！"
                    : `残り ${Math.abs(dashboardData.goal_progress.weight_remaining).toFixed(1)} kg`
                  : '目標を設定してください'}
              </Text>
              {/* Success badge when weight goal is achieved (within reasonable range) */}
              {dashboardData?.goal_progress?.weight_remaining !== null && 
               Math.abs(dashboardData.goal_progress.weight_remaining) <= 1 ? (
                <Badge colorScheme="green" fontSize="xs" bg="green.500" color="white" mb={1}>
                  🎉 目標達成おめでとうございます！
                </Badge>
              ) : (
                <>
                  {dashboardData?.goal_progress?.estimated_weeks_to_goal > 0 && (
                    <Badge colorScheme="blue" fontSize="xs">
                      推定 {dashboardData.goal_progress.estimated_weeks_to_goal.toFixed(1)} 週間
                    </Badge>
                  )}
                </>
              )}
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>基礎代謝量 (BMR)</Text>
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                {dashboardData?.metabolism?.bmr ? Math.round(dashboardData.metabolism.bmr) : 'N/A'} kcal
              </Text>
              <Text fontSize="xs" color="gray.600">
                安静時の消費カロリー
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>総消費カロリー (TDEE)</Text>
              <Text fontSize="xl" fontWeight="bold" color="purple.500">
                {dashboardData?.metabolism?.tdee ? Math.round(dashboardData.metabolism.tdee) : 'N/A'} kcal
              </Text>
              <Text fontSize="xs" color="gray.600">
                1日の総消費カロリー
              </Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Dashboard;
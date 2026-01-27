import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Grid,
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
  FormErrorMessage,
  Input,
  Select,
  Textarea,
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
  VStack,
  HStack,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Progress,
  Flex,
  Divider,
  Image,
  CloseButton,
  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import { 
  FiPlus, 
  FiCheck, 
  FiClock, 
  FiActivity, 
  FiChevronLeft, 
  FiChevronRight,
  FiPlay,
  FiEdit,
  FiTrash2,
  FiInfo,
  FiList,
  FiStar,
  FiImage,
  FiX,
} from 'react-icons/fi';
import { FaCalendar } from 'react-icons/fa';
import workoutsService from '../services/workouts';
import { formatDate } from '../utils/helpers';
import { getImageUrl } from '../services/api';

const Workouts = () => {
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isCreateExerciseOpen, onOpen: onCreateExerciseOpen, onClose: onCreateExerciseClose } = useDisclosure();
  const { isOpen: isEditExerciseOpen, onOpen: onEditExerciseOpen, onClose: onEditExerciseClose } = useDisclosure();
  const { isOpen: isDeleteExerciseOpen, onOpen: onDeleteExerciseOpen, onClose: onDeleteExerciseClose } = useDisclosure();
  const { isOpen: isEditWorkoutOpen, onOpen: onEditWorkoutOpen, onClose: onEditWorkoutClose } = useDisclosure();
  const { isOpen: isDeleteWorkoutOpen, onOpen: onDeleteWorkoutOpen, onClose: onDeleteWorkoutClose } = useDisclosure();
  const { isOpen: isExerciseMediaOpen, onOpen: onExerciseMediaOpen, onClose: onExerciseMediaClose } = useDisclosure();
  const { isOpen: isCreatePlanOpen, onOpen: onCreatePlanOpen, onClose: onCreatePlanClose } = useDisclosure();
  const { isOpen: isDeletePlanOpen, onOpen: onDeletePlanOpen, onClose: onDeletePlanClose } = useDisclosure();
  const { isOpen: isStartPlanOpen, onOpen: onStartPlanOpen, onClose: onStartPlanClose } = useDisclosure();
  const { isOpen: isStopPlanOpen, onOpen: onStopPlanOpen, onClose: onStopPlanClose } = useDisclosure();
  const { isOpen: isCompleteWorkoutOpen, onOpen: onCompleteWorkoutOpen, onClose: onCompleteWorkoutClose } = useDisclosure();
  const { isOpen: isDeleteOptionsOpen, onOpen: onDeleteOptionsOpen, onClose: onDeleteOptionsClose } = useDisclosure();
  const toast = useToast();
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [planToStart, setPlanToStart] = useState(null);
  const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);
  const [workoutToEdit, setWorkoutToEdit] = useState(null);
  const [workoutToComplete, setWorkoutToComplete] = useState(null);
  const [deleteOption, setDeleteOption] = useState('today'); // 'today', 'recurring', 'all'
  const [exerciseMediaView, setExerciseMediaView] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkedExercises, setCheckedExercises] = useState({});
  const [exerciseCurrentPage, setExerciseCurrentPage] = useState(1);
  const [exerciseItemsPerPage] = useState(7);
  const [planCurrentPage, setPlanCurrentPage] = useState(1);
  const [planItemsPerPage] = useState(4);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyItemsPerPage] = useState(7);
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    notes: '',
    repeat_type: 'none', // 'none', 'daily', 'weekly'
    repeat_until: '',
    weekly_days: [], // Array of day indices (0=Sunday, 1=Monday, ..., 6=Saturday)
  });
  const [weeklyDaysError, setWeeklyDaysError] = useState('');
  const [newExerciseData, setNewExerciseData] = useState({
    name: '',
    exercise_type: '',
    muscle_group: '',
    difficulty: '',
    equipment: '',
    primary_muscles: [],
    secondary_muscles: [],
    instructions: '',
    calories_per_minute: '5.0',
    image_url: '',
  });
  // Secondary muscles options based on muscle_group
  const [availableSecondaryMuscles, setAvailableSecondaryMuscles] = useState([]);
  const [exerciseMediaFiles, setExerciseMediaFiles] = useState([]);
  const [exerciseMediaPreviews, setExerciseMediaPreviews] = useState([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [newPlanData, setNewPlanData] = useState({
    name: '',
    description: '',
    goal: '',
    difficulty: '',
    duration_weeks: '',
    days_per_week: '',
    overview: '',
    requirements: '',
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Helper function to get week start (Monday)
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Get week days array
  function getWeekDays(weekStart) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }

  // Get today's date for min date constraint
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get max date (1 month from today)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  // Toggle exercise check status
  const toggleExerciseCheck = async (exerciseId, exerciseIndex) => {
    if (selectedDateWorkouts.length === 0) return;
    
    const key = `${selectedDate.toISOString().split('T')[0]}-${exerciseIndex}`;
    const workout = selectedDateWorkouts[0];
    const exercise = workout.exercises[exerciseIndex];
    const currentState = checkedExercises[key];
    const newCheckedState = !(currentState?.checked || false);
    
    // Create new exercise data with detailed information
    const newExerciseData = {
      checked: newCheckedState,
      exercise_name: exercise.exercise?.name || exercise.name || 'エクササイズ',
      muscle_group: exercise.exercise?.primary_muscles?.[0] || exercise.muscle_group || 'コンパウンド',
      sets: exercise.planned_sets || exercise.sets || 0,
      reps: exercise.planned_reps || exercise.reps || 0,
      weight: exercise.planned_weight_kg || exercise.weight || 0
    };
    
    // Update local state immediately for instant UI response
    setCheckedExercises(prev => ({
      ...prev,
      [key]: newExerciseData
    }));
    
    // Send to backend asynchronously (only for today's workout)
    if (isTodayDate(selectedDate)) {
      // Calculate new percentage
      let checkedCount = 0;
      workout.exercises.forEach((exercise, index) => {
        const exerciseKey = `${selectedDate.toISOString().split('T')[0]}-${index}`;
        const isChecked = index === exerciseIndex ? newCheckedState : (checkedExercises[exerciseKey]?.checked || false);
        if (isChecked) {
          checkedCount++;
        }
      });
      
      const percentage = Math.round((checkedCount / workout.exercises.length) * 100);
      
      // Build complete exercise checks object with all exercises
      const completeExerciseChecks = {};
      workout.exercises.forEach((exercise, index) => {
        const exerciseKey = `${selectedDate.toISOString().split('T')[0]}-${index}`;
        const isChecked = index === exerciseIndex ? newCheckedState : (checkedExercises[exerciseKey]?.checked || false);
        
        completeExerciseChecks[exerciseKey] = {
          checked: isChecked,
          exercise_name: exercise.exercise?.name || exercise.name || 'エクササイズ',
          muscle_group: exercise.exercise?.primary_muscles?.[0] || exercise.muscle_group || 'コンパウンド',
          sets: exercise.planned_sets || exercise.sets || 0,
          reps: exercise.planned_reps || exercise.reps || 0,
          weight: exercise.planned_weight_kg || exercise.weight || 0
        };
      });
      
      // Update backend in background
      try {
        await workoutsService.workouts.updateProgress(workout.id, {
          progress_percentage: percentage,
          exercise_checks: completeExerciseChecks
        });
      } catch (error) {
        console.error('Failed to update workout progress:', error);
        // Revert local state if backend update fails
        setCheckedExercises(prev => ({
          ...prev,
          [key]: currentState || { checked: false }
        }));
        
        toast({
          title: '進捗の更新に失敗しました',
          description: 'もう一度お試しください',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // Get exercise check status
  const getExerciseCheckStatus = (exerciseId, exerciseIndex) => {
    const key = `${selectedDate.toISOString().split('T')[0]}-${exerciseIndex}`;
    const exerciseData = checkedExercises[key];
    return exerciseData?.checked || false;
  };

  // Check if date is today
  const isTodayDate = (date) => {
    const today = new Date();
    const compareDate = new Date(date);
    return compareDate.toDateString() === today.toDateString();
  };

  // Check if checkbox should be disabled (only enable for today and not completed)
  const isCheckboxDisabled = () => {
    // Disable if not today
    if (!isTodayDate(selectedDate)) {
      return true;
    }
    
    // Disable if workout is completed
    if (selectedDateWorkouts.length > 0 && selectedDateWorkouts[0].completed) {
      return true;
    }
    
    return false;
  };

  // Calculate workout completion percentage
  const getWorkoutCompletionPercentage = (workout) => {
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      return 0;
    }
    
    const totalExercises = workout.exercises.length;
    let checkedCount = 0;
    
    workout.exercises.forEach((exercise, index) => {
      if (getExerciseCheckStatus(exercise.id, index)) {
        checkedCount++;
      }
    });
    
    return Math.round((checkedCount / totalExercises) * 100);
  };

  // Check if at least one exercise is checked
  const hasCheckedExercises = (workout) => {
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      return false;
    }
    
    return workout.exercises.some((exercise, index) => {
      return getExerciseCheckStatus(exercise.id, index);
    });
  };

  useEffect(() => {
    loadData();
    
    // Check for tab in location state
    if (location.state?.tab !== undefined) {
      const tabIndex = location.state.tab;
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 3) {
        setActiveTab(tabIndex);
      }
    }
  }, [location]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workoutsResponse, exercisesResponse, plansResponse] = await Promise.all([
        workoutsService.workouts.getAll(),
        workoutsService.exercises.getAll(),
        workoutsService.workoutPlans.getAll(),
      ]);
      setWorkouts(workoutsResponse.results || workoutsResponse);
      setExercises(exercisesResponse.results || exercisesResponse);
      setPlans(plansResponse.results || plansResponse);
      
      // Load checked exercises state from workouts
      const newCheckedState = {};
      (workoutsResponse.results || workoutsResponse).forEach(workout => {
        if (workout.exercise_checks) {
          // Handle both old format (boolean) and new format (object)
          Object.entries(workout.exercise_checks).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
              // Old format compatibility
              newCheckedState[key] = { checked: value };
            } else if (typeof value === 'object' && value !== null) {
              // New format
              newCheckedState[key] = value;
            }
          });
        }
      });
      setCheckedExercises(newCheckedState);
      
      // Load active schedule
      try {
        const scheduleResponse = await workoutsService.schedules.getActive();
        setActiveSchedule(scheduleResponse);
      } catch (scheduleError) {
        // No active schedule is fine
        setActiveSchedule(null);
      }
    } catch (error) {
      toast({
        title: 'データ読み込みエラー',
        description: error.response?.data?.detail || 'ワークアウトデータの読み込みに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWorkoutModal = () => {
    // カレンダーで選択した日付をフォームに設定
    setFormData({
      name: '',
      date: selectedDate.toISOString().split('T')[0],
      duration: '',
      notes: '',
      repeat_type: 'none',
      repeat_until: '',
      weekly_days: [],
    });
    setSelectedExercises([]);
    setWeeklyDaysError('');
    onOpen();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'weekly_days') {
        const dayIndex = +value; // Convert string to number
        setFormData(prev => {
          const newWeeklyDays = checked 
            ? [...prev.weekly_days, dayIndex].sort()
            : prev.weekly_days.filter(day => day !== dayIndex);
          
          // Validate weekly days selection
          if (prev.repeat_type === 'weekly') {
            if (newWeeklyDays.length === 0) {
              setWeeklyDaysError('少なくとも1つの曜日を選択してください');
            } else {
              setWeeklyDaysError('');
            }
          }
          
          return {
            ...prev,
            weekly_days: newWeeklyDays
          };
        });
      }
    } else {
      setFormData(prev => {
        const newFormData = {
          ...prev,
          [name]: value,
        };
        
        // Clear weekly days error when changing repeat type
        if (name === 'repeat_type') {
          if (value !== 'weekly') {
            setWeeklyDaysError('');
          } else if (value === 'weekly' && prev.weekly_days.length === 0) {
            setWeeklyDaysError('少なくとも1つの曜日を選択してください');
          }
        }
        
        return newFormData;
      });
    }
  };

  const handleExerciseSelect = (exercise) => {
    setSelectedExercises([...selectedExercises, { ...exercise, sets: 3, reps: 10, weight: 0 }]);
    toast({
      title: 'エクササイズを追加しました',
      description: `${exercise.name}を追加しました`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleExerciseRemove = (index) => {
    const updatedExercises = selectedExercises.filter((_, i) => i !== index);
    setSelectedExercises(updatedExercises);
  };

  const handleExerciseUpdate = (index, field, value) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[index][field] = value;
    setSelectedExercises(updatedExercises);
  };

  // Calculate total calories using MET formula
  // Calories = MET × Weight (kg) × Duration (hours)
  const calculateTotalCalories = () => {
    if (!formData.duration || selectedExercises.length === 0) return 0;
    
    const durationMinutes = parseInt(formData.duration) || 0;
    const durationHours = durationMinutes / 60;
    
    // Use default weight of 70kg if user weight is not available
    // TODO: Get actual weight from user profile
    const userWeight = 70;
    
    // Calculate total calories using MET values
    const totalCalories = selectedExercises.reduce((sum, exercise) => {
      const metValue = parseFloat(exercise.met_value) || parseFloat(exercise.calories_per_minute) || 5.0;
      const calories = metValue * userWeight * durationHours;
      return sum + calories;
    }, 0);
    
    // Divide by number of exercises since they're done sequentially, not simultaneously
    return Math.round(totalCalories / selectedExercises.length);
  };

  const handleOpenCreateExercise = () => {
    // Reset all exercise form state
    setNewExerciseData({
      name: '',
      exercise_type: '',
      muscle_group: '',
      difficulty: '',
      equipment: '',
      primary_muscles: [],
      secondary_muscles: [],
      instructions: '',
      calories_per_minute: '5.0',
      image_url: '',
    });
    setExerciseMediaFiles([]);
    setExerciseMediaPreviews([]);
    setExerciseToEdit(null);
    onCreateExerciseOpen();
  };

  const handleCloseCreateExercise = () => {
    // Reset state when closing
    setNewExerciseData({
      name: '',
      exercise_type: '',
      muscle_group: '',
      difficulty: '',
      equipment: '',
      primary_muscles: [],
      secondary_muscles: [],
      instructions: '',
      calories_per_minute: '5.0',
      image_url: '',
    });
    setExerciseMediaFiles([]);
    setExerciseMediaPreviews([]);
    setExerciseToEdit(null);
    onCreateExerciseClose();
  };

  const handleNewExerciseChange = (e) => {
    const { name, value, options } = e.target;
    if (name === 'secondary_muscles') {
      // Multi-select
      const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
      setNewExerciseData({
        ...newExerciseData,
        secondary_muscles: selected,
      });
    } else {
      setNewExerciseData({
        ...newExerciseData,
        [name]: value,
      });
      // Update secondary muscle options if muscle_group changes
      if (name === 'muscle_group') {
        // Example: hardcoded, ideally fetch from API or config
        const secondaryMap = {
          '胸': ['三角筋前部', '上腕三頭筋', '小胸筋'],
          '背中': ['広背筋', '僧帽筋', '大円筋', '菱形筋'],
          '肩': ['三角筋中部', '三角筋後部', '棘上筋'],
          '腕': ['上腕二頭筋', '上腕三頭筋', '前腕筋'],
          '脚': ['大腿四頭筋', 'ハムストリング', '腓腹筋', '大臀筋'],
          '腹筋': ['腹直筋', '腹斜筋', '腸腰筋'],
          '全身': ['体幹', '心肺機能'],
        };
        setAvailableSecondaryMuscles(secondaryMap[value] || []);
        setNewExerciseData(prev => ({ ...prev, secondary_muscles: [] }));
      }
    }
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      // Check if it's an image or video
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        newFiles.push(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({
            url: reader.result,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            name: file.name
          });
          
          // Update state when all files are read
          if (newPreviews.length === files.length) {
            setExerciseMediaFiles(prev => [...prev, ...newFiles]);
            setExerciseMediaPreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeMedia = async (index) => {
    const preview = exerciseMediaPreviews[index];
    
    // If it's an existing media (from database) with a valid mediaId, delete it via API
    if (preview.isExisting && preview.mediaId && typeof preview.mediaId === 'number') {
      try {
        await workoutsService.deleteExerciseMedia(preview.mediaId);
        toast({
          title: 'メディアを削除しました',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Delete media error:', error);
        // Only show error toast if it's not a 404 (media already deleted)
        if (error.response?.status !== 404) {
          toast({
            title: '削除に失敗しました',
            description: error.response?.data?.detail || error.response?.data?.error || 'メディアの削除中にエラーが発生しました',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return; // Don't remove from UI if API call failed (except 404)
        }
        // If 404, the media was already deleted, so continue to remove from UI
      }
    }
    
    // Remove from state (for new uploads or if deletion succeeded)
    setExerciseMediaFiles(prev => prev.filter((_, i) => i !== index));
    setExerciseMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare data for backend
      const primaryMuscles = newExerciseData.muscle_group ? [newExerciseData.muscle_group] : [];
      
      // Get URL media
      const urlMedias = exerciseMediaPreviews.filter(p => p.isUrl).map(p => ({
        url: p.originalUrl || p.url,
        type: p.type
      }));
      
      // Use FormData if media files are selected or URL media exists
      let exerciseData;
      if (exerciseMediaFiles.length > 0 || urlMedias.length > 0) {
        exerciseData = new FormData();
        exerciseData.append('name', newExerciseData.name);
        exerciseData.append('description', `${newExerciseData.muscle_group}のエクササイズ`);
        exerciseData.append('exercise_type', newExerciseData.exercise_type);
        exerciseData.append('difficulty', newExerciseData.difficulty);
        exerciseData.append('equipment', newExerciseData.equipment);
        // Send primary_muscles as JSON string
        exerciseData.append('primary_muscles', JSON.stringify(primaryMuscles));
        // Send secondary_muscles as JSON string
        exerciseData.append('secondary_muscles', JSON.stringify(newExerciseData.secondary_muscles || []));
        exerciseData.append('instructions', newExerciseData.instructions);
        exerciseData.append('tips', '');
        exerciseData.append('calories_per_minute', parseFloat(newExerciseData.calories_per_minute) || 5.0);
        
        // Add URL media
        if (urlMedias.length > 0) {
          exerciseData.append('media_urls', JSON.stringify(urlMedias));
        }
        
        // Append all media files
        exerciseMediaFiles.forEach((file, index) => {
          if (file.type.startsWith('image/')) {
            exerciseData.append('images', file);
          } else if (file.type.startsWith('video/')) {
            exerciseData.append('videos', file);
          }
        });
        
        // Keep first image as main image for backward compatibility
        const firstImageFile = exerciseMediaFiles.find(f => f.type.startsWith('image/'));
        if (firstImageFile) {
          exerciseData.append('image', firstImageFile);
        } else if (urlMedias.length > 0 && urlMedias[0].type === 'image') {
          exerciseData.append('image_url', urlMedias[0].url);
        }
      } else {
        exerciseData = {
          name: newExerciseData.name,
          description: `${newExerciseData.muscle_group}のエクササイズ`,
          exercise_type: newExerciseData.exercise_type,
          difficulty: newExerciseData.difficulty,
          equipment: newExerciseData.equipment,
          primary_muscles: primaryMuscles,
          secondary_muscles: newExerciseData.secondary_muscles,
          instructions: newExerciseData.instructions,
          tips: '',
          calories_per_minute: parseFloat(newExerciseData.calories_per_minute) || 5.0,
          image_url: newExerciseData.image_url || '',
        };
      }

      const response = await workoutsService.exercises.create(exerciseData);
      
      toast({
        title: 'エクササイズを作成しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      handleCloseCreateExercise();
      await loadData();
    } catch (error) {
      console.error('Exercise creation error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'エクササイズの作成に失敗しました';
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else {
          errorMessage = errors.detail || JSON.stringify(errors);
        }
      }
      
      toast({
        title: 'エクササイズ作成エラー',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExercise = (exercise) => {
    setExerciseToEdit(exercise);
    setNewExerciseData({
      name: exercise.name,
      exercise_type: exercise.exercise_type || 'strength',
      muscle_group: exercise.primary_muscles && exercise.primary_muscles.length > 0 ? exercise.primary_muscles[0] : '',
      difficulty: exercise.difficulty || 'intermediate',
      equipment: exercise.equipment || 'bodyweight',
      primary_muscles: exercise.primary_muscles || [],
      secondary_muscles: exercise.secondary_muscles || [],
      instructions: exercise.instructions || '',
      calories_per_minute: exercise.calories_per_minute?.toString() || '5.0',
      image_url: exercise.image_url || '',
    });
    
    // Load existing media as previews from media_files
    const existingPreviews = [];
    
    // Load from media_files (new multiple media system)
    if (exercise.media_files && exercise.media_files.length > 0) {
      exercise.media_files.forEach(media => {
        // Check if this is a URL-based media (file field contains http:// or https://)
        const isUrl = typeof media.file === 'string' && (media.file.startsWith('http://') || media.file.startsWith('https://'));
        
        // Convert YouTube watch URL to embed URL if needed
        let displayUrl = isUrl ? media.file : getImageUrl(media.file);
        if (isUrl && media.media_type === 'video' && displayUrl.includes('youtube.com/watch')) {
          const urlObj = new URL(displayUrl);
          const videoId = urlObj.searchParams.get('v');
          if (videoId) {
            displayUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        }
        
        existingPreviews.push({
          url: displayUrl,
          type: media.media_type,
          name: media.caption || `existing-${media.media_type}`,
          isExisting: true,
          isUrl: isUrl,
          mediaId: media.id
        });
      });
    } else if (exercise.image) {
      // Fallback to old single image field
      existingPreviews.push({
        url: getImageUrl(exercise.image),
        type: 'image',
        name: 'existing-image',
        isExisting: true,
        isUrl: false
      });
    }
    
    setExerciseMediaPreviews(existingPreviews);
    setExerciseMediaFiles([]);
    onEditExerciseOpen();
  };

  const handleCloseEditExercise = () => {
    // Reset all form state
    setNewExerciseData({
      name: '',
      exercise_type: '',
      muscle_group: '',
      difficulty: 'intermediate',
      equipment: 'bodyweight',
      primary_muscles: [],
      secondary_muscles: [],
      instructions: '',
      calories_per_minute: '5.0',
      image_url: '',
    });
    setExerciseMediaFiles([]);
    setExerciseMediaPreviews([]);
    setExerciseToEdit(null);
    onEditExerciseClose();
  };

  const handleUpdateExercise = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const primaryMuscles = newExerciseData.muscle_group ? [newExerciseData.muscle_group] : [];
      
      // Get only NEW URL media (not existing ones)
      const urlMedias = exerciseMediaPreviews
        .filter(p => p.isUrl && !p.isExisting)
        .map(p => ({
          url: p.originalUrl || p.url,
          type: p.type
        }));
      
      let exerciseData;
      if (exerciseMediaFiles.length > 0 || urlMedias.length > 0) {
        exerciseData = new FormData();
        exerciseData.append('name', newExerciseData.name);
        exerciseData.append('description', `${newExerciseData.muscle_group}のエクササイズ`);
        exerciseData.append('exercise_type', newExerciseData.exercise_type);
        exerciseData.append('difficulty', newExerciseData.difficulty);
        exerciseData.append('equipment', newExerciseData.equipment);
        exerciseData.append('primary_muscles', JSON.stringify(primaryMuscles));
        exerciseData.append('secondary_muscles', JSON.stringify(newExerciseData.secondary_muscles || []));
        exerciseData.append('instructions', newExerciseData.instructions);
        exerciseData.append('tips', '');
        exerciseData.append('calories_per_minute', parseFloat(newExerciseData.calories_per_minute) || 5.0);
        
        // Add URL media
        if (urlMedias.length > 0) {
          exerciseData.append('media_urls', JSON.stringify(urlMedias));
        }
        
        // Append all media files
        exerciseMediaFiles.forEach((file, index) => {
          if (file.type.startsWith('image/')) {
            exerciseData.append('images', file);
          } else if (file.type.startsWith('video/')) {
            exerciseData.append('videos', file);
          }
        });
        
        // Keep first image as main image for backward compatibility
        const firstImageFile = exerciseMediaFiles.find(f => f.type.startsWith('image/'));
        if (firstImageFile) {
          exerciseData.append('image', firstImageFile);
        } else if (urlMedias.length > 0 && urlMedias[0].type === 'image') {
          exerciseData.append('image_url', urlMedias[0].url);
        }
      } else {
        exerciseData = {
          name: newExerciseData.name,
          description: `${newExerciseData.muscle_group}のエクササイズ`,
          exercise_type: newExerciseData.exercise_type,
          difficulty: newExerciseData.difficulty,
          equipment: newExerciseData.equipment,
          primary_muscles: primaryMuscles,
          secondary_muscles: newExerciseData.secondary_muscles,
          instructions: newExerciseData.instructions,
          tips: '',
          calories_per_minute: parseFloat(newExerciseData.calories_per_minute) || 5.0,
          image_url: newExerciseData.image_url || '',
        };
      }

      await workoutsService.exercises.update(exerciseToEdit.id, exerciseData);
      
      toast({
        title: 'エクササイズを更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      handleCloseEditExercise();
      await loadData();
      setNewExerciseData({
        name: '',
        exercise_type: '',
        muscle_group: '',
        difficulty: 'intermediate',
        equipment: 'bodyweight',
        primary_muscles: [],
        secondary_muscles: [],
        instructions: '',
        calories_per_minute: '5.0',
        image_url: '',
      });
      setExerciseMediaFiles([]);
      setExerciseMediaPreviews([]);
    } catch (error) {
      console.error('Exercise update error:', error);
      
      let errorMessage = 'エクササイズの更新に失敗しました';
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else {
          errorMessage = errors.detail || JSON.stringify(errors);
        }
      }
      
      toast({
        title: 'エクササイズ更新エラー',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditWorkout = (workout) => {
    setWorkoutToEdit(workout);
    const durationValue = workout.duration_minutes || workout.duration || '';
    
    setFormData({
      name: workout.name || '',
      date: workout.date || '',
      duration: String(durationValue),
      notes: workout.notes || '',
    });
    setSelectedExercises(workout.exercises?.map(ex => ({
      id: ex.exercise?.id || ex.exercise_id,
      name: ex.exercise?.name || ex.name,
      sets: ex.planned_sets || ex.sets || 3,
      reps: ex.planned_reps || ex.reps || 10,
      weight: ex.planned_weight_kg || ex.weight || 0,
    })) || []);
    onEditWorkoutOpen();
  };

  const handleUpdateWorkout = async (e) => {
    e.preventDefault();
    if (selectedExercises.length === 0) {
      toast({
        title: 'エクササイズが選択されていません',
        description: '少なくとも1つのエクササイズを追加してください',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);

    try {
      // Calculate total calories
      const totalCalories = calculateTotalCalories();
      
      const workoutData = {
        name: formData.name,
        date: formData.date,
        duration_minutes: parseInt(formData.duration) || 0,
        calories_burned: totalCalories,
        notes: formData.notes,
        exercises: selectedExercises.map((ex, index) => ({
          exercise_id: ex.id,
          order: index + 1,
          planned_sets: ex.sets || 3,
          planned_reps: ex.reps || 10,
          planned_weight_kg: ex.weight || 0,
        })),
      };

      await workoutsService.workouts.update(workoutToEdit.id, workoutData);
      toast({
        title: 'ワークアウトを更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onEditWorkoutClose();
      await loadData();
      setSelectedExercises([]);
      setWorkoutToEdit(null);
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        notes: '',
      });
    } catch (error) {
      console.error('Workout update error:', error);
      toast({
        title: 'ワークアウト更新エラー',
        description: error.response?.data?.detail || 'ワークアウトの更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenExerciseMedia = (exercise) => {
    setExerciseMediaView(exercise);
    setCurrentMediaIndex(0);
    onExerciseMediaOpen();
  };

  const handleNextMedia = () => {
    if (exerciseMediaView && exerciseMediaView.media_files) {
      setCurrentMediaIndex((prev) => 
        prev < exerciseMediaView.media_files.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handlePrevMedia = () => {
    if (exerciseMediaView && exerciseMediaView.media_files) {
      setCurrentMediaIndex((prev) => 
        prev > 0 ? prev - 1 : exerciseMediaView.media_files.length - 1
      );
    }
  };

  const handleCompleteWorkout = async (workout) => {
    setSubmitting(true);
    try {
      // First, save current progress before completing
      const currentPercentage = getWorkoutCompletionPercentage(workout);
      
      // Build complete exercise checks object with all exercises (including unchecked ones)
      const completeExerciseChecks = {};
      workout.exercises.forEach((exercise, index) => {
        const exerciseKey = `${selectedDate.toISOString().split('T')[0]}-${index}`;
        const isChecked = checkedExercises[exerciseKey]?.checked || false;
        
        completeExerciseChecks[exerciseKey] = {
          checked: isChecked,
          exercise_name: exercise.exercise?.name || exercise.name || 'エクササイズ',
          muscle_group: exercise.exercise?.primary_muscles?.[0] || exercise.muscle_group || 'コンパウンド',
          sets: exercise.planned_sets || exercise.sets || 0,
          reps: exercise.planned_reps || exercise.reps || 0,
          weight: exercise.planned_weight_kg || exercise.weight || 0
        };
      });
      
      // Save progress and complete workout
      await Promise.all([
        workoutsService.workouts.updateProgress(workout.id, {
          progress_percentage: currentPercentage,
          exercise_checks: completeExerciseChecks
        }),
        workoutsService.workouts.complete(workout.id)
      ]);
      
      toast({
        title: 'ワークアウトを完了しました',
        description: 'お疲れ様でした！',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      await loadData();
      onCompleteWorkoutClose();
    } catch (error) {
      console.error('Complete workout error:', error);
      toast({
        title: '完了に失敗しました',
        description: error.response?.data?.detail || 'もう一度お試しください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCompleteWorkout = (workout) => {
    setWorkoutToComplete(workout);
    onCompleteWorkoutOpen();
  };

  const handleOpenDeleteOptions = (workout) => {
    setWorkoutToDelete(workout);
    setDeleteOption('today'); // Reset to default
    onDeleteOptionsOpen();
  };

  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    
    setSubmitting(true);
    try {
      let workoutsToDelete = [workoutToDelete];
      
      if (deleteOption === 'today') {
        // 今日だけ削除 - 既存の単一削除
        workoutsToDelete = [workoutToDelete];
      } else if (deleteOption === 'recurring') {
        // 同じ曜日の今後の分を削除（今日を含む）
        const targetDate = new Date(workoutToDelete.date);
        // 時間情報を除去して日付のみで比較
        targetDate.setHours(0, 0, 0, 0);
        const targetDayOfWeek = targetDate.getDay(); // 0=Sunday, 1=Monday, etc.
        
        // 今日以降の同じ曜日のワークアウトを取得（名前に関係なく）
        workoutsToDelete = workouts.filter(workout => {
          const workoutDate = new Date(workout.date);
          // 時間情報を除去して日付のみで比較
          workoutDate.setHours(0, 0, 0, 0);
          
          const isSameOrAfterDate = workoutDate >= targetDate;
          const isSameDayOfWeek = workoutDate.getDay() === targetDayOfWeek;
          
          return isSameOrAfterDate && isSameDayOfWeek;
        });
      } else if (deleteOption === 'all') {
        // 今日以降すべて削除
        const targetDate = new Date(workoutToDelete.date);
        // 時間情報を除去して日付のみで比較
        targetDate.setHours(0, 0, 0, 0);
        
        // 今日以降のすべてのワークアウトを取得（名前に関係なく）
        workoutsToDelete = workouts.filter(workout => {
          const workoutDate = new Date(workout.date);
          // 時間情報を除去して日付のみで比較
          workoutDate.setHours(0, 0, 0, 0);
          
          const isSameOrAfterDate = workoutDate >= targetDate;
          
          return isSameOrAfterDate;
        });
      }
      
      if (workoutsToDelete.length === 0) {
        toast({
          title: '削除対象が見つかりませんでした',
          description: '条件に合うワークアウトがありません',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // 削除を実行
      for (const workout of workoutsToDelete) {
        await workoutsService.workouts.delete(workout.id);
      }
      
      toast({
        title: `${workoutsToDelete.length}件のワークアウトを削除しました`,
        description: deleteOption === 'today' ? 'ワークアウトを削除しました' :
                    deleteOption === 'recurring' ? '同じ曜日の今後のワークアウトを削除しました' :
                    '今日以降のすべてのワークアウトを削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setWorkoutToDelete(null);
      setDeleteOption('today'); // Reset to default
      onDeleteWorkoutClose();
      await loadData();
    } catch (error) {
      console.error('Delete workout error:', error);
      toast({
        title: '削除に失敗しました',
        description: error.response?.data?.detail || 'もう一度お試しください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreatePlan = () => {
    setNewPlanData({
      name: '',
      description: '',
      goal: '',
      difficulty: '',
      duration_weeks: '',
      days_per_week: '',
      overview: '',
      requirements: '',
    });
    onCreatePlanOpen();
  };

  const handleNewPlanChange = (e) => {
    const { name, value } = e.target;
    setNewPlanData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStartPlan = async () => {
    if (!planToStart) return;
    
    // Check if there's already an active schedule
    if (activeSchedule) {
      const activePlan = activeSchedule.workout_plan;
      const activeEndDate = new Date(activeSchedule.start_date);
      activeEndDate.setDate(activeEndDate.getDate() + (activePlan.duration_weeks * 7));
      
      const newStartDate = new Date(planStartDate);
      const newEndDate = new Date(planStartDate);
      newEndDate.setDate(newEndDate.getDate() + (planToStart.duration_weeks * 7));
      
      // Check for overlap
      const activeStart = new Date(activeSchedule.start_date);
      if ((newStartDate >= activeStart && newStartDate < activeEndDate) ||
          (newEndDate > activeStart && newEndDate <= activeEndDate) ||
          (newStartDate <= activeStart && newEndDate >= activeEndDate)) {
        toast({
          title: '期間が重複しています',
          description: `現在「${activePlan.name}」が実行中です（${activeSchedule.start_date} 〜 ${activeEndDate.toISOString().split('T')[0]}）。先に既存のプログラムを完了または終了してください。`,
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
        return;
      }
    }
    
    setSubmitting(true);
    try {
      await workoutsService.workoutPlans.schedule(planToStart.id, planStartDate);
      
      toast({
        title: 'プランを開始しました',
        description: `「${planToStart.name}」を${planStartDate}から開始します`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setPlanToStart(null);
      onStartPlanClose();
      await loadData();
    } catch (error) {
      console.error('Start plan error:', error);
      toast({
        title: 'プラン開始エラー',
        description: error.response?.data?.detail || 'プランの開始に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStopSchedule = async () => {
    if (!activeSchedule) return;
    
    setSubmitting(true);
    try {
      await workoutsService.schedules.deactivate(activeSchedule.id);
      
      toast({
        title: 'プログラムを終了しました',
        description: `「${activeSchedule.workout_plan.name}」を終了しました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onStopPlanClose();
      await loadData();
    } catch (error) {
      console.error('Stop schedule error:', error);
      toast({
        title: 'プログラム終了エラー',
        description: error.response?.data?.detail || 'プログラムの終了に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const planData = {
        ...newPlanData,
        duration_weeks: parseInt(newPlanData.duration_weeks),
        days_per_week: parseInt(newPlanData.days_per_week),
      };

      await workoutsService.workoutPlans.create(planData);
      
      toast({
        title: 'ワークアウトプランを作成しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onCreatePlanClose();
      await loadData();
    } catch (error) {
      console.error('Plan creation error:', error);
      
      let errorMessage = 'プランの作成に失敗しました';
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else {
          errorMessage = errors.detail || JSON.stringify(errors);
        }
      }
      
      toast({
        title: 'プラン作成エラー',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedExercises.length === 0) {
      toast({
        title: 'エクササイズが選択されていません',
        description: '少なくとも1つのエクササイズを追加してください',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if the selected date is in the past
    const selectedDateFromForm = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDateFromForm < today) {
      toast({
        title: '過去の日付にはワークアウトを追加できません',
        description: '今日以降の日付を選択してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate repeat settings
    if (formData.repeat_type !== 'none') {
      if (!formData.repeat_until) {
        toast({
          title: '繰り返し終了日が指定されていません',
          description: '繰り返しを設定する場合は終了日を指定してください',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const repeatUntilDate = new Date(formData.repeat_until);
      if (repeatUntilDate < selectedDateFromForm) {
        toast({
          title: '終了日は開始日以降にしてください',
          description: '繰り返しの終了日は開始日より後の日付を選択してください',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Validate weekly days selection
      if (formData.repeat_type === 'weekly' && formData.weekly_days.length === 0) {
        setWeeklyDaysError('少なくとも1つの曜日を選択してください');
        toast({
          title: '繰り返す曜日が選択されていません',
          description: '毎週繰り返しの場合は、少なくとも1つの曜日を選択してください',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      // Generate dates for repeat
      const dates = [];
      const startDate = new Date(formData.date);
      const endDate = formData.repeat_type !== 'none' ? new Date(formData.repeat_until) : startDate;

      if (formData.repeat_type === 'daily') {
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (formData.repeat_type === 'weekly') {
        // For weekly, find all dates that match the selected days of the week
        let currentDate = new Date(startDate);
        
        // If start date's day is not in selected days, move to the next occurrence
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          if (formData.weekly_days.includes(dayOfWeek)) {
            dates.push(new Date(currentDate));
          }
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // For 'none', only add the start date
        dates.push(startDate);
      }

      // Create workouts for each date
      const workoutPromises = dates.map(date => {
        const workoutData = {
          name: formData.name, // 日付を追加せずベース名のみ保存
          date: date.toISOString().split('T')[0],
          duration_minutes: parseInt(formData.duration) || 0,
          calories_burned: calculateTotalCalories(),
          notes: formData.notes,
          exercises: selectedExercises.map((ex, index) => ({
            exercise_id: ex.id,
            order: index + 1,
            planned_sets: ex.sets || 3,
            planned_reps: ex.reps || 10,
            planned_weight_kg: ex.weight || 0,
          })),
        };
        return workoutsService.workouts.create(workoutData);
      });

      await Promise.all(workoutPromises);
      
      // Reload data first before closing modal
      await loadData();
      
      const repeatText = formData.repeat_type !== 'none' ? 
        ` (${dates.length}日分のワークアウトを${formData.repeat_type === 'daily' ? '毎日' : formData.repeat_type === 'weekly' ? `毎週(${formData.weekly_days.map(day => ['日', '月', '火', '水', '木', '金', '土'][day]).join(', ')})` : ''}繰り返しで記録しました)` : '';
      
      toast({
        title: 'ワークアウトを記録しました',
        description: repeatText,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form state
      setSelectedExercises([]);
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        notes: '',
        repeat_type: 'none',
        repeat_until: '',
        weekly_days: [],
      });
      setWeeklyDaysError('');
      
      // Close modal after everything is done
      onClose();
    } catch (error) {
      console.error('Workout creation error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'ワークアウトの記録に失敗しました';
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else {
          errorMessage = errors.detail || JSON.stringify(errors);
        }
      }
      
      toast({
        title: 'ワークアウト記録エラー',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const todayWorkouts = workouts.filter(workout =>
    workout.date === new Date().toISOString().split('T')[0]
  );

  // Calculate workouts for the displayed week (currentWeekStart to currentWeekStart + 6 days)
  const thisWeekWorkouts = workouts.filter(workout => {
    const workoutDateStr = workout.date; // 'YYYY-MM-DD' format
    const weekStartStr = currentWeekStart.toISOString().split('T')[0];
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // 7 days (Monday to Sunday)
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    return workoutDateStr >= weekStartStr && workoutDateStr <= weekEndStr;
  });

  const completedThisWeek = thisWeekWorkouts.filter(w => w.completed).length;
  const totalThisWeek = thisWeekWorkouts.length;

  const totalDuration = thisWeekWorkouts.reduce((total, workout) => total + (workout.duration_minutes || workout.duration || 0), 0);
  const totalCalories = thisWeekWorkouts.reduce((total, workout) => {
    const calories = Number(workout.total_calories_burned || workout.calories_burned || 0);
    return total + (isNaN(calories) ? 0 : calories);
  }, 0);

  const weekDays = getWeekDays(currentWeekStart);
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDateWorkouts = workouts.filter(workout => workout.date === selectedDateStr);

  // Check if selected date is in the past (before today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPastDate = selectedDate < today;

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const navigateWeek = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newWeekStart);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeekStart(getWeekStart(today));
    setSelectedDate(today);
  };

  const getWorkoutForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return workouts.filter(w => w.date === dateStr);
  };

  const getExerciseColor = (index) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'red', 'teal', 'cyan'];
    return colors[index % colors.length];
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
      <Box mb={{ base: 4, md: 6 }}>
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} mb={4} flexDirection={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
          <Box flex="1">
            <Heading size={{ base: "md", md: "lg" }} mb={1}>ワークアウト計画</Heading>
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">フィットネスの旅を計画して追跡</Text>
          </Box>
          <HStack spacing={{ base: 2, md: 3 }} w={{ base: "full", md: "auto" }} flexWrap={{ base: "wrap", sm: "nowrap" }}>
            <Button 
              colorScheme="brand" 
              onClick={handleOpenWorkoutModal} 
              size={{ base: "sm", md: "md" }} 
              flex={{ base: 1, sm: "none" }}
              minW={{ base: "auto", sm: "140px" }}
            >
              <Icon as={FiPlus} mr={{ base: 1, md: 2 }} />
              <Text display={{ base: "none", sm: "inline" }}>ワークアウトを作成</Text>
              <Text display={{ base: "inline", sm: "none" }}>作成</Text>
            </Button>
          </HStack>
        </Flex>

        {/* Tabs */}
        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="brand" variant="enclosed">
          <TabList overflowX="auto" overflowY="hidden" flexWrap="nowrap" css={{
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#CBD5E0',
              borderRadius: '4px',
            },
          }}>
            <Tab fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">スケジュール</Tab>
            <Tab fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">エクササイズ</Tab>
            <Tab fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">プラン</Tab>
            <Tab fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">履歴</Tab>
          </TabList>
        </Tabs>
      </Box>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={{ base: 3, md: 4, lg: 6 }}>
        {/* Main Content */}
        <Box>
          {activeTab === 0 && (
            <VStack spacing={6} align="stretch">
              {/* Week Navigation */}
              <Card bg={bgColor}>
                <CardBody p={{ base: 3, md: 4, lg: 6 }}>
                  <Flex justify="space-between" align="center" mb={{ base: 3, md: 4 }} gap={2}>
                    <IconButton
                      icon={<FiChevronLeft />}
                      variant="ghost"
                      onClick={() => navigateWeek(-1)}
                      aria-label="前の週"
                      size={{ base: "sm", md: "md" }}
                      flexShrink={0}
                    />
                    <VStack spacing={2}>
                      <Heading size={{ base: "xs", sm: "sm", md: "md" }} textAlign="center" px={2}>
                        {currentWeekStart.getFullYear()}年{currentWeekStart.getMonth() + 1}月
                        {currentWeekStart.getDate()}日〜{weekDays[6].getDate()}日の週
                      </Heading>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="brand"
                        onClick={goToToday}
                        leftIcon={<FaCalendar />}
                      >
                        今日
                      </Button>
                    </VStack>
                    <IconButton
                      icon={<FiChevronRight />}
                      variant="ghost"
                      onClick={() => navigateWeek(1)}
                      aria-label="次の週"
                      size={{ base: "sm", md: "md" }}
                      flexShrink={0}
                    />
                  </Flex>

                  {/* Days Grid */}
                  <Grid templateColumns="repeat(7, 1fr)" gap={{ base: 1, sm: 2 }}>
                    {dayNames.map((day, idx) => (
                      <Box 
                        key={idx} 
                        textAlign="center" 
                        fontSize={{ base: "xs", md: "sm" }} 
                        fontWeight="semibold" 
                        color="gray.600" 
                        py={{ base: 1, md: 2 }}
                      >
                        {day}
                      </Box>
                    ))}
                    {weekDays.map((date, idx) => {
                      const dayWorkouts = getWorkoutForDate(date);
                      const isTodayDate = isToday(date);
                      const isSelected = isSelectedDate(date);
                      const isCompleted = dayWorkouts.length > 0 && dayWorkouts[0].completed;
                      const isPlanned = dayWorkouts.length > 0 && !dayWorkouts[0].completed;
                      const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));
                      const isMissed = isPlanned && isPastDate;

                      return (
                        <Box
                          key={idx}
                          bg={isSelected ? 'brand.100' : isCompleted ? 'green.50' : isMissed ? 'red.50' : isPlanned ? 'blue.50' : hoverBg}
                          border={isSelected ? '2px solid' : dayWorkouts.length > 0 ? '2px solid' : 'none'}
                          borderColor={isSelected ? 'brand.500' : isCompleted ? 'green.500' : isMissed ? 'red.500' : isPlanned ? 'blue.500' : 'transparent'}
                          borderRadius={{ base: "md", md: "lg" }}
                          p={{ base: 2, sm: 2.5, md: 3 }}
                          textAlign="center"
                          cursor="pointer"
                          _hover={{ bg: isSelected ? 'brand.100' : 'gray.100' }}
                          onClick={() => setSelectedDate(date)}
                          minH={{ base: "70px", sm: "80px", md: "90px" }}
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text 
                            fontSize={{ base: "xs", sm: "sm", md: "md" }} 
                            fontWeight="semibold" 
                            color={isSelected ? 'brand.600' : 'gray.900'}
                            mb={1}
                          >
                            {date.getDate()}
                          </Text>
                          {isTodayDate ? (
                            <>
                              <Icon as={FiActivity} color="brand.500" boxSize={{ base: 3, sm: 4 }} />
                              <Text fontSize={{ base: "2xs", sm: "xs" }} color="brand.600" fontWeight="semibold" mt={1} display={{ base: "none", sm: "block" }}>
                                今日
                              </Text>
                            </>
                          ) : isCompleted ? (
                            <>
                              <Icon as={FiCheck} color="green.600" boxSize={{ base: 3, sm: 4 }} />
                              <Text fontSize={{ base: "2xs", sm: "xs" }} color="green.600" mt={1} noOfLines={1} maxW="100%" display={{ base: "none", sm: "block" }}>
                                {dayWorkouts[0].name.substring(0, 6)}
                              </Text>
                            </>
                          ) : isMissed ? (
                            <>
                              <Icon as={FiX} color="red.600" boxSize={{ base: 3, sm: 4 }} />
                              <Text fontSize={{ base: "2xs", sm: "xs" }} color="red.600" mt={1} noOfLines={1} maxW="100%" display={{ base: "none", sm: "block" }}>
                                未完了
                              </Text>
                            </>
                          ) : isPlanned ? (
                            <>
                              <Icon as={FiCheck} color="blue.600" boxSize={{ base: 3, sm: 4 }} />
                              <Text fontSize={{ base: "2xs", sm: "xs" }} color="blue.600" mt={1} noOfLines={1} maxW="100%" display={{ base: "none", sm: "block" }}>
                                計画済み
                              </Text>
                            </>
                          ) : (
                            <Text fontSize={{ base: "2xs", sm: "xs" }} color="gray.400" mt={1} display={{ base: "none", sm: "block" }}>
                              休息
                            </Text>
                          )}
                        </Box>
                      );
                    })}
                  </Grid>
                </CardBody>
              </Card>

              {/* Today's Workout */}
              <Card bg={bgColor}>
                <CardBody p={{ base: 4, md: 6 }}>
                  <Flex 
                    justify="space-between" 
                    align={{ base: "flex-start", md: "center" }} 
                    mb={{ base: 4, md: 6 }} 
                    direction={{ base: "column", md: "row" }}
                    gap={{ base: 3, md: 0 }}
                  >
                    <Box flex="1">
                      <Flex align="center" gap={2} mb={1}>
                        <Heading size={{ base: "sm", md: "md" }}>
                          {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日のワークアウト
                        </Heading>
                        {selectedDateWorkouts.length > 0 && selectedDateWorkouts[0].completed && (
                          <Badge colorScheme="green" fontSize={{ base: "xs", md: "sm" }}>
                            <Flex align="center" gap={1}>
                              <Icon as={FiCheck} />
                              完了
                            </Flex>
                          </Badge>
                        )}
                        {selectedDateWorkouts.length > 0 && isTodayDate(selectedDate) && !selectedDateWorkouts[0].completed && (
                          <Badge 
                            colorScheme={getWorkoutCompletionPercentage(selectedDateWorkouts[0]) === 100 ? "green" : "blue"} 
                            fontSize={{ base: "xs", md: "sm" }}
                          >
                            {getWorkoutCompletionPercentage(selectedDateWorkouts[0])}%
                          </Badge>
                        )}
                      </Flex>
                      <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                        {selectedDateWorkouts.length > 0 ? selectedDateWorkouts[0].name : 'ワークアウトが計画されていません'}
                      </Text>
                    </Box>
                    {selectedDateWorkouts.length > 0 && (
                      <HStack spacing={2}>
                        {!selectedDateWorkouts[0].completed && selectedDate <= new Date() && !isPastDate && hasCheckedExercises(selectedDateWorkouts[0]) && (
                          <IconButton 
                            icon={<FiCheck />} 
                            colorScheme="green"
                            aria-label="完了" 
                            onClick={() => handleOpenCompleteWorkout(selectedDateWorkouts[0])}
                            size={{ base: "sm", md: "md" }}
                          />
                        )}
                        <IconButton 
                          icon={<FiEdit />} 
                          aria-label="編集" 
                          isDisabled={selectedDateWorkouts[0].completed || isPastDate}
                          onClick={() => handleEditWorkout(selectedDateWorkouts[0])}
                          size={{ base: "sm", md: "md" }}
                        />
                        <IconButton 
                          icon={<FiTrash2 />} 
                          colorScheme="red" 
                          aria-label="削除" 
                          isDisabled={selectedDateWorkouts[0].completed || isPastDate}
                          onClick={() => {
                            if (selectedDateWorkouts[0].completed) {
                              toast({
                                title: '完了したワークアウトは削除できません',
                                description: '完了済みのワークアウトは削除できません',
                                status: 'warning',
                                duration: 3000,
                                isClosable: true,
                              });
                              return;
                            }
                            if (isPastDate) {
                              toast({
                                title: '過去の日付のワークアウトは削除できません',
                                description: '過去の日付のワークアウトは削除できません',
                                status: 'warning',
                                duration: 3000,
                                isClosable: true,
                              });
                              return;
                            }
                            handleOpenDeleteOptions(selectedDateWorkouts[0]);
                          }}
                          size={{ base: "sm", md: "md" }}
                        />
                      </HStack>
                    )}
                  </Flex>

                  {selectedDateWorkouts.length > 0 ? (
                    <>
                      {/* Workout Info */}
                      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={{ base: 2, md: 4 }} mb={{ base: 4, md: 6 }} p={{ base: 3, md: 4 }} bg={hoverBg} borderRadius="lg">
                        <VStack spacing={{ base: 1, md: 2 }}>
                          <Icon as={FiClock} color="brand.600" boxSize={{ base: 4, md: 5 }} />
                          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">時間</Text>
                          <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>{selectedDateWorkouts[0].duration_minutes || selectedDateWorkouts[0].duration || 0}分</Text>
                        </VStack>
                        <VStack spacing={{ base: 1, md: 2 }}>
                          <Icon as={FiActivity} color="orange.600" boxSize={{ base: 4, md: 5 }} />
                          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">推定カロリー</Text>
                          <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>{selectedDateWorkouts[0].total_calories_burned || selectedDateWorkouts[0].calories_burned || 0} kcal</Text>
                        </VStack>
                        <VStack spacing={{ base: 1, md: 2 }}>
                          <Icon as={FiList} color="purple.600" boxSize={{ base: 4, md: 5 }} />
                          <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">エクササイズ</Text>
                          <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>{selectedDateWorkouts[0].exercises?.length || 0}種目</Text>
                        </VStack>
                      </SimpleGrid>

                      {/* Exercise List */}
                      <VStack spacing={{ base: 2, md: 4 }} align="stretch">
                        {selectedDateWorkouts[0].exercises?.map((exercise, idx) => (
                          <Box
                            key={idx}
                            borderLeft="4px solid"
                            borderColor={`${getExerciseColor(idx)}.500`}
                            bg={hoverBg}
                            borderRadius="lg"
                            p={{ base: 3, md: 4 }}
                          >
                            <Flex align="start" justify="space-between" gap={{ base: 2, md: 0 }}>
                              <Flex align="start" flex="1" gap={{ base: 2, md: 4 }}>
                                <Checkbox
                                  isChecked={getExerciseCheckStatus(exercise.id, idx)}
                                  onChange={() => toggleExerciseCheck(exercise.id, idx)}
                                  colorScheme={getExerciseColor(idx)}
                                  size={{ base: "md", md: "lg" }}
                                  flexShrink={0}
                                  alignSelf="center"
                                  isDisabled={isCheckboxDisabled()}
                                />
                                <Box
                                  bg={`${getExerciseColor(idx)}.500`}
                                  color="white"
                                  borderRadius="full"
                                  w={{ base: 6, md: 8 }}
                                  h={{ base: 6, md: 8 }}
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  fontWeight="bold"
                                  fontSize={{ base: "xs", md: "sm" }}
                                  flexShrink={0}
                                >
                                  {idx + 1}
                                </Box>
                                <Box flex="1" minW="0">
                                  <Heading size={{ base: "xs", md: "sm" }} mb={1} noOfLines={1}>
                                    {exercise.exercise?.name || exercise.name || 'エクササイズ'}
                                  </Heading>
                                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" mb={2} noOfLines={1}>
                                    {exercise.exercise?.primary_muscles?.[0] || exercise.muscle_group || 'コンパウンド'}
                                  </Text>
                                  <HStack spacing={{ base: 2, md: 4 }} fontSize={{ base: "xs", md: "sm" }} flexWrap="wrap">
                                    <Badge colorScheme="gray" fontSize={{ base: "2xs", md: "xs" }}>
                                      <Icon as={FiActivity} mr={1} />
                                      {exercise.planned_sets || exercise.sets || 0}セット
                                    </Badge>
                                    <Badge colorScheme="gray" fontSize={{ base: "2xs", md: "xs" }}>
                                      #{exercise.planned_reps || exercise.reps || 0}回
                                    </Badge>
                                    <Badge colorScheme="gray" fontSize={{ base: "2xs", md: "xs" }}>
                                      {exercise.planned_weight_kg || exercise.weight || 0} kg
                                    </Badge>
                                  </HStack>
                                </Box>
                              </Flex>
                              <IconButton
                                icon={<FiInfo />}
                                variant="ghost"
                                colorScheme={getExerciseColor(idx)}
                                aria-label="詳細"
                                size={{ base: "sm", md: "md" }}
                                onClick={() => handleOpenExerciseMedia(exercise.exercise || exercise)}
                                flexShrink={0}
                              />
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    </>
                  ) : (
                    <Center py={12}>
                      <VStack spacing={4}>
                        <Icon as={FiActivity} boxSize={16} color="gray.300" />
                        <Text color="gray.600" fontWeight="medium" fontSize="lg">
                          {isPastDate ? '過去の日付のため、ワークアウトを追加できません' : 'ワークアウトが計画されていません'}
                        </Text>
                        <Text fontSize="sm" color="gray.500" textAlign="center">
                          {isPastDate ? '過去の日付にはワークアウトを追加できません' : '「ワークアウトを作成」ボタンから新しいワークアウトを追加しましょう'}
                        </Text>
                        {!isPastDate && (
                          <Button colorScheme="brand" onClick={handleOpenWorkoutModal} mt={2}>
                            <Icon as={FiPlus} mr={2} />
                            ワークアウトを作成
                          </Button>
                        )}
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>
            </VStack>
          )}

          {activeTab === 1 && (
            <Card bg={bgColor}>
              <CardHeader p={{ base: 4, md: 6 }}>
                <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
                  <Heading size={{ base: "sm", md: "md" }}>エクササイズライブラリ</Heading>
                  <Button
                    size={{ base: "sm", md: "md" }}
                    colorScheme="brand"
                    leftIcon={<FiPlus />}
                    onClick={handleOpenCreateExercise}
                    w={{ base: "full", md: "auto" }}
                  >
                    エクササイズを追加
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody p={{ base: 3, md: 6 }}>
                {exercises.length > 0 ? (
                  <>
                    <VStack spacing={{ base: 2, md: 3 }} align="stretch">
                      {(() => {
                        const startIndex = (exerciseCurrentPage - 1) * exerciseItemsPerPage;
                        const endIndex = startIndex + exerciseItemsPerPage;
                        return exercises.slice(startIndex, endIndex).map((exercise) => (
                      <Box
                        key={exercise.id}
                        p={{ base: 3, md: 4 }}
                        borderWidth="1px"
                        borderRadius="lg"
                        _hover={{ bg: hoverBg }}
                      >
                        <Flex justify="space-between" align="center" gap={{ base: 2, md: 3 }} direction={{ base: "row", md: "row" }} flexWrap={{ base: "nowrap", md: "nowrap" }}>
                          {/* Exercise Image */}
                          <Box flexShrink={0}>
                            {(() => {
                              // Check for media_files first (new system), then fallback to old image fields
                              const firstMedia = exercise.media_files && exercise.media_files.length > 0 ? exercise.media_files[0] : null;
                              
                              if (firstMedia) {
                                const fileStr = String(firstMedia.file);
                                const isUrl = fileStr.startsWith('http://') || fileStr.startsWith('https://');
                                
                                if (firstMedia.media_type === 'image') {
                                  return (
                                    <Box position="relative" boxSize={{ base: "50px", md: "60px" }}>
                                      <Image
                                        src={isUrl ? fileStr : getImageUrl(firstMedia.file)}
                                        alt={exercise.name}
                                        boxSize={{ base: "50px", md: "60px" }}
                                        objectFit="cover"
                                        borderRadius="md"
                                        fallback={
                                          <Box
                                            boxSize={{ base: "50px", md: "60px" }}
                                            bg="gray.100"
                                            borderRadius="md"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                          >
                                            <Icon as={FiImage} color="gray.400" boxSize={{ base: 5, md: 6 }} />
                                          </Box>
                                        }
                                      />
                                    </Box>
                                  );
                                } else {
                                  // Video thumbnail
                                  if (isUrl && (fileStr.includes('youtube.com') || fileStr.includes('youtu.be'))) {
                                    // YouTube thumbnail
                                    let videoId = '';
                                    if (fileStr.includes('youtube.com/embed/')) {
                                      videoId = fileStr.split('youtube.com/embed/')[1].split('?')[0];
                                    } else if (fileStr.includes('youtube.com/watch')) {
                                      const urlObj = new URL(fileStr);
                                      videoId = urlObj.searchParams.get('v');
                                    } else if (fileStr.includes('youtu.be/')) {
                                      videoId = fileStr.split('youtu.be/')[1].split('?')[0];
                                    }
                                    
                                    return (
                                      <Box position="relative" boxSize={{ base: "50px", md: "60px" }}>
                                        <Image
                                          src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
                                          alt={exercise.name}
                                          boxSize={{ base: "50px", md: "60px" }}
                                          objectFit="cover"
                                          borderRadius="md"
                                        />
                                        <Icon
                                          as={FiPlay}
                                          position="absolute"
                                          top="50%"
                                          left="50%"
                                          transform="translate(-50%, -50%)"
                                          boxSize={4}
                                          color="white"
                                          bg="blackAlpha.600"
                                          borderRadius="full"
                                          p={1}
                                        />
                                      </Box>
                                    );
                                  } else {
                                    // Regular video file
                                    return (
                                      <Box position="relative" boxSize={{ base: "50px", md: "60px" }}>
                                        <video
                                          src={isUrl ? fileStr : getImageUrl(firstMedia.file)}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.375rem' }}
                                          preload="metadata"
                                        />
                                        <Icon
                                          as={FiPlay}
                                          position="absolute"
                                          top="50%"
                                          left="50%"
                                          transform="translate(-50%, -50%)"
                                          boxSize={4}
                                          color="white"
                                          bg="blackAlpha.600"
                                          borderRadius="full"
                                          p={1}
                                        />
                                      </Box>
                                    );
                                  }
                                }
                              } else if (exercise.image || exercise.image_url) {
                                // Fallback to old image field
                                return (
                                  <Box position="relative" boxSize={{ base: "50px", md: "60px" }}>
                                    <Image
                                      src={getImageUrl(exercise.image) || exercise.image_url}
                                      alt={exercise.name}
                                      boxSize={{ base: "50px", md: "60px" }}
                                      objectFit="cover"
                                      borderRadius="md"
                                      fallback={
                                        <Box
                                          boxSize={{ base: "50px", md: "60px" }}
                                          bg="gray.100"
                                          borderRadius="md"
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="center"
                                        >
                                          <Icon as={FiImage} color="gray.400" boxSize={{ base: 5, md: 6 }} />
                                        </Box>
                                      }
                                    />
                                  </Box>
                                );
                              } else {
                                // No media at all
                                return (
                                  <Box
                                    boxSize={{ base: "50px", md: "60px" }}
                                    bg="gray.100"
                                    borderRadius="md"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Icon as={FiImage} color="gray.400" boxSize={{ base: 5, md: 6 }} />
                                  </Box>
                                );
                              }
                            })()}
                          </Box>
                          
                          {/* Exercise Info */}
                          <Box flex="1" minW="0">
                            <Text fontWeight="medium" fontSize={{ base: "sm", md: "md" }} noOfLines={1}>{exercise.name}</Text>
                            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" noOfLines={1}>
                              {exercise.primary_muscles && Array.isArray(exercise.primary_muscles) && exercise.primary_muscles.length > 0 
                                ? exercise.primary_muscles.join(', ') 
                                : 'その他'} • {exercise.equipment || '自重'}
                            </Text>
                            {exercise.description && (
                              <Text fontSize="xs" color="gray.500" mt={1} noOfLines={1} display={{ base: "none", md: "block" }}>
                                {exercise.description}
                              </Text>
                            )}
                          </Box>
                          
                          {/* Actions */}
                          <HStack spacing={{ base: 1, md: 2 }} ml={{ base: 1, md: 2 }} flexShrink={0} flexWrap="wrap">
                            <Badge 
                              colorScheme={
                                exercise.difficulty === 'beginner' ? 'green' : 
                                exercise.difficulty === 'intermediate' ? 'yellow' : 'red'
                              }
                              fontSize={{ base: "2xs", md: "xs" }}
                            >
                              {exercise.difficulty === 'beginner' ? '初級' : 
                               exercise.difficulty === 'intermediate' ? '中級' : '上級'}
                            </Badge>
                            {exercise.is_custom && (
                              <>
                                <IconButton
                                  icon={<FiEdit />}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="ghost"
                                  aria-label="編集"
                                  onClick={() => handleEditExercise(exercise)}
                                />
                                <IconButton
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  aria-label="削除"
                                  onClick={() => {
                                    setExerciseToDelete(exercise);
                                    onDeleteExerciseOpen();
                                  }}
                                />
                              </>
                            )}
                          </HStack>
                        </Flex>
                      </Box>
                        ));
                      })()}
                    </VStack>
                    
                    {/* ページネーション */}
                    {exercises.length > exerciseItemsPerPage && (
                      <Box mt={6}>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontSize="sm" color="gray.600">
                            {exercises.length}件中 {Math.min((exerciseCurrentPage - 1) * exerciseItemsPerPage + 1, exercises.length)}-{Math.min(exerciseCurrentPage * exerciseItemsPerPage, exercises.length)}件を表示
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            ページ {exerciseCurrentPage} / {Math.ceil(exercises.length / exerciseItemsPerPage)}
                          </Text>
                        </Flex>
                        <Flex justify="center" align="center" gap={2}>
                          <IconButton
                            aria-label="前のページ"
                            icon={<FiChevronLeft />}
                            size="sm"
                            variant="outline"
                            isDisabled={exerciseCurrentPage === 1}
                            onClick={() => setExerciseCurrentPage(exerciseCurrentPage - 1)}
                          />
                          
                          {(() => {
                            const totalPages = Math.ceil(exercises.length / exerciseItemsPerPage);
                            const buttons = [];
                            const showPages = 5;
                            
                            let startPage = Math.max(1, exerciseCurrentPage - Math.floor(showPages / 2));
                            let endPage = Math.min(totalPages, startPage + showPages - 1);
                            
                            if (endPage - startPage + 1 < showPages) {
                              startPage = Math.max(1, endPage - showPages + 1);
                            }
                            
                            for (let i = startPage; i <= endPage; i++) {
                              buttons.push(
                                <Button
                                  key={i}
                                  size="sm"
                                  variant={i === exerciseCurrentPage ? "solid" : "outline"}
                                  colorScheme={i === exerciseCurrentPage ? "brand" : "gray"}
                                  onClick={() => setExerciseCurrentPage(i)}
                                  minW="8"
                                >
                                  {i}
                                </Button>
                              );
                            }
                            
                            return buttons;
                          })()}
                          
                          <IconButton
                            aria-label="次のページ"
                            icon={<FiChevronRight />}
                            size="sm"
                            variant="outline"
                            isDisabled={exerciseCurrentPage === Math.ceil(exercises.length / exerciseItemsPerPage)}
                            onClick={() => setExerciseCurrentPage(exerciseCurrentPage + 1)}
                          />
                        </Flex>
                      </Box>
                    )}
                  </>
                ) : (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Icon as={FiActivity} boxSize={12} color="gray.300" />
                      <Text color="gray.500">エクササイズが見つかりません</Text>
                      <Button
                        colorScheme="brand"
                        size="sm"
                        leftIcon={<FiPlus />}
                        onClick={handleOpenCreateExercise}
                      >
                        最初のエクササイズを追加
                      </Button>
                    </VStack>
                  </Center>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 2 && (
            <VStack spacing={{ base: 4, md: 6 }} align="stretch">
              {/* Header with Create Button */}
              <Card bg={bgColor}>
                <CardHeader p={{ base: 4, md: 6 }}>
                  <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
                    <Box flex="1">
                      <Heading size={{ base: "sm", md: "md" }}>ワークアウトプラン</Heading>
                      <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" mt={1}>
                        体系的なトレーニングプログラムで目標を達成
                      </Text>
                    </Box>
                    <Button
                      colorScheme="brand"
                      leftIcon={<FiPlus />}
                      onClick={handleOpenCreatePlan}
                      size={{ base: "sm", md: "md" }}
                      w={{ base: "full", md: "auto" }}
                      flexShrink={0}
                    >
                      プランを作成
                    </Button>
                  </Flex>
                </CardHeader>
              </Card>

              {/* Plans Grid */}
              {plans.length > 0 ? (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 4 }}>
                    {(() => {
                      const startIndex = (planCurrentPage - 1) * planItemsPerPage;
                      const endIndex = startIndex + planItemsPerPage;
                      return plans.slice(startIndex, endIndex).map((plan) => (
                    <Card
                      key={plan.id}
                      bg={bgColor}
                      borderWidth="2px"
                      borderColor={selectedPlan?.id === plan.id ? "brand.500" : borderColor}
                      cursor="pointer"
                      _hover={{ borderColor: "brand.400", shadow: "md" }}
                      onClick={() => setSelectedPlan(plan)}
                      transition="all 0.2s"
                    >
                      <CardBody p={{ base: 4, md: 6 }}>
                        {/* Plan Header */}
                        <Flex justify="space-between" align="start" mb={{ base: 2, md: 3 }}>
                          <Box flex="1" minW="0">
                            <Flex align="center" gap={2} mb={2} flexWrap="wrap">
                              <Heading size={{ base: "sm", md: "md" }} noOfLines={1}>{plan.name}</Heading>
                              {selectedPlan?.id === plan.id && (
                                <Badge colorScheme="brand" fontSize={{ base: "2xs", md: "xs" }}>
                                  選択中
                                </Badge>
                              )}
                              {plan.is_scheduled && (
                                <Badge colorScheme="green" fontSize={{ base: "2xs", md: "xs" }}>
                                  アクティブ
                                </Badge>
                              )}
                            </Flex>
                            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" noOfLines={2}>
                              {plan.description}
                            </Text>
                          </Box>
                        </Flex>

                        {/* Plan Stats */}
                        <SimpleGrid columns={3} spacing={{ base: 2, md: 3 }} mb={{ base: 2, md: 3 }}>
                          <Stat size="sm" bg={hoverBg} p={{ base: 2, md: 3 }} borderRadius="md">
                            <StatLabel fontSize={{ base: "2xs", md: "xs" }}>期間</StatLabel>
                            <StatNumber fontSize={{ base: "sm", md: "md" }}>{plan.duration_weeks}週</StatNumber>
                          </Stat>
                          <Stat size="sm" bg={hoverBg} p={{ base: 2, md: 3 }} borderRadius="md">
                            <StatLabel fontSize={{ base: "2xs", md: "xs" }}>頻度</StatLabel>
                            <StatNumber fontSize={{ base: "sm", md: "md" }}>週{plan.days_per_week}日</StatNumber>
                          </Stat>
                          <Stat size="sm" bg={hoverBg} p={{ base: 2, md: 3 }} borderRadius="md">
                            <StatLabel fontSize={{ base: "2xs", md: "xs" }}>難易度</StatLabel>
                            <StatNumber fontSize={{ base: "sm", md: "md" }}>
                              <Badge
                                colorScheme={
                                  plan.difficulty === 'beginner' ? 'green' :
                                  plan.difficulty === 'intermediate' ? 'yellow' : 'red'
                                }
                                fontSize={{ base: "2xs", md: "xs" }}
                              >
                                {plan.difficulty === 'beginner' ? '初級' :
                                 plan.difficulty === 'intermediate' ? '中級' : '上級'}
                              </Badge>
                            </StatNumber>
                          </Stat>
                        </SimpleGrid>

                        {/* Goal Badge */}
                        <HStack spacing={{ base: 1, md: 2 }} mb={{ base: 2, md: 3 }} flexWrap="wrap">
                          <Badge colorScheme="purple" fontSize={{ base: "2xs", md: "xs" }}>
                            目標: {plan.goal === 'weight_loss' ? '減量' :
                                  plan.goal === 'muscle_gain' ? '筋肉増強' :
                                  plan.goal === 'strength' ? '筋力向上' :
                                  plan.goal === 'endurance' ? '持久力' : '総合フィットネス'}
                          </Badge>
                          {plan.total_days > 0 && (
                            <Badge colorScheme="blue" fontSize={{ base: "2xs", md: "xs" }}>
                              {plan.total_days}日分のプラン
                            </Badge>
                          )}
                        </HStack>

                        {/* Action Buttons */}
                        <HStack spacing={{ base: 1, md: 2 }} flexWrap={{ base: "wrap", sm: "nowrap" }}>
                          <Button
                            size="sm"
                            colorScheme="brand"
                            flex="1"
                            leftIcon={<FiPlay />}
                            fontSize={{ base: "xs", md: "sm" }}
                            minW={{ base: "auto", sm: "100px" }}
                            isDisabled={activeSchedule && activeSchedule.workout_plan?.id !== plan.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeSchedule && activeSchedule.workout_plan?.id !== plan.id) {
                                toast({
                                  title: '既存のプログラムが実行中',
                                  description: `「${activeSchedule.workout_plan.name}」が実行中です。先に完了または終了してください。`,
                                  status: 'warning',
                                  duration: 4000,
                                  isClosable: true,
                                });
                                return;
                              }
                              setPlanToStart(plan);
                              setPlanStartDate(new Date().toISOString().split('T')[0]);
                              onStartPlanOpen();
                            }}
                          >
                            プラン開始
                          </Button>
                          {plan.is_custom && (
                            <IconButton
                              size="sm"
                              icon={<FiTrash2 />}
                              colorScheme="red"
                              variant="ghost"
                              aria-label="削除"
                              isDisabled={activeSchedule && activeSchedule.workout_plan?.id === plan.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeSchedule && activeSchedule.workout_plan?.id === plan.id) {
                                  toast({
                                    title: '実行中のプログラムは削除できません',
                                    description: 'まずプログラムを終了してください',
                                    status: 'warning',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                  return;
                                }
                                setPlanToDelete(plan);
                                onDeletePlanOpen();
                              }}
                            />
                          )}
                        </HStack>
                      </CardBody>
                    </Card>
                      ));
                    })()}
                  </SimpleGrid>
                  
                  {/* ページネーション */}
                  {plans.length > planItemsPerPage && (
                    <Box mt={6}>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text fontSize="sm" color="gray.600">
                          {plans.length}件中 {Math.min((planCurrentPage - 1) * planItemsPerPage + 1, plans.length)}-{Math.min(planCurrentPage * planItemsPerPage, plans.length)}件を表示
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          ページ {planCurrentPage} / {Math.ceil(plans.length / planItemsPerPage)}
                        </Text>
                      </Flex>
                      <Flex justify="center" align="center" gap={2}>
                        <IconButton
                          aria-label="前のページ"
                          icon={<FiChevronLeft />}
                          size="sm"
                          variant="outline"
                          isDisabled={planCurrentPage === 1}
                          onClick={() => setPlanCurrentPage(planCurrentPage - 1)}
                        />
                        
                        {(() => {
                          const totalPages = Math.ceil(plans.length / planItemsPerPage);
                          const buttons = [];
                          const showPages = 5;
                          
                          let startPage = Math.max(1, planCurrentPage - Math.floor(showPages / 2));
                          let endPage = Math.min(totalPages, startPage + showPages - 1);
                          
                          if (endPage - startPage + 1 < showPages) {
                            startPage = Math.max(1, endPage - showPages + 1);
                          }
                          
                          for (let i = startPage; i <= endPage; i++) {
                            buttons.push(
                              <Button
                                key={i}
                                size="sm"
                                variant={i === planCurrentPage ? "solid" : "outline"}
                                colorScheme={i === planCurrentPage ? "brand" : "gray"}
                                onClick={() => setPlanCurrentPage(i)}
                                minW="8"
                              >
                                {i}
                              </Button>
                            );
                          }
                          
                          return buttons;
                        })()}
                        
                        <IconButton
                          aria-label="次のページ"
                          icon={<FiChevronRight />}
                          size="sm"
                          variant="outline"
                          isDisabled={planCurrentPage === Math.ceil(plans.length / planItemsPerPage)}
                          onClick={() => setPlanCurrentPage(planCurrentPage + 1)}
                        />
                      </Flex>
                    </Box>
                  )}
                </>
              ) : (
                <Card bg={bgColor}>
                  <CardBody>
                    <Center py={12}>
                      <VStack spacing={4}>
                        <Icon as={FiList} boxSize={16} color="gray.300" />
                        <Heading size="md" color="gray.500">プランがありません</Heading>
                        <Text fontSize="sm" color="gray.500" textAlign="center" maxW="md">
                          ワークアウトプランは、体系的なトレーニングプログラムです。
                          目標に応じた構造化されたエクササイズスケジュールを作成できます。
                        </Text>
                        <Button
                          colorScheme="brand"
                          leftIcon={<FiPlus />}
                          onClick={handleOpenCreatePlan}
                        >
                          最初のプランを作成
                        </Button>
                      </VStack>
                    </Center>
                  </CardBody>
                </Card>
              )}

              {/* Selected Plan Details */}
              {selectedPlan && (
                <Card bg={bgColor} borderWidth="2px" borderColor="brand.200">
                  <CardBody p={{ base: 4, md: 6 }}>
                    <Flex justify="space-between" align="start" mb={{ base: 3, md: 4 }} gap={2}>
                      <Box flex="1" minW="0">
                        <Heading size={{ base: "sm", md: "md" }} mb={2} noOfLines={2}>{selectedPlan.name}</Heading>
                        <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" mb={3}>{selectedPlan.description}</Text>
                      </Box>
                      <CloseButton onClick={() => setSelectedPlan(null)} size={{ base: "sm", md: "md" }} flexShrink={0} />
                    </Flex>

                    <Divider mb={{ base: 3, md: 4 }} />

                    {/* Overview Section */}
                    <Box mb={{ base: 3, md: 4 }}>
                      <Heading size={{ base: "xs", md: "sm" }} mb={2}>プラン概要</Heading>
                      <Text fontSize={{ base: "xs", md: "sm" }} color="gray.700" whiteSpace="pre-line">
                        {selectedPlan.overview || 'このプランの詳細な説明はまだありません。'}
                      </Text>
                    </Box>

                    {/* Requirements Section */}
                    <Box mb={{ base: 3, md: 4 }}>
                      <Heading size={{ base: "xs", md: "sm" }} mb={2}>必要な器具・前提条件</Heading>
                      <Text fontSize={{ base: "xs", md: "sm" }} color="gray.700" whiteSpace="pre-line">
                        {selectedPlan.requirements || '特になし'}
                      </Text>
                    </Box>

                    {/* Plan Days Preview */}
                    {selectedPlan.plan_days && selectedPlan.plan_days.length > 0 && (
                      <Box>
                        <Heading size={{ base: "xs", md: "sm" }} mb={{ base: 2, md: 3 }}>トレーニングスケジュール</Heading>
                        <VStack spacing={2} align="stretch">
                          {selectedPlan.plan_days.slice(0, 7).map((day) => (
                            <Box
                              key={day.id}
                              p={{ base: 2, md: 3 }}
                              bg={day.rest_day ? 'gray.50' : hoverBg}
                              borderRadius="md"
                              borderLeft="4px solid"
                              borderColor={day.rest_day ? 'gray.400' : 'brand.500'}
                            >
                              <Flex justify="space-between" align="center" gap={2}>
                                <Box flex="1" minW="0">
                                  <Text fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} noOfLines={1}>
                                    Day {day.day_number}: {day.name}
                                  </Text>
                                  {day.description && (
                                    <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.600" mt={1} noOfLines={{ base: 1, md: 2 }}>
                                      {day.description}
                                    </Text>
                                  )}
                                  {!day.rest_day && (
                                    <Badge mt={1} colorScheme="blue" fontSize={{ base: "2xs", md: "xs" }}>
                                      {day.exercise_count || 0}種目
                                    </Badge>
                                  )}
                                </Box>
                                {day.rest_day && (
                                  <Badge colorScheme="gray" fontSize={{ base: "2xs", md: "xs" }} flexShrink={0}>休息日</Badge>
                                )}
                              </Flex>
                            </Box>
                          ))}
                          {selectedPlan.plan_days.length > 7 && (
                            <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.500" textAlign="center" mt={2}>
                              ... 他{selectedPlan.plan_days.length - 7}日分
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}

                    {/* Action Buttons */}
                    <HStack spacing={{ base: 2, md: 3 }} mt={{ base: 4, md: 6 }} flexWrap={{ base: "wrap", sm: "nowrap" }}>
                      {activeSchedule && activeSchedule.workout_plan?.id === selectedPlan.id ? (
                        <Button
                          colorScheme="orange"
                          flex="1"
                          leftIcon={<FiX />}
                          onClick={onStopPlanOpen}
                        >
                          プログラムを終了
                        </Button>
                      ) : (
                        <Button
                          colorScheme="brand"
                          flex="1"
                          leftIcon={<FiPlay />}
                          isDisabled={activeSchedule && activeSchedule.workout_plan?.id !== selectedPlan.id}
                          onClick={() => {
                            setPlanToStart(selectedPlan);
                            setPlanStartDate(new Date().toISOString().split('T')[0]);
                            onStartPlanOpen();
                          }}
                        >
                          このプランを開始
                        </Button>
                      )}
                      {selectedPlan.is_custom && (
                        <Button
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<FiTrash2 />}
                          isDisabled={activeSchedule && activeSchedule.workout_plan?.id === selectedPlan.id}
                          onClick={() => {
                            if (activeSchedule && activeSchedule.workout_plan?.id === selectedPlan.id) {
                              toast({
                                title: '実行中のプログラムは削除できません',
                                description: 'まずプログラムを終了してください',
                                status: 'warning',
                                duration: 3000,
                                isClosable: true,
                              });
                              return;
                            }
                            setPlanToDelete(selectedPlan);
                            onDeletePlanOpen();
                          }}
                        >
                          削除
                        </Button>
                      )}
                    </HStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          )}

          {activeTab === 3 && (
            <Card bg={bgColor}>
              <CardHeader>
                <Heading size="md">ワークアウト履歴</Heading>
              </CardHeader>
              <CardBody>
                {workouts.length > 0 ? (
                  <>
                    <VStack spacing={4} align="stretch">
                      {(() => {
                        const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
                        const endIndex = startIndex + historyItemsPerPage;
                        return workouts.slice(startIndex, endIndex).map((workout) => (
                      <Box key={workout.id} p={4} borderWidth="1px" borderRadius="lg">
                        <HStack justify="space-between" mb={2}>
                          <Heading size="sm">{workout.name}</Heading>
                          <Badge colorScheme="brand">{formatDate(workout.date)}</Badge>
                        </HStack>
                        <HStack spacing={4} fontSize="sm" color="gray.600">
                          <HStack>
                            <Icon as={FiClock} />
                            <Text>{workout.duration_minutes || workout.duration || 0} 分</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiActivity} />
                            <Text>{workout.exercises?.length || 0} 種目</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheck} />
                            <Text>{workout.total_calories_burned || workout.calories_burned || 0} kcal</Text>
                          </HStack>
                        </HStack>
                        {workout.notes && (
                          <Text fontSize="sm" color="gray.600" mt={2}>
                            {workout.notes}
                          </Text>
                        )}
                      </Box>
                        ));
                      })()}
                    </VStack>
                    
                    {/* ページネーション */}
                    {workouts.length > historyItemsPerPage && (
                      <Box mt={6}>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontSize="sm" color="gray.600">
                            {workouts.length}件中 {Math.min((historyCurrentPage - 1) * historyItemsPerPage + 1, workouts.length)}-{Math.min(historyCurrentPage * historyItemsPerPage, workouts.length)}件を表示
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            ページ {historyCurrentPage} / {Math.ceil(workouts.length / historyItemsPerPage)}
                          </Text>
                        </Flex>
                        <Flex justify="center" align="center" gap={2}>
                          <IconButton
                            aria-label="前のページ"
                            icon={<FiChevronLeft />}
                            size="sm"
                            variant="outline"
                            isDisabled={historyCurrentPage === 1}
                            onClick={() => setHistoryCurrentPage(historyCurrentPage - 1)}
                          />
                          
                          {(() => {
                            const totalPages = Math.ceil(workouts.length / historyItemsPerPage);
                            const buttons = [];
                            const showPages = 5;
                            
                            let startPage = Math.max(1, historyCurrentPage - Math.floor(showPages / 2));
                            let endPage = Math.min(totalPages, startPage + showPages - 1);
                            
                            if (endPage - startPage + 1 < showPages) {
                              startPage = Math.max(1, endPage - showPages + 1);
                            }
                            
                            for (let i = startPage; i <= endPage; i++) {
                              buttons.push(
                                <Button
                                  key={i}
                                  size="sm"
                                  variant={i === historyCurrentPage ? "solid" : "outline"}
                                  colorScheme={i === historyCurrentPage ? "brand" : "gray"}
                                  onClick={() => setHistoryCurrentPage(i)}
                                  minW="8"
                                >
                                  {i}
                                </Button>
                              );
                            }
                            
                            return buttons;
                          })()}
                          
                          <IconButton
                            aria-label="次のページ"
                            icon={<FiChevronRight />}
                            size="sm"
                            variant="outline"
                            isDisabled={historyCurrentPage === Math.ceil(workouts.length / historyItemsPerPage)}
                            onClick={() => setHistoryCurrentPage(historyCurrentPage + 1)}
                          />
                        </Flex>
                      </Box>
                    )}
                  </>
                ) : (
                  <Center py={12}>
                    <VStack>
                      <Icon as={FiActivity} boxSize={12} color="gray.300" />
                      <Text color="gray.500">まだワークアウトが記録されていません</Text>
                      <Button colorScheme="brand" size="sm" onClick={handleOpenWorkoutModal} mt={2}>
                        最初のワークアウトを記録
                      </Button>
                    </VStack>
                  </Center>
                )}
              </CardBody>
            </Card>
          )}
        </Box>

        {/* Sidebar */}
        <VStack spacing={6} align="stretch">
          {/* Weekly Stats */}
          <Card bg={bgColor}>
            <CardHeader>
              <Heading size="md">今週</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Flex justify="space-between" mb={2}>
                    <Text fontSize="sm" color="gray.700">完了したワークアウト</Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {completedThisWeek} / {totalThisWeek}
                    </Text>
                  </Flex>
                  <Progress
                    value={totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0}
                    colorScheme="green"
                    size="sm"
                    borderRadius="full"
                  />
                </Box>
                <Divider />
                <Box>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.700">合計時間</Text>
                    <Text fontSize="sm" fontWeight="bold">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</Text>
                  </Flex>
                </Box>
                <Box>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.700">消費カロリー</Text>
                    <Text fontSize="sm" fontWeight="bold">{Math.round(totalCalories).toLocaleString()} kcal</Text>
                  </Flex>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Active Workout Program */}
          <Card bg={bgColor} borderWidth="2px" borderColor="purple.200">
            <CardHeader pb={2}>
              <Flex align="center" gap={2}>
                <Icon as={FiStar} color="purple.500" />
                <Heading size="sm">アクティブプログラム</Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={2}>
              {activeSchedule && activeSchedule.workout_plan ? (() => {
                const plan = activeSchedule.workout_plan;
                const startDate = new Date(activeSchedule.start_date);
                const today = new Date();
                const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
                const weeksPassed = Math.floor(daysPassed / 7);
                const totalWeeks = plan.duration_weeks || 12;
                const progressPercentage = Math.min((weeksPassed / totalWeeks) * 100, 100);
                
                // Calculate this week's workouts (only from active schedule)
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                // Filter workouts that are within this week and belong to this schedule
                const thisWeekWorkouts = workouts.filter(w => {
                  const workoutDate = new Date(w.date);
                  const scheduleStart = new Date(activeSchedule.start_date);
                  const scheduleEnd = new Date(activeSchedule.start_date);
                  scheduleEnd.setDate(scheduleEnd.getDate() + (plan.duration_weeks * 7));
                  
                  // Check if workout is within this week AND within schedule period
                  return workoutDate >= startOfWeek && 
                         workoutDate <= endOfWeek &&
                         workoutDate >= scheduleStart &&
                         workoutDate <= scheduleEnd;
                });
                
                const daysPerWeek = plan.days_per_week || 5;
                const completedThisWeek = thisWeekWorkouts.filter(w => w.completed).length;
                
                return (
                  <Box>
                    <Box
                      p={4}
                      bgGradient={{
                        base: "linear(to-r, purple.50, pink.50)",
                        _dark: "linear(to-r, purple.800, pink.800)"
                      }}
                      borderRadius="lg"
                      mb={3}
                    >
                      <Flex align="start" justify="space-between" mb={2}>
                        <Box flex="1">
                          <Heading size="xs" mb={1}>{plan.name}</Heading>
                          <Text fontSize="xs" color="gray.600" noOfLines={2}>
                            {plan.description}
                          </Text>
                        </Box>
                        <Badge colorScheme="green" fontSize="xs">実行中</Badge>
                      </Flex>
                      
                      <VStack spacing={1} mb={3} align="stretch">
                        <HStack spacing={2} fontSize="xs" color="gray.600">
                          <Text>週{plan.days_per_week}日</Text>
                          <Text>•</Text>
                          <Text>{plan.duration_weeks}週間</Text>
                        </HStack>
                        <HStack spacing={2} fontSize="xs" color="gray.600">
                          <Text>開始: {new Date(activeSchedule.start_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
                        </HStack>
                        <HStack spacing={2} fontSize="xs" color="gray.600">
                          <Text>終了日: {(() => {
                            const endDate = new Date(activeSchedule.start_date);
                            endDate.setDate(endDate.getDate() + (plan.duration_weeks * 7));
                            return endDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
                          })()}</Text>
                        </HStack>
                      </VStack>

                      {/* Progress bar */}
                      <Box>
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="xs" fontWeight="medium">進捗状況</Text>
                          <Text fontSize="xs" color="gray.600">{weeksPassed} / {totalWeeks} 週</Text>
                        </Flex>
                        <Progress value={progressPercentage} colorScheme="purple" size="sm" borderRadius="full" />
                      </Box>
                    </Box>

                    {/* Quick Stats */}
                    <SimpleGrid columns={2} spacing={2} mb={3}>
                      <Box bg={hoverBg} p={2} borderRadius="md" textAlign="center">
                        <Text fontSize="xs" color="gray.600">今週のワークアウト</Text>
                        <Text 
                          fontSize="lg" 
                          fontWeight="bold" 
                          color={
                            completedThisWeek < daysPerWeek 
                              ? "red.600" 
                              : "green.600"
                          }
                        >
                          {completedThisWeek}/{daysPerWeek}
                        </Text>
                        <Text fontSize="xs" color="gray.500">完了</Text>
                      </Box>
                      <Box bg={hoverBg} p={2} borderRadius="md" textAlign="center">
                        <Text fontSize="xs" color="gray.600">達成率</Text>
                        <Text fontSize="lg" fontWeight="bold" color="purple.600">
                          {daysPerWeek > 0 ? Math.round((completedThisWeek / daysPerWeek) * 100) : 0}%
                        </Text>
                        <Text fontSize="xs" color="gray.500">今週</Text>
                      </Box>
                    </SimpleGrid>

                    <VStack spacing={2}>
                      <Button
                        variant="outline"
                        colorScheme="purple"
                        size="sm"
                        w="full"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setActiveTab(2);
                        }}
                      >
                        プログラム詳細を見る
                      </Button>
                      <Button
                        variant="outline"
                        colorScheme="orange"
                        size="sm"
                        w="full"
                        leftIcon={<FiX />}
                        onClick={onStopPlanOpen}
                      >
                        プログラムを終了
                      </Button>
                    </VStack>
                  </Box>
                );
              })() : (
                <Box textAlign="center" py={4}>
                  <Icon as={FiList} boxSize={8} color="gray.300" mb={2} />
                  <Text fontSize="sm" color="gray.500" mb={3}>
                    アクティブなプログラムなし
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    variant="outline"
                    onClick={() => setActiveTab(2)}
                  >
                    プログラムを選択
                  </Button>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Grid>

      {/* Log Workout Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "4xl" }}>
        <ModalOverlay />
        <ModalContent maxH={{ base: "100vh", md: "90vh" }} m={{ base: 0, md: 4 }}>
          <form onSubmit={handleSubmit} noValidate>
            <ModalHeader fontSize={{ base: "lg", md: "xl" }}>ワークアウトを記録</ModalHeader>
            <ModalCloseButton />
            <ModalBody maxH={{ base: "calc(100vh - 140px)", md: "calc(90vh - 140px)" }} overflowY="auto">
              <Tabs>
                <TabList>
                  <Tab>ワークアウトの詳細</Tab>
                  <Tab>エクササイズを追加</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>ワークアウト名</FormLabel>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="例: 上半身トレーニング"
                        />
                      </FormControl>

                      <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                        <FormControl isRequired>
                          <FormLabel>日付</FormLabel>
                          <Input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            min={getTodayDate()}
                            max={getMaxDate()}
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>時間 (分)</FormLabel>
                          <Input
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            placeholder="45"
                            min={1}
                            step={1}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                          />
                        </FormControl>
                      </Grid>

                      <FormControl>
                        <FormLabel>メモ</FormLabel>
                        <Textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="体調や気づいたことを記録..."
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>繰り返し</FormLabel>
                        <Select name="repeat_type" value={formData.repeat_type} onChange={handleChange}>
                          <option value="none">なし</option>
                          <option value="daily">毎日</option>
                          <option value="weekly">毎週</option>
                        </Select>
                      </FormControl>

                      {formData.repeat_type === 'weekly' && (
                        <FormControl isInvalid={!!weeklyDaysError}>
                          <FormLabel>繰り返す曜日</FormLabel>
                          <VStack align="start" spacing={2}>
                            {[
                              { label: '日曜日', value: 0 },
                              { label: '月曜日', value: 1 },
                              { label: '火曜日', value: 2 },
                              { label: '水曜日', value: 3 },
                              { label: '木曜日', value: 4 },
                              { label: '金曜日', value: 5 },
                              { label: '土曜日', value: 6 },
                            ].map((day) => (
                              <Checkbox
                                key={day.value}
                                name="weekly_days"
                                value={day.value}
                                isChecked={formData.weekly_days.includes(day.value)}
                                onChange={handleChange}
                              >
                                {day.label}
                              </Checkbox>
                            ))}
                          </VStack>
                          <FormErrorMessage>{weeklyDaysError}</FormErrorMessage>
                        </FormControl>
                      )}

                      {formData.repeat_type !== 'none' && (
                        <FormControl isRequired>
                          <FormLabel>繰り返し終了日</FormLabel>
                          <Input
                            type="date"
                            name="repeat_until"
                            value={formData.repeat_until}
                            onChange={handleChange}
                            min={getTodayDate()}
                          />
                        </FormControl>
                      )}

                      {/* Selected Exercises */}
                      <Box w="full">
                        <Heading size="sm" mb={3}>選択したエクササイズ ({selectedExercises.length})</Heading>
                        {selectedExercises.length > 0 ? (
                          <VStack spacing={2} align="stretch">
                            {selectedExercises.map((exercise, index) => (
                              <VStack key={index} p={3} bg="gray.50" borderRadius="md" align="stretch" spacing={2}>
                                <HStack justify="space-between">
                                  <Text fontWeight="medium" fontSize="sm">{exercise.name}</Text>
                                  <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleExerciseRemove(index)}>
                                    ×
                                  </Button>
                                </HStack>
                                <HStack spacing={2}>
                                  <VStack align="stretch" flex="1" spacing={1}>
                                    <Text fontSize="xs" color="gray.600" fontWeight="medium">セット数</Text>
                                    <Input
                                      type="number"
                                      size="sm"
                                      value={exercise.sets}
                                      onChange={(e) => handleExerciseUpdate(index, 'sets', parseInt(e.target.value))}
                                      placeholder="3"
                                    />
                                  </VStack>
                                  <VStack align="stretch" flex="1" spacing={1}>
                                    <Text fontSize="xs" color="gray.600" fontWeight="medium">回数</Text>
                                    <Input
                                      type="number"
                                      size="sm"
                                      value={exercise.reps}
                                      onChange={(e) => handleExerciseUpdate(index, 'reps', parseInt(e.target.value))}
                                      placeholder="10"
                                    />
                                  </VStack>
                                  <VStack align="stretch" flex="1" spacing={1}>
                                    <Text fontSize="xs" color="gray.600" fontWeight="medium">重量 (kg)</Text>
                                    <Input
                                      type="number"
                                      step="0.5"
                                      size="sm"
                                      value={exercise.weight}
                                      onChange={(e) => handleExerciseUpdate(index, 'weight', parseFloat(e.target.value))}
                                      placeholder="0.00"
                                    />
                                  </VStack>
                                </HStack>
                              </VStack>
                            ))}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.500">エクササイズが選択されていません。「エクササイズを追加」タブから選択してください。</Text>
                        )}
                      </Box>
                    </VStack>
                  </TabPanel>

                  <TabPanel>
                    <Box maxH="400px" overflowY="auto">
                      <VStack spacing={2} align="stretch">
                        {exercises
                          .filter(exercise => !selectedExercises.some(selected => selected.id === exercise.id))
                          .slice(0, 20)
                          .map((exercise) => (
                          <HStack
                            key={exercise.id}
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            onClick={() => handleExerciseSelect(exercise)}
                          >
                            <Box flex="1">
                              <Text fontWeight="medium" fontSize="sm">{exercise.name}</Text>
                              <Text fontSize="xs" color="gray.600">
                                {exercise.muscle_group} • {exercise.equipment}
                              </Text>
                            </Box>
                            <Icon as={FiPlus} color="brand.500" />
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                ワークアウトを記録
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Create Exercise Modal */}
      <Modal isOpen={isCreateExerciseOpen} onClose={handleCloseCreateExercise} size={{ base: "full", md: "xl" }}>
        <ModalOverlay />
        <ModalContent maxH={{ base: "100vh", md: "90vh" }} overflowY="auto" m={{ base: 0, md: 4 }}>
          <form onSubmit={handleCreateExercise}>
            <ModalHeader fontSize={{ base: "lg", md: "xl" }}>新しいエクササイズを追加</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>エクササイズ名</FormLabel>
                  <Input
                    name="name"
                    value={newExerciseData.name}
                    onChange={handleNewExerciseChange}
                    placeholder="例: バーベルスクワット"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>エクササイズタイプ</FormLabel>
                  <Select
                    name="exercise_type"
                    value={newExerciseData.exercise_type}
                    onChange={handleNewExerciseChange}
                    placeholder="エクササイズタイプを選択"
                  >
                    <option value="strength">筋力トレーニング</option>
                    <option value="cardio">有酸素運動</option>
                    <option value="flexibility">柔軟性</option>
                    <option value="balance">バランス</option>
                    <option value="sports">スポーツ</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>筋肉群</FormLabel>
                  <Select
                    name="muscle_group"
                    value={newExerciseData.muscle_group}
                    onChange={handleNewExerciseChange}
                    placeholder="筋肉群を選択"
                  >
                    <option value="胸">胸</option>
                    <option value="背中">背中</option>
                    <option value="肩">肩</option>
                    <option value="腕">腕</option>
                    <option value="脚">脚</option>
                    <option value="腹筋">腹筋</option>
                    <option value="全身">全身</option>
                  </Select>
                </FormControl>
                {/* Secondary Muscles Field */}
                {newExerciseData.muscle_group && (
                  <FormControl mt={2}>
                    <FormLabel>副次筋群</FormLabel>
                    <CheckboxGroup
                      colorScheme="brand"
                      value={newExerciseData.secondary_muscles}
                      onChange={vals => setNewExerciseData({
                        ...newExerciseData,
                        secondary_muscles: vals,
                      })}
                    >
                      <Stack direction="column">
                        {availableSecondaryMuscles.map((muscle) => (
                          <Checkbox key={muscle} value={muscle}>{muscle}</Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>器具</FormLabel>
                  <Select
                    name="equipment"
                    value={newExerciseData.equipment}
                    onChange={handleNewExerciseChange}
                    placeholder="器具を選択"
                  >
                    <option value="none">器具なし</option>
                    <option value="bodyweight">自重</option>
                    <option value="dumbbells">ダンベル</option>
                    <option value="barbell">バーベル</option>
                    <option value="machine">マシン</option>
                    <option value="resistance_band">レジスタンスバンド</option>
                    <option value="kettlebell">ケトルベル</option>
                    <option value="other">その他</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>難易度</FormLabel>
                  <Select
                    name="difficulty"
                    value={newExerciseData.difficulty}
                    onChange={handleNewExerciseChange}
                    placeholder="難易度を選択"
                  >
                    <option value="beginner">初級</option>
                    <option value="intermediate">中級</option>
                    <option value="advanced">上級</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>MET値（代謝当量）</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="met_value"
                    value={newExerciseData.met_value || newExerciseData.calories_per_minute}
                    onChange={handleNewExerciseChange}
                    placeholder="5.0"
                  />
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    運動強度の指標（例: ウォーキング=3.5, ジョギング=7.0, 筋トレ=6.0）
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>メディア（画像・動画）</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    {/* Preview Grid */}
                    {exerciseMediaPreviews.length > 0 && (
                      <SimpleGrid columns={2} spacing={3}>
                        {exerciseMediaPreviews.map((preview, index) => (
                          <Box
                            key={index}
                            position="relative"
                            borderWidth="2px"
                            borderColor="brand.200"
                            borderRadius="lg"
                            overflow="hidden"
                          >
                            {preview.type === 'image' ? (
                              <Image
                                src={preview.url}
                                alt={`プレビュー ${index + 1}`}
                                h="150px"
                                w="full"
                                objectFit="cover"
                                fallbackSrc="https://via.placeholder.com/300x150?text=画像を読み込み中"
                              />
                            ) : (preview.isUrl && (preview.url.includes('youtube.com/embed') || preview.url.includes('youtube.com/watch') || preview.url.includes('youtu.be'))) ? (
                              <Box position="relative" h="150px" bg="gray.100">
                                <iframe
                                  src={preview.url}
                                  style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title={`YouTube ${index + 1}`}
                                />
                              </Box>
                            ) : (
                              <Box position="relative" h="150px" bg="gray.100">
                                <video
                                  src={preview.url}
                                  preload="metadata"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <Icon
                                  as={FiPlay}
                                  position="absolute"
                                  top="50%"
                                  left="50%"
                                  transform="translate(-50%, -50%)"
                                  boxSize={8}
                                  color="white"
                                  bg="blackAlpha.600"
                                  borderRadius="full"
                                  p={2}
                                />
                              </Box>
                            )}
                            <IconButton
                              icon={<FiX />}
                              size="sm"
                              colorScheme="red"
                              position="absolute"
                              top={2}
                              right={2}
                              onClick={() => removeMedia(index)}
                              aria-label="削除"
                            />
                            <Badge
                              position="absolute"
                              bottom={2}
                              left={2}
                              colorScheme={preview.type === 'image' ? 'blue' : 'purple'}
                            >
                              {preview.type === 'image' ? '画像' : '動画'}
                            </Badge>
                          </Box>
                        ))}
                      </SimpleGrid>
                    )}
                    
                    {/* URL Input */}
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Input
                          placeholder="画像・動画のURLを入力（GoogleドライブやYouTube等）"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          size="sm"
                        />
                        <Button
                          size="sm"
                          colorScheme="brand"
                          onClick={() => {
                            if (mediaUrl.trim()) {
                              // Determine media type from URL
                              const isVideo = mediaUrl.includes('youtube.com') || 
                                            mediaUrl.includes('youtu.be') || 
                                            mediaUrl.includes('vimeo.com') ||
                                            /\.(mp4|mov|avi|webm)$/i.test(mediaUrl);
                              
                              // Convert YouTube URL to embed format
                              let embedUrl = mediaUrl;
                              if (mediaUrl.includes('youtube.com/watch?v=')) {
                                const videoId = mediaUrl.split('v=')[1]?.split('&')[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              } else if (mediaUrl.includes('youtu.be/')) {
                                const videoId = mediaUrl.split('youtu.be/')[1]?.split('?')[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              }
                              
                              setExerciseMediaPreviews(prev => [...prev, {
                                url: embedUrl,
                                type: isVideo ? 'video' : 'image',
                                name: 'url-media',
                                isUrl: true,
                                originalUrl: mediaUrl
                              }]);
                              setMediaUrl('');
                              toast({
                                title: 'URLを追加しました',
                                status: 'success',
                                duration: 2000,
                              });
                            }
                          }}
                          flexShrink={0}
                        >
                          追加
                        </Button>
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        画像のURLまたはYouTubeの動画URLを入力できます
                      </Text>
                    </VStack>

                    <Divider />

                    {/* Upload Button */}
                    <Button
                      as="label"
                      htmlFor="exercise-media-upload"
                      leftIcon={<FiImage />}
                      variant="outline"
                      colorScheme="brand"
                      cursor="pointer"
                      w="full"
                    >
                      ファイルから追加
                      <Input
                        id="exercise-media-upload"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaUpload}
                        display="none"
                      />
                    </Button>
                    <Text fontSize="xs" color="gray.600">
                      ローカルファイルから画像（JPG、PNG、GIF）または動画（MP4、MOV等）をアップロード
                    </Text>
                  </VStack>
                </FormControl>

                <Box w="full" p={4} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" color="blue.800" fontWeight="semibold" mb={2}>
                    💡 ヒント
                  </Text>
                  <Text fontSize="xs" color="blue.700">
                    エクササイズを追加すると、ワークアウト作成時に選択できるようになります。
                  </Text>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleCloseCreateExercise}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                追加
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Exercise Modal */}
      <Modal isOpen={isEditExerciseOpen} onClose={handleCloseEditExercise} size={{ base: "full", md: "xl" }}>
        <ModalOverlay />
        <ModalContent maxH={{ base: "100vh", md: "90vh" }} overflowY="auto" m={{ base: 0, md: 4 }}>
          <form onSubmit={handleUpdateExercise}>
            <ModalHeader fontSize={{ base: "lg", md: "xl" }}>エクササイズを編集</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>エクササイズ名</FormLabel>
                  <Input
                    name="name"
                    value={newExerciseData.name}
                    onChange={handleNewExerciseChange}
                    placeholder="例: バーベルスクワット"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>エクササイズタイプ</FormLabel>
                  <Select
                    name="exercise_type"
                    value={newExerciseData.exercise_type}
                    onChange={handleNewExerciseChange}
                    placeholder="エクササイズタイプを選択"
                  >
                    <option value="strength">筋力トレーニング</option>
                    <option value="cardio">有酸素運動</option>
                    <option value="flexibility">柔軟性</option>
                    <option value="balance">バランス</option>
                    <option value="sports">スポーツ</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>筋肉群</FormLabel>
                  <Select
                    name="muscle_group"
                    value={newExerciseData.muscle_group}
                    onChange={handleNewExerciseChange}
                    placeholder="筋肉群を選択"
                  >
                    <option value="胸">胸</option>
                    <option value="背中">背中</option>
                    <option value="肩">肩</option>
                    <option value="腕">腕</option>
                    <option value="脚">脚</option>
                    <option value="腹筋">腹筋</option>
                    <option value="全身">全身</option>
                  </Select>
                </FormControl>
                {/* Secondary Muscles Field */}
                {newExerciseData.muscle_group && (
                  <FormControl mt={2}>
                    <FormLabel>副次筋群</FormLabel>
                    <CheckboxGroup
                      colorScheme="brand"
                      value={newExerciseData.secondary_muscles}
                      onChange={vals => setNewExerciseData({
                        ...newExerciseData,
                        secondary_muscles: vals,
                      })}
                    >
                      <Stack direction="column">
                        {availableSecondaryMuscles.map((muscle) => (
                          <Checkbox key={muscle} value={muscle}>{muscle}</Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>器具</FormLabel>
                  <Select
                    name="equipment"
                    value={newExerciseData.equipment}
                    onChange={handleNewExerciseChange}
                  >
                    <option value="none">器具なし</option>
                    <option value="bodyweight">自重</option>
                    <option value="dumbbells">ダンベル</option>
                    <option value="barbell">バーベル</option>
                    <option value="machine">マシン</option>
                    <option value="resistance_band">レジスタンスバンド</option>
                    <option value="kettlebell">ケトルベル</option>
                    <option value="other">その他</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>難易度</FormLabel>
                  <Select
                    name="difficulty"
                    value={newExerciseData.difficulty}
                    onChange={handleNewExerciseChange}
                  >
                    <option value="beginner">初級</option>
                    <option value="intermediate">中級</option>
                    <option value="advanced">上級</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>MET値（代謝当量）</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    name="met_value"
                    value={newExerciseData.met_value || newExerciseData.calories_per_minute}
                    onChange={handleNewExerciseChange}
                    placeholder="5.0"
                  />
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    運動強度の指標（例: ウォーキング=3.5, ジョギング=7.0, 筋トレ=6.0）
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>メディア（画像・動画）</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    {/* Preview Grid */}
                    {exerciseMediaPreviews.length > 0 && (
                      <SimpleGrid columns={2} spacing={3}>
                        {exerciseMediaPreviews.map((preview, index) => (
                          <Box
                            key={index}
                            position="relative"
                            borderWidth="2px"
                            borderColor="brand.200"
                            borderRadius="lg"
                            overflow="hidden"
                          >
                            {preview.type === 'image' ? (
                              <Image
                                src={preview.url}
                                alt={`プレビュー ${index + 1}`}
                                h="150px"
                                w="full"
                                objectFit="cover"
                                fallbackSrc="https://via.placeholder.com/300x150?text=画像を読み込み中"
                              />
                            ) : (preview.isUrl && (preview.url.includes('youtube.com/embed') || preview.url.includes('youtube.com/watch') || preview.url.includes('youtu.be'))) ? (
                              <Box position="relative" h="150px" bg="gray.100">
                                <iframe
                                  src={preview.url}
                                  style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title={`YouTube ${index + 1}`}
                                />
                              </Box>
                            ) : (
                              <Box position="relative" h="150px" bg="gray.100">
                                <video
                                  src={preview.url}
                                  preload="metadata"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <Icon
                                  as={FiPlay}
                                  position="absolute"
                                  top="50%"
                                  left="50%"
                                  transform="translate(-50%, -50%)"
                                  boxSize={8}
                                  color="white"
                                  bg="blackAlpha.600"
                                  borderRadius="full"
                                  p={2}
                                />
                              </Box>
                            )}
                            <IconButton
                              icon={<FiX />}
                              size="sm"
                              colorScheme="red"
                              position="absolute"
                              top={2}
                              right={2}
                              onClick={() => removeMedia(index)}
                              aria-label="削除"
                            />
                            <Badge
                              position="absolute"
                              bottom={2}
                              left={2}
                              colorScheme={preview.type === 'image' ? 'blue' : 'purple'}
                            >
                              {preview.type === 'image' ? '画像' : '動画'}
                            </Badge>
                            {preview.isExisting && (
                              <Badge
                                position="absolute"
                                bottom={2}
                                right={2}
                                colorScheme="gray"
                              >
                                既存
                              </Badge>
                            )}
                          </Box>
                        ))}
                      </SimpleGrid>
                    )}
                    
                    {/* URL Input */}
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Input
                          placeholder="画像・動画のURLを入力（GoogleドライブやYouTube等）"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          size="sm"
                        />
                        <Button
                          size="sm"
                          colorScheme="brand"
                          onClick={() => {
                            if (mediaUrl.trim()) {
                              // Determine media type from URL
                              const isVideo = mediaUrl.includes('youtube.com') || 
                                            mediaUrl.includes('youtu.be') || 
                                            mediaUrl.includes('vimeo.com') ||
                                            /\.(mp4|mov|avi|webm)$/i.test(mediaUrl);
                              
                              // Convert YouTube URL to embed format
                              let embedUrl = mediaUrl;
                              if (mediaUrl.includes('youtube.com/watch?v=')) {
                                const videoId = mediaUrl.split('v=')[1]?.split('&')[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              } else if (mediaUrl.includes('youtu.be/')) {
                                const videoId = mediaUrl.split('youtu.be/')[1]?.split('?')[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              }
                              
                              setExerciseMediaPreviews(prev => [...prev, {
                                url: embedUrl,
                                type: isVideo ? 'video' : 'image',
                                name: 'url-media',
                                isUrl: true,
                                originalUrl: mediaUrl
                              }]);
                              setMediaUrl('');
                              toast({
                                title: 'URLを追加しました',
                                status: 'success',
                                duration: 2000,
                              });
                            }
                          }}
                          flexShrink={0}
                        >
                          追加
                        </Button>
                      </HStack>
                      <Text fontSize="xs" color="gray.600">
                        画像のURLまたはYouTubeの動画URLを入力できます
                      </Text>
                    </VStack>

                    <Divider />

                    {/* Upload Button */}
                    <Button
                      as="label"
                      htmlFor="exercise-media-upload-edit"
                      leftIcon={<FiImage />}
                      variant="outline"
                      colorScheme="brand"
                      cursor="pointer"
                      w="full"
                    >
                      ファイルから追加
                      <Input
                        id="exercise-media-upload-edit"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaUpload}
                        display="none"
                      />
                    </Button>
                    <Text fontSize="xs" color="gray.600">
                      ローカルファイルから画像（JPG、PNG、GIF）または動画（MP4、MOV等）をアップロード
                    </Text>
                  </VStack>
                </FormControl>

                <Box w="full" p={4} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" color="blue.800" fontWeight="semibold" mb={2}>
                    💡 ヒント
                  </Text>
                  <Text fontSize="xs" color="blue.700">
                    エクササイズの情報を更新できます。変更は保存後すぐに反映されます。
                  </Text>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleCloseEditExercise}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                更新
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Exercise Confirmation Modal */}
      <Modal isOpen={isDeleteExerciseOpen} onClose={onDeleteExerciseClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>エクササイズを削除</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {exerciseToDelete && (
              <Text>
                「<strong>{exerciseToDelete.name}</strong>」を削除してもよろしいですか？
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={() => {
                setExerciseToDelete(null);
                onDeleteExerciseClose();
              }}
            >
              キャンセル
            </Button>
            <Button 
              colorScheme="red"
              isLoading={submitting}
              onClick={async () => {
                if (!exerciseToDelete) return;
                
                setSubmitting(true);
                try {
                  await workoutsService.exercises.delete(exerciseToDelete.id);
                  
                  toast({
                    title: '削除しました',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                  
                  setExerciseToDelete(null);
                  onDeleteExerciseClose();
                  await loadData();
                } catch (error) {
                  console.error('Delete exercise error:', error);
                  toast({
                    title: '削除に失敗しました',
                    description: error.response?.data?.detail || 'もう一度お試しください',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              削除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Workout Modal */}
      <Modal isOpen={isEditWorkoutOpen} onClose={onEditWorkoutClose} size={{ base: "full", md: "4xl" }}>
        <ModalOverlay />
        <ModalContent maxH={{ base: "100vh", md: "90vh" }} m={{ base: 0, md: 4 }}>
          <form onSubmit={handleUpdateWorkout}>
            <ModalHeader fontSize={{ base: "lg", md: "xl" }}>ワークアウトを編集</ModalHeader>
            <ModalCloseButton />
            <ModalBody maxH={{ base: "calc(100vh - 140px)", md: "calc(90vh - 140px)" }} overflowY="auto">
              <Tabs>
                <TabList>
                  <Tab>ワークアウトの詳細</Tab>
                  <Tab>エクササイズを追加</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>ワークアウト名</FormLabel>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="例: 上半身トレーニング"
                        />
                      </FormControl>

                      <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                        <FormControl isRequired>
                          <FormLabel>日付</FormLabel>
                          <Input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            isReadOnly={!!workoutToEdit}
                            bg={workoutToEdit ? 'gray.100' : 'white'}
                            cursor={workoutToEdit ? 'not-allowed' : 'text'}
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>時間 (分)</FormLabel>
                          <Input
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            placeholder="45"
                            min={1}
                            step={1}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                          />
                        </FormControl>
                      </Grid>

                      <FormControl>
                        <FormLabel>メモ</FormLabel>
                        <Textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="体調や気づいたことを記録..."
                        />
                      </FormControl>

                      {/* Selected Exercises */}
                      <Box w="full">
                        <Heading size="sm" mb={3}>選択したエクササイズ ({selectedExercises.length})</Heading>
                        {selectedExercises.length > 0 ? (
                          <VStack spacing={2} align="stretch">
                            {selectedExercises.map((exercise, index) => (
                              <VStack key={index} p={3} bg="gray.50" borderRadius="md" align="stretch" spacing={2}>
                                <HStack justify="space-between">
                                  <Text fontWeight="medium" fontSize="sm">{exercise.name}</Text>
                                  <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleExerciseRemove(index)}>
                                    ×
                                  </Button>
                                </HStack>
                                <HStack spacing={2}>
                                  <VStack align="stretch" flex="1" spacing={1}>
                                    <Text fontSize="xs" color="gray.600" fontWeight="medium">セット数</Text>
                                    <Input
                                      type="number"
                                      size="sm"
                                      value={exercise.sets}
                                      onChange={(e) => handleExerciseUpdate(index, 'sets', parseInt(e.target.value))}
                                      placeholder="3"
                                    />
                                  </VStack>
                                  <VStack align="stretch" flex="1" spacing={1}>
                                    <Text fontSize="xs" color="gray.600" fontWeight="medium">回数</Text>
                                    <Input
                                      type="number"
                                      size="sm"
                                      value={exercise.reps}
                                      onChange={(e) => handleExerciseUpdate(index, 'reps', parseInt(e.target.value))}
                                      placeholder="10"
                                    />
                                  </VStack>
                                  <VStack align="stretch" flex="1" spacing={1}>
                                    <Text fontSize="xs" color="gray.600" fontWeight="medium">重量 (kg)</Text>
                                    <Input
                                      type="number"
                                      step="0.5"
                                      size="sm"
                                      value={exercise.weight}
                                      onChange={(e) => handleExerciseUpdate(index, 'weight', parseFloat(e.target.value))}
                                      placeholder="0.00"
                                    />
                                  </VStack>
                                </HStack>
                              </VStack>
                            ))}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.500">エクササイズが選択されていません。「エクササイズを追加」タブから選択してください。</Text>
                        )}
                      </Box>
                    </VStack>
                  </TabPanel>

                  <TabPanel>
                    <Box maxH="400px" overflowY="auto">
                      <VStack spacing={2} align="stretch">
                        {exercises
                          .filter(exercise => !selectedExercises.some(selected => selected.id === exercise.id))
                          .slice(0, 20)
                          .map((exercise) => (
                          <HStack
                            key={exercise.id}
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            onClick={() => handleExerciseSelect(exercise)}
                          >
                            <Box flex="1">
                              <Text fontWeight="medium" fontSize="sm">{exercise.name}</Text>
                              <Text fontSize="xs" color="gray.600">
                                {exercise.muscle_group} • {exercise.equipment}
                              </Text>
                            </Box>
                            <Icon as={FiPlus} color="brand.500" />
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditWorkoutClose}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                更新
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Workout Confirmation Modal */}
      <Modal isOpen={isDeleteWorkoutOpen} onClose={onDeleteWorkoutClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>ワークアウトを削除</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {workoutToDelete && (
              <VStack spacing={4} align="stretch">
                <Text>
                  「<strong>{workoutToDelete.name}</strong>」を削除してもよろしいですか？
                </Text>
                
                <Box p={3} bg="gray.50" borderRadius="md" borderLeft="4px solid" borderColor={
                  deleteOption === 'today' ? 'blue.500' : 
                  deleteOption === 'recurring' ? 'orange.500' : 'red.500'
                }>
                  <VStack spacing={2} align="start">
                    <Text fontWeight="semibold" fontSize="sm">
                      削除範囲: {deleteOption === 'today' ? '今日だけ削除' : 
                                 deleteOption === 'recurring' ? '同じ曜日の今後の分を削除' : 
                                 '今日以降すべて削除'}
                    </Text>
                    
                    <Text fontSize="sm" color="gray.600">
                      {deleteOption === 'today' && `${formatDate(workoutToDelete.date)} のワークアウトのみ削除`}
                      
                      {deleteOption === 'recurring' && (() => {
                        const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
                        const targetDate = new Date(workoutToDelete.date);
                        const targetDayName = dayNames[targetDate.getDay()];
                        const futureCount = workouts.filter(w => {
                          const workoutDate = new Date(w.date);
                          return workoutDate >= targetDate && workoutDate.getDay() === targetDate.getDay();
                        }).length;
                        return `${targetDayName}の今後のワークアウト（${futureCount}件）を削除します`;
                      })()}
                      
                      {deleteOption === 'all' && (() => {
                        const targetDate = new Date(workoutToDelete.date);
                        const futureCount = workouts.filter(w => {
                          const workoutDate = new Date(w.date);
                          return workoutDate >= targetDate;
                        }).length;
                        return `今日以降のすべてのワークアウト（${futureCount}件）を削除します`;
                      })()}
                    </Text>
                  </VStack>
                </Box>
                
                <Text fontSize="sm" color="red.500" fontWeight="semibold">
                  ⚠️ この操作は元に戻せません
                </Text>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={() => {
                setWorkoutToDelete(null);
                onDeleteWorkoutClose();
              }}
            >
              キャンセル
            </Button>
            <Button 
              colorScheme="red"
              isLoading={submitting}
              onClick={handleDeleteWorkout}
            >
              削除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Workout Plan Modal */}
      <Modal isOpen={isCreatePlanOpen} onClose={onCreatePlanClose} size={{ base: "full", md: "2xl" }}>
        <ModalOverlay />
        <ModalContent maxH={{ base: "100vh", md: "90vh" }} overflowY="auto" m={{ base: 0, md: 4 }}>
          <form onSubmit={handleCreatePlan}>
            <ModalHeader p={{ base: 4, md: 6 }}>
              <VStack align="start" spacing={1}>
                <Text fontSize={{ base: "lg", md: "xl" }}>ワークアウトプログラムを作成</Text>
                <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="normal" color="gray.600">
                  体系的なトレーニングプログラムを計画しましょう
                </Text>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                {/* Info Box */}
                <Box w="full" p={4} bg="purple.50" borderRadius="md" borderLeft="4px solid" borderColor="purple.500">
                  <HStack align="start" spacing={3}>
                    <Icon as={FiInfo} color="purple.600" boxSize={5} mt={0.5} />
                    <Box flex="1">
                      <Text fontSize="sm" fontWeight="bold" color="purple.900" mb={1}>
                        ワークアウトプログラムとは？
                      </Text>
                      <Text fontSize="xs" color="purple.800">
                        通常のワークアウトが「1回のトレーニング」であるのに対し、
                        プログラムは「数週間〜数ヶ月の構造化されたトレーニング計画」です。
                        目標達成のための体系的なプログラムを作成しましょう。
                      </Text>
                    </Box>
                  </HStack>
                </Box>

                <FormControl isRequired>
                  <FormLabel>プログラム名</FormLabel>
                  <Input
                    name="name"
                    value={newPlanData.name}
                    onChange={handleNewPlanChange}
                    placeholder="例: 12週間フルボディ改造プログラム"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>簡単な説明</FormLabel>
                  <Textarea
                    name="description"
                    value={newPlanData.description}
                    onChange={handleNewPlanChange}
                    placeholder="例: 初心者から中級者向けの全身トレーニングプログラム。筋力と筋肉量を増やすことを目標としています。"
                    rows={3}
                  />
                </FormControl>

                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>目標</FormLabel>
                    <Select
                      name="goal"
                      value={newPlanData.goal}
                      onChange={handleNewPlanChange}
                      placeholder="目標を選択"
                    >
                      <option value="weight_loss">減量</option>
                      <option value="muscle_gain">筋肉増強</option>
                      <option value="strength">筋力向上</option>
                      <option value="endurance">持久力</option>
                      <option value="general_fitness">総合的なフィットネス</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>難易度</FormLabel>
                    <Select
                      name="difficulty"
                      value={newPlanData.difficulty}
                      onChange={handleNewPlanChange}
                      placeholder="難易度を選択"
                    >
                      <option value="beginner">初級</option>
                      <option value="intermediate">中級</option>
                      <option value="advanced">上級</option>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>
                      プログラム期間（週）
                      <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                        推奨2-16週
                      </Text>
                    </FormLabel>
                    <Input
                      type="number"
                      name="duration_weeks"
                      value={newPlanData.duration_weeks}
                      onChange={handleNewPlanChange}
                      min={1}
                      max={52}
                      placeholder="8"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      プログラム全体の期間を設定
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>
                      週あたりのトレーニング日数
                      <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                        推奨3-5日
                      </Text>
                    </FormLabel>
                    <Input
                      type="number"
                      name="days_per_week"
                      value={newPlanData.days_per_week}
                      onChange={handleNewPlanChange}
                      min={1}
                      max={7}
                      placeholder="4"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      1週間に何日トレーニングするか
                    </Text>
                  </FormControl>
                </Grid>

                <FormControl isRequired>
                  <FormLabel>プログラムの詳細な概要</FormLabel>
                  <Textarea
                    name="overview"
                    value={newPlanData.overview}
                    onChange={handleNewPlanChange}
                    placeholder="例: このプログラムは、初心者が筋力と筋肉量を増やすために設計されています。毎週少しずつ負荷を上げていく漸進的オーバーロード方式を採用しています。"
                    rows={4}
                  />
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    プログラムの特徴、アプローチ、期待される結果など
                  </Text>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>必要な器具・前提条件</FormLabel>
                  <Textarea
                    name="requirements"
                    value={newPlanData.requirements}
                    onChange={handleNewPlanChange}
                    placeholder="例: ダンベル（5-20kg）、ベンチ、ヨガマット。トレーニング経験は不要ですが、基本的な体力があると良いです。"
                    rows={3}
                  />
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    必要な器具、推奨されるフィットネスレベルなど
                  </Text>
                </FormControl>

                <Box w="full" p={4} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                  <HStack align="start" spacing={2}>
                    <Icon as={FiInfo} color="blue.600" boxSize={4} mt={0.5} />
                    <Box flex="1">
                      <Text fontSize="sm" color="blue.800" fontWeight="semibold" mb={1}>
                        次のステップ
                      </Text>
                      <Text fontSize="xs" color="blue.700">
                        プログラム作成後、Django管理画面で各日のトレーニング内容を詳細に設定できます。
                        プログラムを開始すると、自動的にワークアウトスケジュールが生成されます。
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCreatePlanClose}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                作成
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Exercise Media Carousel Modal */}
      <Modal isOpen={isExerciseMediaOpen} onClose={onExerciseMediaClose} size="4xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="transparent" shadow="none" maxW="90vw">
          <ModalCloseButton color="white" bg="blackAlpha.600" _hover={{ bg: 'blackAlpha.800' }} />
          <ModalBody p={0}>
            {exerciseMediaView && (
              <Box>
                {/* Exercise Name */}
                <Box textAlign="center" mb={4}>
                  <Heading size="lg" color="white" textShadow="0 2px 4px rgba(0,0,0,0.5)">
                    {exerciseMediaView.name}
                  </Heading>
                  {exerciseMediaView.primary_muscles && exerciseMediaView.primary_muscles.length > 0 && (
                    <Text color="whiteAlpha.900" mt={2} textShadow="0 1px 2px rgba(0,0,0,0.5)">
                      {exerciseMediaView.primary_muscles.join(', ')}
                      {' • '}
                      {exerciseMediaView.secondary_muscles && exerciseMediaView.secondary_muscles.length > 0
                        ? exerciseMediaView.secondary_muscles.join(', ')
                        : 'none'}
                    </Text>
                  )}
                </Box>

                {/* Media Carousel */}
                {exerciseMediaView.media_files && exerciseMediaView.media_files.length > 0 ? (
                  <Box position="relative">
                    {/* Main Media Display */}
                    <Box
                      bg="gray.900"
                      borderRadius="xl"
                      overflow="hidden"
                      maxH="70vh"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {(() => {
                        const currentMedia = exerciseMediaView.media_files[currentMediaIndex];
                        // Check if file is a URL (starts with http:// or https://)
                        const fileStr = String(currentMedia.file);
                        const isUrl = fileStr.startsWith('http://') || fileStr.startsWith('https://');
                        
                        if (currentMedia.media_type === 'image') {
                          return (
                            <Image
                              src={isUrl ? fileStr : getImageUrl(currentMedia.file)}
                              alt={exerciseMediaView.name}
                              maxH="70vh"
                              maxW="100%"
                              objectFit="contain"
                            />
                          );
                        } else {
                          // Video
                          if (isUrl) {
                            // For URL-based videos (YouTube, etc.), use iframe
                            let embedUrl = fileStr;
                            if (embedUrl.includes('youtube.com/watch')) {
                              const urlObj = new URL(embedUrl);
                              const videoId = urlObj.searchParams.get('v');
                              if (videoId) {
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                              }
                            } else if (embedUrl.includes('youtu.be/')) {
                              // Handle youtu.be short links
                              const videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
                              embedUrl = `https://www.youtube.com/embed/${videoId}`;
                            }
                            return (
                              <Box w="100%" h="70vh" display="flex" alignItems="center" justifyContent="center">
                                <iframe
                                  src={embedUrl}
                                  title={exerciseMediaView.name}
                                  style={{ 
                                    width: '100%', 
                                    height: '500px',
                                    maxHeight: '70vh',
                                    border: 'none'
                                  }}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </Box>
                            );
                          } else {
                            // For uploaded video files, use video tag
                            return (
                              <Box w="100%" maxH="70vh">
                                <video
                                  src={getImageUrl(currentMedia.file)}
                                  controls
                                  style={{ 
                                    width: '100%', 
                                    maxHeight: '70vh',
                                    objectFit: 'contain'
                                  }}
                                />
                              </Box>
                            );
                          }
                        }
                      })()}
                    </Box>

                    {/* Navigation Buttons */}
                    {exerciseMediaView.media_files.length > 1 && (
                      <>
                        <IconButton
                          icon={<FiChevronLeft />}
                          position="absolute"
                          left={4}
                          top="50%"
                          transform="translateY(-50%)"
                          colorScheme="whiteAlpha"
                          bg="blackAlpha.600"
                          color="white"
                          size="lg"
                          borderRadius="full"
                          _hover={{ bg: 'blackAlpha.800' }}
                          onClick={handlePrevMedia}
                          aria-label="前へ"
                        />
                        <IconButton
                          icon={<FiChevronRight />}
                          position="absolute"
                          right={4}
                          top="50%"
                          transform="translateY(-50%)"
                          colorScheme="whiteAlpha"
                          bg="blackAlpha.600"
                          color="white"
                          size="lg"
                          borderRadius="full"
                          _hover={{ bg: 'blackAlpha.800' }}
                          onClick={handleNextMedia}
                          aria-label="次へ"
                        />
                      </>
                    )}

                    {/* Media Counter */}
                    <Box
                      position="absolute"
                      bottom={4}
                      left="50%"
                      transform="translateX(-50%)"
                      bg="blackAlpha.700"
                      color="white"
                      px={4}
                      py={2}
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      {currentMediaIndex + 1} / {exerciseMediaView.media_files.length}
                    </Box>
                  </Box>
                ) : (
                  <Center h="400px" bg="gray.900" borderRadius="xl">
                    <VStack spacing={4}>
                      <Icon as={FiImage} boxSize={16} color="gray.500" />
                      <Text color="gray.400" fontSize="lg">
                        メディアがありません
                      </Text>
                    </VStack>
                  </Center>
                )}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Start Workout Plan Modal */}
      <Modal isOpen={isStartPlanOpen} onClose={onStartPlanClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text>プログラムを開始</Text>
              {planToStart && (
                <Text fontSize="sm" fontWeight="normal" color="gray.600">
                  {planToStart.name}
                </Text>
              )}
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {planToStart && (
              <VStack spacing={4} align="stretch">
                {/* Warning if there's an active schedule */}
                {activeSchedule && (() => {
                  const activePlan = activeSchedule.workout_plan;
                  const activeEndDate = new Date(activeSchedule.start_date);
                  activeEndDate.setDate(activeEndDate.getDate() + (activePlan.duration_weeks * 7));
                  
                  return (
                    <Box p={3} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.500">
                      <HStack align="start" spacing={2}>
                        <Icon as={FiInfo} color="orange.600" boxSize={4} mt={0.5} />
                        <Box flex="1">
                          <Text fontSize="sm" color="orange.800" fontWeight="semibold" mb={1}>
                            ⚠️ 既存のプログラムが実行中
                          </Text>
                          <Text fontSize="xs" color="orange.700">
                            現在「{activePlan.name}」が実行中です（終了予定: {activeEndDate.toLocaleDateString('ja-JP')}）。
                            期間が重複しないようにしてください。
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                  );
                })()}

                {/* Plan Info */}
                <Box p={4} bg="purple.50" borderRadius="md">
                  <SimpleGrid columns={3} spacing={3} mb={3}>
                    <Box>
                      <Text fontSize="xs" color="gray.600">期間</Text>
                      <Text fontWeight="bold">{planToStart.duration_weeks}週間</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">頻度</Text>
                      <Text fontWeight="bold">週{planToStart.days_per_week}日</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">難易度</Text>
                      <Badge
                        colorScheme={
                          planToStart.difficulty === 'beginner' ? 'green' :
                          planToStart.difficulty === 'intermediate' ? 'yellow' : 'red'
                        }
                      >
                        {planToStart.difficulty === 'beginner' ? '初級' :
                         planToStart.difficulty === 'intermediate' ? '中級' : '上級'}
                      </Badge>
                    </Box>
                  </SimpleGrid>
                  <Text fontSize="sm" color="gray.700">
                    {planToStart.description}
                  </Text>
                </Box>

                {/* Start Date Picker */}
                <FormControl isRequired>
                  <FormLabel>
                    <HStack spacing={2}>
                      <Icon as={FiClock} />
                      <Text>開始日</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Text fontSize="xs" color="gray.600" mt={2}>
                    この日からプログラムが開始されます。ワークアウトスケジュールが自動的に生成されます。
                  </Text>
                </FormControl>

                {/* Info Box */}
                <Box p={3} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                  <HStack align="start" spacing={2}>
                    <Icon as={FiInfo} color="blue.600" boxSize={4} mt={0.5} />
                    <Box flex="1">
                      <Text fontSize="sm" color="blue.800" fontWeight="semibold" mb={1}>
                        💡 プログラムについて
                      </Text>
                      <Text fontSize="xs" color="blue.700">
                        プログラムを開始すると、{planToStart.duration_weeks}週間のトレーニングスケジュールが作成されます。
                        毎日のワークアウトが自動的にカレンダーに追加され、進捗を追跡できます。
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={() => {
                setPlanToStart(null);
                onStartPlanClose();
              }}
            >
              キャンセル
            </Button>
            <Button 
              colorScheme="brand"
              leftIcon={<FiPlay />}
              isLoading={submitting}
              onClick={handleStartPlan}
            >
              プログラムを開始
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Stop Active Schedule Modal */}
      <Modal isOpen={isStopPlanOpen} onClose={onStopPlanClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>プログラムを終了</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {activeSchedule && (
              <VStack spacing={4} align="stretch">
                <Text>
                  「<strong>{activeSchedule.workout_plan.name}</strong>」を終了してもよろしいですか？
                </Text>

                <Box p={4} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.500">
                  <HStack align="start" spacing={2} mb={2}>
                    <Icon as={FiInfo} color="orange.600" boxSize={5} mt={0.5} />
                    <Text fontSize="sm" color="orange.800" fontWeight="semibold">
                      プログラム情報
                    </Text>
                  </HStack>
                  <VStack align="stretch" spacing={1} fontSize="sm" color="orange.700" pl={7}>
                    <Text>開始日: {new Date(activeSchedule.start_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                    <Text>期間: {activeSchedule.workout_plan.duration_weeks}週間</Text>
                    <Text>頻度: 週{activeSchedule.workout_plan.days_per_week}日</Text>
                  </VStack>
                </Box>

                <Box p={3} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                  <Text fontSize="sm" color="blue.800">
                    💡 プログラムを終了すると、アクティブ状態が解除されます。記録されたワークアウトデータは保持されます。
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onStopPlanClose}
            >
              キャンセル
            </Button>
            <Button 
              colorScheme="orange"
              leftIcon={<FiX />}
              isLoading={submitting}
              onClick={handleStopSchedule}
            >
              プログラムを終了
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Workout Plan Confirmation Modal */}
      <Modal isOpen={isDeletePlanOpen} onClose={onDeletePlanClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>ワークアウトプランを削除</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {planToDelete && (
              <VStack spacing={3} align="stretch">
                {activeSchedule && activeSchedule.workout_plan?.id === planToDelete.id ? (
                  <>
                    <Text>
                      「<strong>{planToDelete.name}</strong>」は現在実行中のプログラムです。
                    </Text>
                    <Box p={3} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.500">
                      <Text fontSize="sm" color="orange.800" fontWeight="bold" mb={2}>
                        ⚠️ 実行中のプログラムは削除できません
                      </Text>
                      <Text fontSize="sm" color="orange.800">
                        このプログラムを削除するには、まずプログラムを終了してください。プログラム詳細画面から「プログラムを終了」ボタンをクリックしてください。
                      </Text>
                    </Box>
                  </>
                ) : (
                  <>
                    <Text>
                      「<strong>{planToDelete.name}</strong>」を削除してもよろしいですか？
                    </Text>
                    <Box p={3} bg="red.50" borderRadius="md" borderLeft="4px solid" borderColor="red.500">
                      <Text fontSize="sm" color="red.800">
                        ⚠️ このプログラムに関連する全てのデータが削除されます。この操作は取り消せません。
                      </Text>
                    </Box>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={() => {
                setPlanToDelete(null);
                onDeletePlanClose();
              }}
            >
              {activeSchedule && activeSchedule.workout_plan?.id === planToDelete?.id ? '閉じる' : 'キャンセル'}
            </Button>
            <Button 
              colorScheme="red"
              isLoading={submitting}
              isDisabled={activeSchedule && activeSchedule.workout_plan?.id === planToDelete?.id}
              onClick={async () => {
                if (!planToDelete) return;
                
                // Double check if plan is active
                if (activeSchedule && activeSchedule.workout_plan?.id === planToDelete.id) {
                  toast({
                    title: '実行中のプログラムは削除できません',
                    description: 'まずプログラムを終了してください',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                }
                
                setSubmitting(true);
                try {
                  await workoutsService.workoutPlans.delete(planToDelete.id);
                  
                  toast({
                    title: 'プランを削除しました',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                  
                  // Clear selected plan if it was deleted
                  if (selectedPlan?.id === planToDelete.id) {
                    setSelectedPlan(null);
                  }
                  
                  setPlanToDelete(null);
                  onDeletePlanClose();
                  await loadData();
                } catch (error) {
                  console.error('Delete plan error:', error);
                  toast({
                    title: '削除に失敗しました',
                    description: error.response?.data?.detail || 'もう一度お試しください',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              削除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Complete Workout Confirmation Modal */}
      <Modal isOpen={isCompleteWorkoutOpen} onClose={onCompleteWorkoutClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>ワークアウト完了確認</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                このワークアウトを完了しますか？
              </Text>
              {workoutToComplete && (
                <Box p={3} bg={hoverBg} borderRadius="md">
                  <Text fontWeight="semibold" mb={1}>
                    {workoutToComplete.name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {formatDate(workoutToComplete.date)}
                  </Text>
                </Box>
              )}
              
              {workoutToComplete && workoutToComplete.exercises && (
                <Box>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">
                    チェック済みエクササイズ ({workoutToComplete.exercises.filter((exercise, idx) => 
                      getExerciseCheckStatus(exercise.id, idx)).length}/{workoutToComplete.exercises.length})
                  </Text>
                  <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                    {workoutToComplete.exercises.map((exercise, idx) => {
                      const isChecked = getExerciseCheckStatus(exercise.id, idx);
                      if (!isChecked) return null;
                      
                      return (
                        <Box 
                          key={idx}
                          p={2} 
                          bg="green.50" 
                          borderRadius="md" 
                          borderLeft="3px solid"
                          borderColor="green.400"
                        >
                          <Flex align="center" gap={2}>
                            <Icon as={FiCheck} color="green.500" />
                            <Text fontSize="sm" fontWeight="medium">
                              {exercise.exercise?.name || exercise.name || 'エクササイズ'}
                            </Text>
                          </Flex>
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            {exercise.planned_sets || exercise.sets || 0}セット × {exercise.planned_reps || exercise.reps || 0}回
                          </Text>
                        </Box>
                      );
                    })}
                    
                    {/* Show unchecked exercises count */}
                    {workoutToComplete.exercises.filter((exercise, idx) => 
                      !getExerciseCheckStatus(exercise.id, idx)).length > 0 && (
                      <Box p={2} bg="gray.50" borderRadius="md" borderLeft="3px solid" borderColor="gray.300">
                        <Text fontSize="sm" color="gray.600">
                          未完了: {workoutToComplete.exercises.filter((exercise, idx) => 
                            !getExerciseCheckStatus(exercise.id, idx)).length}種目
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}
              
              <Text fontSize="sm" color="gray.600">
                完了後は編集や削除ができなくなります。
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCompleteWorkoutClose}>
              キャンセル
            </Button>
            <Button 
              colorScheme="green" 
              isLoading={submitting}
              onClick={() => workoutToComplete && handleCompleteWorkout(workoutToComplete)}
            >
              完了する
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Options Modal */}
      <Modal isOpen={isDeleteOptionsOpen} onClose={onDeleteOptionsClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>削除オプション選択</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                削除する範囲を選択してください：
              </Text>
              {workoutToDelete && (
                <Box p={3} bg={hoverBg} borderRadius="md">
                  <Text fontWeight="semibold" mb={1}>
                    {workoutToDelete.name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {formatDate(workoutToDelete.date)}
                  </Text>
                </Box>
              )}
              
              <VStack spacing={3} align="stretch">
                <Box
                  p={3}
                  border="2px solid"
                  borderColor={deleteOption === 'today' ? 'blue.500' : 'gray.200'}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => setDeleteOption('today')}
                  bg={deleteOption === 'today' ? 'blue.50' : 'transparent'}
                >
                  <Flex align="center" gap={3}>
                    <Box
                      w={4}
                      h={4}
                      borderRadius="full"
                      border="2px solid"
                      borderColor={deleteOption === 'today' ? 'blue.500' : 'gray.300'}
                      bg={deleteOption === 'today' ? 'blue.500' : 'transparent'}
                    />
                    <Box>
                      <Text fontWeight="semibold">今日だけ削除</Text>
                      <Text fontSize="sm" color="gray.600">
                        {workoutToDelete && `${formatDate(workoutToDelete.date)} のワークアウトのみ削除`}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                <Box
                  p={3}
                  border="2px solid"
                  borderColor={deleteOption === 'recurring' ? 'orange.500' : 'gray.200'}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => setDeleteOption('recurring')}
                  bg={deleteOption === 'recurring' ? 'orange.50' : 'transparent'}
                >
                  <Flex align="center" gap={3}>
                    <Box
                      w={4}
                      h={4}
                      borderRadius="full"
                      border="2px solid"
                      borderColor={deleteOption === 'recurring' ? 'orange.500' : 'gray.300'}
                      bg={deleteOption === 'recurring' ? 'orange.500' : 'transparent'}
                    />
                    <Box>
                      <Text fontWeight="semibold">同じ曜日の今後の分を削除</Text>
                      <Text fontSize="sm" color="gray.600">
                        {workoutToDelete && (() => {
                          const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
                          const targetDate = new Date(workoutToDelete.date);
                          const targetDayName = dayNames[targetDate.getDay()];
                          const futureCount = workouts.filter(w => {
                            const workoutDate = new Date(w.date);
                            return workoutDate >= targetDate && workoutDate.getDay() === targetDate.getDay();
                          }).length;
                          return `${targetDayName}の今後のワークアウト（${futureCount}件）を削除`;
                        })()}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                <Box
                  p={3}
                  border="2px solid"
                  borderColor={deleteOption === 'all' ? 'red.500' : 'gray.200'}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => setDeleteOption('all')}
                  bg={deleteOption === 'all' ? 'red.50' : 'transparent'}
                >
                  <Flex align="center" gap={3}>
                    <Box
                      w={4}
                      h={4}
                      borderRadius="full"
                      border="2px solid"
                      borderColor={deleteOption === 'all' ? 'red.500' : 'gray.300'}
                      bg={deleteOption === 'all' ? 'red.500' : 'transparent'}
                    />
                    <Box>
                      <Text fontWeight="semibold">今日以降すべて削除</Text>
                      <Text fontSize="sm" color="gray.600">
                        {workoutToDelete && (() => {
                          const targetDate = new Date(workoutToDelete.date);
                          const futureCount = workouts.filter(w => {
                            const workoutDate = new Date(w.date);
                            return workoutDate >= targetDate;
                          }).length;
                          return `今日以降のすべてのワークアウト（${futureCount}件）を削除`;
                        })()}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteOptionsClose}>
              キャンセル
            </Button>
            <Button 
              colorScheme={deleteOption === 'all' ? 'red' : deleteOption === 'recurring' ? 'orange' : 'blue'} 
              onClick={() => {
                setWorkoutToDelete(workoutToDelete);
                onDeleteOptionsClose();
                onDeleteWorkoutOpen();
              }}
            >
              削除実行
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Workouts;

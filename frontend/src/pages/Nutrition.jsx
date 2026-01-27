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
  Tooltip,
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
  InputGroup,
  InputLeftElement,
  Select,
  useToast,
  Spinner,
  Center,
  useColorModeValue,
  SimpleGrid,
  Badge,
  VStack,
  HStack,
  Icon,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Divider,
  Image,
  Flex,
  Checkbox,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiHeart,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiCoffee,
  FiSun,
  FiMoon,
  FiStar,
  FiClock,
  FiEdit,
} from 'react-icons/fi';
import { FaCookieBite, FaTimes, FaCalendar, FaEye, FaEdit } from 'react-icons/fa';
import nutritionService from '../services/nutrition';
import { formatDate } from '../utils/helpers';
import { MEAL_TYPES } from '../utils/constants';
import { useDebounce } from '../hooks/useDebounce';

const Nutrition = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isCreateFoodOpen, onOpen: onCreateFoodOpen, onClose: onCreateFoodClose } = useDisclosure();
  const { isOpen: isEditFoodOpen, onOpen: onEditFoodOpen, onClose: onEditFoodClose } = useDisclosure();
  const { isOpen: isCreatePlanOpen, onOpen: onCreatePlanOpen, onClose: onCreatePlanClose } = useDisclosure();
  const { isOpen: isCreateRecipeOpen, onOpen: onCreateRecipeOpen, onClose: onCreateRecipeClose } = useDisclosure();
  const { isOpen: isEditRecipeOpen, onOpen: onEditRecipeOpen, onClose: onEditRecipeClose } = useDisclosure();
  const { isOpen: isRecipeDetailOpen, onOpen: onRecipeDetailOpen, onClose: onRecipeDetailClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isDeletePlanOpen, onOpen: onDeletePlanOpen, onClose: onDeletePlanClose } = useDisclosure();
  const { isOpen: isPlanDateRangeOpen, onOpen: onPlanDateRangeOpen, onClose: onPlanDateRangeClose } = useDisclosure();
  const { isOpen: isCancelPlanOpen, onOpen: onCancelPlanOpen, onClose: onCancelPlanClose } = useDisclosure();
  const toast = useToast();
  const [meals, setMeals] = useState([]);
  const [foods, setFoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  const [planSearchTerm, setPlanSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [modalSearchLoading, setModalSearchLoading] = useState(false);
  const [foodCurrentPage, setFoodCurrentPage] = useState(1);
  const [foodItemsPerPage] = useState(7);
  const [planCurrentPage, setPlanCurrentPage] = useState(1);
  const [planItemsPerPage] = useState(7);
  const [recipeCurrentPage, setRecipeCurrentPage] = useState(1);
  const [recipeItemsPerPage] = useState(6);
  const [foodToDelete, setFoodToDelete] = useState(null);
  const [foodToEdit, setFoodToEdit] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [planToActivate, setPlanToActivate] = useState(null);
  const [planToCancel, setPlanToCancel] = useState(null);
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const saved = localStorage.getItem('selectedMealPlan');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Debounce search terms
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedModalSearchTerm = useDebounce(modalSearchTerm, 500);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeFavorites, setRecipeFavorites] = useState(() => {
    const saved = localStorage.getItem('recipeFavorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [customRecipes, setCustomRecipes] = useState([]);
  const [formData, setFormData] = useState({
    meal_type: 'breakfast',
    date: new Date().toISOString().split('T')[0],
    repeat_type: 'none', // 'none', 'daily', 'weekly'
    repeat_until: '',
    weekly_days: [], // Array of day indices (0=Sunday, 1=Monday, ..., 6=Saturday)
  });
  const [weeklyDaysError, setWeeklyDaysError] = useState('');
  const [newFoodData, setNewFoodData] = useState({
    name: '',
    category: 'other',
    calories: '',
    protein: '',
    carbohydrates: '',
    fats: '',
    serving_size: '100',
    unit: 'g',
  });
  const [newPlanData, setNewPlanData] = useState({
    name: '',
    description: '',
    target_calories: '',
    target_protein: '',
    target_carbs: '',
    target_fats: '',
    duration_days: '7',
  });
  const [newRecipeData, setNewRecipeData] = useState({
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    time: '',
    servings: '',
    image: null,
  });
  const [recipeImagePreview, setRecipeImagePreview] = useState(null);

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

  useEffect(() => {
    loadData();
  }, []);

  // Save recipe favorites to localStorage
  useEffect(() => {
    localStorage.setItem('recipeFavorites', JSON.stringify(recipeFavorites));
  }, [recipeFavorites]);

  // Save selected meal plan to localStorage
  useEffect(() => {
    if (selectedPlan) {
      localStorage.setItem('selectedMealPlan', JSON.stringify(selectedPlan));
    } else {
      localStorage.removeItem('selectedMealPlan');
    }
  }, [selectedPlan]);

  // Effect for Food Database tab search
  useEffect(() => {
    if (activeTab === 1) {
      searchFoods(debouncedSearchTerm);
      setFoodCurrentPage(1); // 検索時にページネーションをリセット
    }
  }, [debouncedSearchTerm, activeTab]);

  // Effect for Modal search
  useEffect(() => {
    if (isOpen) {
      searchFoodsForModal(debouncedModalSearchTerm);
    }
  }, [debouncedModalSearchTerm, isOpen]);

  // Effect to reset plan pagination when search term changes
  useEffect(() => {
    setPlanCurrentPage(1);
  }, [planSearchTerm]);

  // Effect to reset recipe pagination when search term changes
  useEffect(() => {
    setRecipeCurrentPage(1);
  }, [recipeSearchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mealsResponse, favoritesResponse, mealPlansResponse, recipesResponse] = await Promise.all([
        nutritionService.meals.getAll(),
        nutritionService.favorites.getAll(),
        nutritionService.mealPlans.getAll(),
        nutritionService.recipes.getAll(),
      ]);
      setMeals(mealsResponse.results || mealsResponse);
      setFavorites(favoritesResponse.results || favoritesResponse);
      const loadedMealPlans = mealPlansResponse.results || mealPlansResponse;
      setMealPlans(loadedMealPlans);
      setCustomRecipes(recipesResponse.results || recipesResponse);
      
      // Validate selectedPlan still exists in loaded meal plans
      if (selectedPlan) {
        const planStillExists = loadedMealPlans.find(plan => plan.id === selectedPlan.id);
        if (!planStillExists) {
          // Plan no longer exists, clear it
          setSelectedPlan(null);
          localStorage.removeItem('selectedMealPlan');
        } else {
          // Update with fresh data from server
          setSelectedPlan(planStillExists);
        }
      }
      
      // Load initial foods
      await searchFoods('');
    } catch (error) {
      console.error('Load data error:', error);
      toast({
        title: 'データ読み込みエラー',
        description: error.response?.data?.detail || '栄養データの読み込みに失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const searchFoods = async (query) => {
    try {
      setSearchLoading(true);
      const response = await nutritionService.foods.search(query);
      setFoods(response.results || response);
    } catch (error) {
      console.error('Food search error:', error);
      toast({
        title: '検索エラー',
        description: '食品の検索に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const searchFoodsForModal = async (query) => {
    try {
      setModalSearchLoading(true);
      const response = await nutritionService.foods.search(query);
      setFoods(response.results || response);
    } catch (error) {
      console.error('Modal food search error:', error);
    } finally {
      setModalSearchLoading(false);
    }
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

  const handleFoodSelect = (food) => {
    setSelectedFoods([...selectedFoods, { ...food, quantity: food.serving_size || 100 }]);
  };

  const handleFoodRemove = (index) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, quantity) => {
    const updatedFoods = [...selectedFoods];
    updatedFoods[index].quantity = quantity;
    setSelectedFoods(updatedFoods);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFoods.length === 0) {
      toast({
        title: '食品が選択されていません',
        description: '少なくとも1つの食品を追加してください',
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
        title: '過去の日付には食事を追加できません',
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

      // Create meals for each date
      const mealPromises = dates.map(date => {
        const mealData = {
          name: `${formData.meal_type} - ${date.toLocaleDateString('ja-JP')}`,
          meal_type: formData.meal_type,
          date: date.toISOString().split('T')[0],
          items: selectedFoods.map(food => ({
            food_id: food.id,
            serving_size: food.quantity,
          })),
        };
        return nutritionService.meals.create(mealData);
      });

      await Promise.all(mealPromises);
      
      // Reload data first before closing modal
      await loadData();
      
      const repeatText = formData.repeat_type !== 'none' ? 
        ` (${dates.length}日分の食事を${formData.repeat_type === 'daily' ? '毎日' : formData.repeat_type === 'weekly' ? `毎週(${formData.weekly_days.map(day => ['日', '月', '火', '水', '木', '金', '土'][day]).join(', ')})` : ''}繰り返しで記録しました)` : '';
      
      toast({
        title: '食事を追加しました',
        description: repeatText,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form state
      setSelectedFoods([]);
      setFormData({
        meal_type: 'breakfast',
        date: new Date().toISOString().split('T')[0],
        repeat_type: 'none',
        repeat_until: '',
        weekly_days: [],
      });
      setWeeklyDaysError('');
      
      // Close modal after everything is done
      onClose();
    } catch (error) {
      toast({
        title: '食事追加エラー',
        description: error.response?.data?.detail || '食事の追加に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    try {
      await nutritionService.meals.delete(mealId);
      // Immediately remove from local state for faster UI update
      setMeals(prev => prev.filter(meal => meal.id !== mealId));
      toast({
        title: '食事を削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Still call loadData to ensure consistency with server
      await loadData();
    } catch (error) {
      toast({
        title: '削除エラー',
        description: '食事の削除に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      // Reload data to revert any optimistic updates
      await loadData();
    }
  };

  const handleDeleteMealItem = async (mealId, itemId) => {
    try {
      await nutritionService.meals.removeItem(mealId, itemId);
      
      // Optimistically update the meals state
      setMeals(prev => prev.map(meal => {
        if (meal.id === mealId) {
          const updatedMealItems = meal.items.filter(item => item.id !== itemId);
          // Recalculate total calories
          const totalCalories = updatedMealItems.reduce((sum, item) => sum + item.calories, 0);
          return {
            ...meal,
            items: updatedMealItems,
            total_calories: totalCalories
          };
        }
        return meal;
      }));
      
      toast({
        title: '食品を削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Still call loadData to ensure consistency with server
      await loadData();
    } catch (error) {
      toast({
        title: '削除エラー',
        description: '食品の削除に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      // Reload data to revert any optimistic updates
      await loadData();
    }
  };

  const toggleFavorite = async (food) => {
    const already = favorites.some(f => f.food.id === food.id);
    try {
      setSubmitting(true);
      await nutritionService.favorites.toggle(food.id);
      // Refresh only the favorites to update the sidebar quickly
      const favs = await nutritionService.favorites.getAll();
      setFavorites(favs.results || favs);

      toast({
        title: already ? 'お気に入りから削除しました' : 'お気に入りに追加しました',
        status: already ? 'info' : 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'お気に入り更新エラー',
        description: error.response?.data?.detail || 'お気に入りの更新に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete confirmation modal for a food
  const handleDeleteFood = (food) => {
    setFoodToDelete(food);
    onDeleteOpen();
  };

  // Perform the deletion after confirmation in modal
  const performDeleteFood = async () => {
    if (!foodToDelete) return;
    try {
      setSubmitting(true);
      await nutritionService.foods.delete(foodToDelete.id);
      toast({
        title: '食品を削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Refresh foods and favorites
      await searchFoods(searchTerm);
      const favs = await nutritionService.favorites.getAll();
      setFavorites(favs.results || favs);
    } catch (error) {
      toast({
        title: '削除エラー',
        description: error.response?.data?.detail || '食品の削除に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
      // Always reset selection and close modal so it doesn't get stuck
      setFoodToDelete(null);
      onDeleteClose();
    }
  };

  const quickAddFavorite = (favorite) => {
    setSelectedMealType('breakfast');
    setFormData({
      meal_type: 'breakfast',
      date: selectedDate.toISOString().split('T')[0],
      repeat_type: 'none',
      repeat_until: '',
      weekly_days: [],
    });
    setSelectedFoods([{ ...favorite.food, quantity: favorite.food.serving_size || 100 }]);
    setWeeklyDaysError('');
    onOpen();
  };

  const openAddFoodModal = (mealType) => {
    setSelectedMealType(mealType);
    setFormData({
      meal_type: mealType,
      date: selectedDate.toISOString().split('T')[0],
      repeat_type: 'none',
      repeat_until: '',
      weekly_days: [],
    });
    setSelectedFoods([]);
    setWeeklyDaysError('');
    onOpen();
  };

  const handleNewFoodChange = (e) => {
    setNewFoodData({
      ...newFoodData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateFood = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await nutritionService.foods.create({
        name: newFoodData.name,
        category: newFoodData.category,
        calories: parseFloat(newFoodData.calories),
        protein: parseFloat(newFoodData.protein),
        carbohydrates: parseFloat(newFoodData.carbohydrates),
        fats: parseFloat(newFoodData.fats),
        serving_size: parseFloat(newFoodData.serving_size),
        unit: newFoodData.unit,
      });

      toast({
        title: '食品を作成しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onCreateFoodClose();
      loadData();
      setNewFoodData({
        name: '',
        category: 'other',
        calories: '',
        protein: '',
        carbohydrates: '',
        fats: '',
        serving_size: '100',
        unit: 'g',
      });
    } catch (error) {
      toast({
        title: '食品作成エラー',
        description: error.response?.data?.detail || '食品の作成に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Recipe handlers
  const toggleRecipeFavorite = (recipeId) => {
    const isAlreadyFavorite = recipeFavorites.includes(recipeId);
    
    if (isAlreadyFavorite) {
      setRecipeFavorites(prev => prev.filter(id => id !== recipeId));
      toast({
        title: 'お気に入りから削除しました',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } else {
      setRecipeFavorites(prev => [...prev, recipeId]);
      toast({
        title: 'お気に入りに追加しました',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const openRecipeDetail = (recipe) => {
    setSelectedRecipe(recipe);
    onRecipeDetailOpen();
  };

  const handleCreatePlan = () => {
    onCreatePlanOpen();
  };

  const handleNewPlanChange = (e) => {
    setNewPlanData({
      ...newPlanData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const planData = {
        name: newPlanData.name,
        description: newPlanData.description || '',
        target_calories: newPlanData.target_calories ? parseFloat(newPlanData.target_calories) : undefined,
        target_protein: newPlanData.target_protein ? parseFloat(newPlanData.target_protein) : undefined,
        target_carbs: newPlanData.target_carbs ? parseFloat(newPlanData.target_carbs) : undefined,
        target_fats: newPlanData.target_fats ? parseFloat(newPlanData.target_fats) : undefined,
        duration_days: newPlanData.duration_days ? parseInt(newPlanData.duration_days) : undefined,
      };

      console.log('Sending meal plan data:', planData);
      const createdPlan = await nutritionService.mealPlans.create(planData);

      toast({
        title: '食事プランを作成しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onCreatePlanClose();
      await loadData();
      
      // Reset form
      setNewPlanData({
        name: '',
        description: '',
        target_calories: '',
        target_protein: '',
        target_carbs: '',
        target_fats: '',
        duration_days: '7',
      });
    } catch (error) {
      console.error('Meal plan creation error:', error.response?.data);
      
      // Format error messages
      let errorMessage = '食事プランの作成に失敗しました';
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object' && !errors.detail) {
          // Display field-specific errors
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else {
          errorMessage = errors.detail || JSON.stringify(errors);
        }
      }
      
      toast({
        title: '食事プラン作成エラー',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRecipe = () => {
    setEditingRecipe(null);
    setNewRecipeData({
      name: '',
      description: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      time: '',
      servings: '',
      image: null,
    });
    setRecipeImagePreview(null);
    onCreateRecipeOpen();
  };

  const handleEditFood = (food) => {
    setFoodToEdit(food);
    setNewFoodData({
      name: food.name,
      category: food.category || 'other',
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbohydrates: food.carbohydrates.toString(),
      fats: food.fats.toString(),
      serving_size: food.serving_size.toString(),
      unit: food.unit || 'g',
    });
    onEditFoodOpen();
  };

  const handleUpdateFood = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const foodData = {
        name: newFoodData.name,
        category: newFoodData.category,
        calories: parseFloat(newFoodData.calories),
        protein: parseFloat(newFoodData.protein),
        carbohydrates: parseFloat(newFoodData.carbohydrates),
        fats: parseFloat(newFoodData.fats),
        serving_size: parseFloat(newFoodData.serving_size),
        unit: newFoodData.unit,
      };

      await nutritionService.foods.update(foodToEdit.id, foodData);

      toast({
        title: '食品を更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onEditFoodClose();
      await loadData();
      
      // Reset form
      setNewFoodData({
        name: '',
        category: 'other',
        calories: '',
        protein: '',
        carbohydrates: '',
        fats: '',
        serving_size: '',
        unit: 'g',
      });
      setFoodToEdit(null);
    } catch (error) {
      console.error('Error updating food:', error);
      toast({
        title: 'エラー',
        description: '食品の更新に失敗しました',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setNewRecipeData({
      name: recipe.name,
      description: recipe.description,
      calories: recipe.calories.toString(),
      protein: recipe.protein.toString(),
      carbs: recipe.carbs.toString(),
      fats: recipe.fats.toString(),
      time: recipe.time,
      servings: recipe.servings,
      image: null, // Will keep existing image unless changed
    });
    setRecipeImagePreview(recipe.image || null);
    onEditRecipeOpen();
  };

  const handleNewRecipeChange = (e) => {
    setNewRecipeData({
      ...newRecipeData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRecipeImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewRecipeData({
        ...newRecipeData,
        image: file,
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecipeImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeRecipeImage = () => {
    setNewRecipeData({
      ...newRecipeData,
      image: null,
    });
    setRecipeImagePreview(null);
  };

  const handleSubmitRecipe = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newRecipeData.name || !newRecipeData.description || !newRecipeData.calories || 
        !newRecipeData.protein || !newRecipeData.carbs || !newRecipeData.fats || 
        !newRecipeData.time || !newRecipeData.servings) {
      toast({
        title: '入力エラー',
        description: 'すべての必須項目を入力してください',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', newRecipeData.name);
      formData.append('description', newRecipeData.description);
      formData.append('calories', parseFloat(newRecipeData.calories));
      formData.append('protein', parseFloat(newRecipeData.protein));
      formData.append('carbs', parseFloat(newRecipeData.carbs));
      formData.append('fats', parseFloat(newRecipeData.fats));
      formData.append('time', newRecipeData.time);
      formData.append('servings', newRecipeData.servings);
      
      // Add image if present
      if (newRecipeData.image) {
        formData.append('image', newRecipeData.image);
      }
      
      console.log('Creating recipe with data:', Object.fromEntries(formData));
      
      // Send to backend
      const createdRecipe = await nutritionService.recipes.create(formData);
      
      console.log('Recipe created:', createdRecipe);
      
      // Add to local state
      setCustomRecipes(prevRecipes => [createdRecipe, ...prevRecipes]);
      
      toast({
        title: 'レシピを追加しました',
        description: `${newRecipeData.name}を作成しました`,
        status: 'success',
        duration: 3000,
      });
      
      // Reset form
      setNewRecipeData({
        name: '',
        description: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        time: '',
        servings: '',
        image: null,
      });
      setRecipeImagePreview(null);
      
      onCreateRecipeClose();
    } catch (error) {
      console.error('Error adding recipe:', error);
      toast({
        title: 'エラー',
        description: error.response?.data?.detail || 'レシピの追加に失敗しました',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRecipe = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newRecipeData.name || !newRecipeData.description || !newRecipeData.calories || 
        !newRecipeData.protein || !newRecipeData.carbs || !newRecipeData.fats || 
        !newRecipeData.time || !newRecipeData.servings) {
      toast({
        title: '入力エラー',
        description: 'すべての必須項目を入力してください',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', newRecipeData.name);
      formData.append('description', newRecipeData.description);
      formData.append('calories', parseFloat(newRecipeData.calories));
      formData.append('protein', parseFloat(newRecipeData.protein));
      formData.append('carbs', parseFloat(newRecipeData.carbs));
      formData.append('fats', parseFloat(newRecipeData.fats));
      formData.append('time', newRecipeData.time);
      formData.append('servings', newRecipeData.servings);
      
      // Add image only if a new one was selected
      if (newRecipeData.image) {
        formData.append('image', newRecipeData.image);
      }
      
      console.log('Updating recipe with data:', Object.fromEntries(formData));
      
      // Send to backend
      const updatedRecipe = await nutritionService.recipes.update(editingRecipe.id, formData);
      
      console.log('Recipe updated:', updatedRecipe);
      
      // Update local state
      setCustomRecipes(prevRecipes => 
        prevRecipes.map(recipe => 
          recipe.id === editingRecipe.id ? updatedRecipe : recipe
        )
      );
      
      toast({
        title: 'レシピを更新しました',
        description: `${newRecipeData.name}を更新しました`,
        status: 'success',
        duration: 3000,
      });
      
      // Reset form
      setNewRecipeData({
        name: '',
        description: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        time: '',
        servings: '',
        image: null,
      });
      setRecipeImagePreview(null);
      setEditingRecipe(null);
      
      onEditRecipeClose();
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast({
        title: 'エラー',
        description: error.response?.data?.detail || 'レシピの更新に失敗しました',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const checkDateConflict = (newStartDate, newEndDate, excludePlanId = null) => {
    const newStart = new Date(newStartDate);
    const newEnd = new Date(newEndDate);
    
    for (const plan of mealPlans) {
      // Skip the plan we're trying to update
      if (excludePlanId && plan.id === excludePlanId) continue;
      
      // Skip plans without date ranges
      if (!plan.start_date || !plan.end_date) continue;
      
      const existingStart = new Date(plan.start_date);
      const existingEnd = new Date(plan.end_date);
      
      // Check for any overlap
      if (newStart <= existingEnd && newEnd >= existingStart) {
        return {
          hasConflict: true,
          conflictingPlan: plan,
          conflictStart: existingStart > newStart ? existingStart : newStart,
          conflictEnd: existingEnd < newEnd ? existingEnd : newEnd
        };
      }
    }
    
    return { hasConflict: false };
  };

  const handlePlanClick = (plan) => {
    setPlanToActivate(plan);
    // Set default dates - today as start date and plan duration as end date
    const today = new Date().toISOString().split('T')[0];
    setPlanStartDate(today);
    
    if (plan.duration_days) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days - 1);
      setPlanEndDate(endDate.toISOString().split('T')[0]);
    } else {
      // Default to 7 days if no duration specified
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 6);
      setPlanEndDate(endDate.toISOString().split('T')[0]);
    }
    
    onPlanDateRangeOpen();
  };

  const handlePlanActivation = async () => {
    if (!planToActivate || !planStartDate || !planEndDate) {
      console.error('Missing required data:', { planToActivate, planStartDate, planEndDate });
      return;
    }
    
    // Validate date range
    const start = new Date(planStartDate);
    const end = new Date(planEndDate);
    
    if (end <= start) {
      toast({
        title: '日付エラー',
        description: '終了日は開始日より後の日付を選択してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Check for date conflicts with other plans
    const conflictCheck = checkDateConflict(planStartDate, planEndDate, planToActivate.id);
    if (conflictCheck.hasConflict) {
      toast({
        title: 'スケジュール競合エラー',
        description: `「${conflictCheck.conflictingPlan.name}」と期間が重複しています。\n重複期間: ${conflictCheck.conflictStart.toLocaleDateString('ja-JP')} 〜 ${conflictCheck.conflictEnd.toLocaleDateString('ja-JP')}\n\n先に既存のプランをキャンセルしてください。`,
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setSubmitting(true);
      console.log('Updating plan with data:', {
        id: planToActivate.id,
        start_date: planStartDate,
        end_date: planEndDate
      });
      
      // Update the plan with start and end dates
      const updatedPlan = await nutritionService.mealPlans.update(planToActivate.id, {
        name: planToActivate.name,
        description: planToActivate.description,
        goal: planToActivate.goal,
        daily_calories: planToActivate.daily_calories,
        protein_percentage: planToActivate.protein_percentage,
        carbs_percentage: planToActivate.carbs_percentage,
        fats_percentage: planToActivate.fats_percentage,
        duration_days: planToActivate.duration_days,
        start_date: planStartDate,
        end_date: planEndDate,
      });
      
      console.log('Plan updated successfully:', updatedPlan);
      onPlanDateRangeClose();
      
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      toast({
        title: `${planToActivate.name}の期間を設定しました`,
        description: `${planStartDate}から${planEndDate}まで（${daysDiff}日間）`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reload data to get updated plan
      await loadData();
      
    } catch (error) {
      console.error('Plan activation error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'プランの期間設定に失敗しました';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors.join(', ');
        }
      }
      
      toast({
        title: 'エラー',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
      // Reset form
      setPlanToActivate(null);
      setPlanStartDate('');
      setPlanEndDate('');
    }
  };

  const handlePlanDateRangeCancel = () => {
    setPlanToActivate(null);
    setPlanStartDate('');
    setPlanEndDate('');
    onPlanDateRangeClose();
  };

  const handleCancelPlan = (plan) => {
    setPlanToCancel(plan);
    onCancelPlanOpen();
  };

  const performCancelPlan = async () => {
    if (!planToCancel) return;
    
    try {
      setSubmitting(true);
      console.log('Cancelling plan:', planToCancel.name);
      
      // Update the plan to remove start and end dates
      await nutritionService.mealPlans.update(planToCancel.id, {
        name: planToCancel.name,
        description: planToCancel.description,
        goal: planToCancel.goal,
        daily_calories: planToCancel.daily_calories,
        protein_percentage: planToCancel.protein_percentage,
        carbs_percentage: planToCancel.carbs_percentage,
        fats_percentage: planToCancel.fats_percentage,
        duration_days: planToCancel.duration_days,
        start_date: null,
        end_date: null,
      });
      
      onCancelPlanClose();
      
      toast({
        title: `${planToCancel.name}をキャンセルしました`,
        description: 'プランの期間設定が解除されました',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Reload data to get updated plan
      await loadData();
      
    } catch (error) {
      console.error('Plan cancellation error:', error);
      
      toast({
        title: 'キャンセルエラー',
        description: 'プランのキャンセルに失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
      setPlanToCancel(null);
    }
  };

  const handleDeletePlan = (plan) => {
    setPlanToDelete(plan);
    onDeletePlanOpen();
  };

  const performDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      setSubmitting(true);
      await nutritionService.mealPlans.delete(planToDelete.id);
      toast({
        title: '食事プランを削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Refresh meal plans
      await loadData();
    } catch (error) {
      toast({
        title: '削除エラー',
        description: error.response?.data?.detail || '食事プランの削除に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
      setPlanToDelete(null);
      onDeletePlanClose();
    }
  };

  // Only use custom recipes (no sample data)
  const allRecipes = customRecipes;

  const filteredRecipes = allRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(recipeSearchTerm.toLowerCase())
  );

  const filteredMealPlans = mealPlans.filter(plan => {
    const searchLower = planSearchTerm.toLowerCase();
    return (
      plan.name.toLowerCase().includes(searchLower) ||
      (plan.description && plan.description.toLowerCase().includes(searchLower)) ||
      plan.daily_calories.toString().includes(searchLower)
    );
  });

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDateMeals = meals.filter(meal => meal.date === selectedDateStr);

  // Find active plan for the selected date automatically
  const getActivePlanForDate = (dateStr) => {
    console.log('\n=== PLAN DETECTION DEBUG ===');
    console.log('Selected date:', dateStr);
    console.log('Available meal plans:', mealPlans.map(p => ({
      id: p.id,
      name: p.name,
      start_date: p.start_date,
      end_date: p.end_date
    })));
    
    const activePlan = mealPlans.find(plan => {
      if (!plan.start_date || !plan.end_date) {
        console.log(`Plan "${plan.name}" skipped: missing date fields (start: ${plan.start_date}, end: ${plan.end_date})`);
        return false;
      }
      
      const isInRange = dateStr >= plan.start_date && dateStr <= plan.end_date;
      console.log(`Plan "${plan.name}": ${plan.start_date} <= ${dateStr} <= ${plan.end_date} = ${isInRange}`);
      return isInRange;
    });
    
    console.log('Active plan result:', activePlan?.name || 'None');
    console.log('=== END DEBUG ===\n');
    return activePlan;
  };

  // Get the active plan for the currently selected date
  const activePlanForDate = getActivePlanForDate(selectedDateStr);

  const mealsByType = {
    breakfast: selectedDateMeals.filter(m => m.meal_type === 'breakfast'),
    lunch: selectedDateMeals.filter(m => m.meal_type === 'lunch'),
    dinner: selectedDateMeals.filter(m => m.meal_type === 'dinner'),
    snack: selectedDateMeals.filter(m => m.meal_type === 'snack'),
  };

  const todayCalories = selectedDateMeals.reduce((total, meal) => total + meal.total_calories, 0);
  const todayProtein = selectedDateMeals.reduce((total, meal) => total + meal.total_protein, 0);
  const todayCarbs = selectedDateMeals.reduce((total, meal) => total + meal.total_carbs, 0);
  const todayFats = selectedDateMeals.reduce((total, meal) => total + meal.total_fats, 0);

  // Use selected plan targets or default values (only if plan is active for selected date)
  const targetCalories = activePlanForDate?.daily_calories || 2200;
  
  // Calculate macros from percentages or use defaults
  const targetProtein = activePlanForDate?.protein_percentage 
    ? Math.round((targetCalories * activePlanForDate.protein_percentage / 100) / 4) // 4 cal/g for protein
    : 150;
  
  const targetCarbs = activePlanForDate?.carbs_percentage
    ? Math.round((targetCalories * activePlanForDate.carbs_percentage / 100) / 4) // 4 cal/g for carbs
    : 220;
  
  const targetFats = activePlanForDate?.fats_percentage
    ? Math.round((targetCalories * activePlanForDate.fats_percentage / 100) / 9) // 9 cal/g for fats
    : 70;

  const caloriesPercent = (todayCalories / targetCalories) * 100;
  const proteinPercent = (todayProtein / targetProtein) * 100;
  const carbsPercent = (todayCarbs / targetCarbs) * 100;
  const fatsPercent = (todayFats / targetFats) * 100;

  const weekDays = getWeekDays(currentWeekStart);
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];

  const getMealIcon = (type) => {
    switch (type) {
      case 'breakfast':
        return FiCoffee;
      case 'lunch':
        return FiSun;
      case 'dinner':
        return FiMoon;
      case 'snack':
        return FaCookieBite;
      default:
        return FiCoffee;
    }
  };

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

  const getMealIconColor = (type) => {
    switch (type) {
      case 'breakfast':
        return 'orange.500';
      case 'lunch':
        return 'yellow.500';
      case 'dinner':
        return 'indigo.500';
      case 'snack':
        return 'pink.500';
      default:
        return 'gray.500';
    }
  };

  const getMealLabel = (type) => {
    switch (type) {
      case 'breakfast':
        return '朝食';
      case 'lunch':
        return '昼食';
      case 'dinner':
        return '夕食';
      case 'snack':
        return 'スナック';
      default:
        return type;
    }
  };

  const getDailyCalories = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayMeals = meals.filter(m => m.date === dateStr);
    return dayMeals.reduce((total, meal) => total + meal.total_calories, 0);
  };

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

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  const MealSection = ({ mealType, meals }) => {
    const mealTotal = meals.reduce((sum, meal) => sum + meal.total_calories, 0);
    
    // Check if selected date is in the past (before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastDate = selectedDate < today;
    
    return (
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={3}>
          <HStack>
            <Icon as={getMealIcon(mealType)} color={getMealIconColor(mealType)} boxSize={5} />
            <Heading size="md" fontWeight="semibold">
              {getMealLabel(mealType)}
            </Heading>
          </HStack>
          <Tooltip label={isPastDate ? "過去の日付には食事を追加できません" : ""} placement="top">
            <Button
              size={{ base: "xs", md: "sm" }}
              colorScheme="brand"
              variant="ghost"
              onClick={() => openAddFoodModal(mealType)}
              isDisabled={isPastDate}
            >
              <Icon as={FiPlus} mr={1} />
              <Text display={{ base: "none", sm: "inline" }}>食品を追加</Text>
              <Text display={{ base: "inline", sm: "none" }}>追加</Text>
            </Button>
          </Tooltip>
        </Flex>

        {meals.length > 0 && meals.some(meal => meal.items && meal.items.length > 0) ? (
          <VStack spacing={2} align="stretch">
            {meals.map((meal) => (
              <Box key={meal.id}>
                {meal.items && meal.items.map((foodItem, idx) => (
                  <Flex
                    key={idx}
                    align="center"
                    justify="space-between"
                    p={3}
                    bg={hoverBg}
                    borderRadius="lg"
                    mb={2}
                  >
                    <HStack spacing={3} flex="1">
                      <Box>
                        <Text fontWeight="medium" fontSize="sm">
                          {foodItem.food?.name || '食品'}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {foodItem.serving_size}g
                        </Text>
                      </Box>
                    </HStack>
                    <Box textAlign="right" mr={4}>
                      <Text fontWeight="semibold" fontSize="sm">
                        {Math.round(foodItem.calories)} kcal
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        P: {Math.round(foodItem.protein)}g
                        {' '}C: {Math.round(foodItem.carbohydrates)}g
                        {' '}F: {Math.round(foodItem.fats)}g
                      </Text>
                    </Box>
                    <IconButton
                      icon={<FiTrash2 />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDeleteMealItem(meal.id, foodItem.id)}
                      isDisabled={isPastDate}
                      aria-label="削除"
                    />
                  </Flex>
                ))}
              </Box>
            ))}
            <Box textAlign="right" mt={2}>
              <Text fontSize="sm" fontWeight="semibold">
                合計: {Math.round(mealTotal)} kcal
              </Text>
            </Box>
          </VStack>
        ) : (
          <Box
            border="2px dashed"
            borderColor={borderColor}
            borderRadius="lg"
            p={8}
            textAlign="center"
          >
            <Icon as={getMealIcon(mealType)} boxSize={10} color="gray.400" mb={2} />
            <Text color="gray.600" mb={3}>
              {isPastDate ? '過去の日付のため、食事を追加できません' : 'まだ食事が計画されていません'}
            </Text>
            <Tooltip label={isPastDate ? "過去の日付には食事を追加できません" : ""} placement="top">
              <Button
                size="sm"
                colorScheme="brand"
                variant="ghost"
                onClick={() => openAddFoodModal(mealType)}
                isDisabled={isPastDate}
              >
                食品を追加
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Heading size="md" mb={2}>食事計画</Heading>
            <Text fontSize="sm" color="gray.600">食事を計画して栄養を追跡</Text>
          </Box>
          <HStack spacing={3}>
            <Button colorScheme="brand" onClick={onOpen} size={{ base: "sm", md: "md" }} flex={{ base: 1, md: "none" }}>
              <Icon as={FiPlus} mr={{ base: 1, md: 2 }} />
              <Text display={{ base: "none", sm: "inline" }}>カスタム食事を作成</Text>
              <Text display={{ base: "inline", sm: "none" }}>追加</Text>
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
            <Tab fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">食事カレンダー</Tab>
            <Tab fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">食品データベース</Tab>
            <Tab fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">食事プラン</Tab>
            <Tab fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">レシピ</Tab>
          </TabList>
        </Tabs>
      </Box>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={{ base: 3, md: 4, lg: 6 }}>
        {/* Main Content */}
        <Box>
          {activeTab === 0 && (
            <>
              {/* Week Navigation */}
              <Card bg={bgColor} mb={6}>
                <CardBody>
                  <Flex justify="space-between" align="center" mb={4}>
                    <IconButton
                      icon={<FiChevronLeft />}
                      variant="ghost"
                      onClick={() => navigateWeek(-1)}
                      aria-label="前の週"
                    />
                    <VStack spacing={2}>
                      <Heading size="md">
                        {currentWeekStart.getFullYear()}年{currentWeekStart.getMonth() + 1}月
                        {currentWeekStart.getDate()}日〜
                        {weekDays[6].getDate()}日の週
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
                    />
                  </Flex>

                  {/* Days Grid */}
                  <Grid templateColumns="repeat(7, 1fr)" gap={2}>
                    {dayNames.map((day, idx) => (
                      <Box key={idx} textAlign="center" fontSize="sm" fontWeight="semibold" color="gray.600" py={2}>
                        {day}
                      </Box>
                    ))}
                    {weekDays.map((date, idx) => {
                      const calories = getDailyCalories(date);
                      const isTodayDate = isToday(date);
                      const isSelected = isSelectedDate(date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const compareDate = new Date(date);
                      compareDate.setHours(0, 0, 0, 0);
                      const isPast = compareDate < today;
                      const isFuture = compareDate > today;
                      
                      // Check if this date has an active plan
                      const dateStr = date.toISOString().split('T')[0];
                      const activePlan = getActivePlanForDate(dateStr);
                      
                      // Determine what to display
                      let displayText;
                      let displayColor;
                      let bgColor = isSelected ? 'brand.100' : hoverBg;
                      let borderColor = 'transparent';
                      
                      if (isTodayDate) {
                        displayText = '今日';
                        displayColor = isSelected ? 'brand.600' : 'brand.500';
                      } else if (isPast) {
                        // Past dates: show calories if any, otherwise show "-"
                        if (calories > 0) {
                          displayText = `${Math.round(calories)} kcal`;
                          displayColor = 'green.600';
                        } else {
                          displayText = '-';
                          displayColor = 'gray.400';
                        }
                      } else if (isFuture) {
                        // Future dates: show "計画済み" if has meals with items, otherwise show "-"
                        const dayMeals = meals.filter(m => m.date === dateStr);
                        const hasMealItems = dayMeals.some(meal => meal.items && meal.items.length > 0);
                        if (hasMealItems) {
                          displayText = '計画済み';
                          displayColor = 'blue.600';
                        } else {
                          displayText = '-';
                          displayColor = 'gray.400';
                        }
                      }
                      
                      // Add plan styling if there's an active plan for this date
                      if (activePlan) {
                        borderColor = 'purple.400';
                        if (!isSelected) {
                          bgColor = 'purple.50';
                        }
                      }

                      return (
                        <Box
                          key={idx}
                          bg={bgColor}
                          border={isSelected ? '2px solid' : activePlan ? '2px solid' : '1px solid'}
                          borderColor={isSelected ? 'brand.500' : borderColor}
                          borderRadius="lg"
                          p={2}
                          textAlign="center"
                          cursor="pointer"
                          position="relative"
                          _hover={{ bg: isSelected ? 'brand.100' : activePlan ? 'purple.100' : 'gray.100' }}
                          onClick={() => setSelectedDate(date)}
                        >
                          {activePlan && (
                            <Box
                              position="absolute"
                              top="1px"
                              right="1px"
                              w="6px"
                              h="6px"
                              bg="purple.500"
                              borderRadius="full"
                            />
                          )}
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={isSelected ? 'brand.600' : 'gray.900'}
                          >
                            {date.getDate()}
                          </Text>
                          <Text 
                            fontSize="xs" 
                            color={displayColor} 
                            fontWeight={isTodayDate ? "semibold" : "normal"} 
                            mt={1}
                          >
                            {displayText}
                          </Text>
                          {activePlan && (
                            <Text 
                              fontSize="2xs" 
                              color="purple.600" 
                              fontWeight="medium"
                              mt={0.5}
                              noOfLines={1}
                            >
                              {activePlan.name.length > 8 ? activePlan.name.substring(0, 6) + '...' : activePlan.name}
                            </Text>
                          )}
                        </Box>
                      );
                    })}
                  </Grid>
                  
                  {/* Calendar Legend */}
                  <Flex 
                    justify="center" 
                    mt={4} 
                    gap={4} 
                    fontSize="xs" 
                    color="gray.600"
                    flexWrap="wrap"
                  >
                    <HStack spacing={1}>
                      <Box w="8px" h="8px" bg="purple.500" borderRadius="full" />
                      <Text>プラン有効</Text>
                    </HStack>
                    <HStack spacing={1}>
                      <Box w="8px" h="8px" bg="brand.500" borderRadius="full" />
                      <Text>選択中</Text>
                    </HStack>
                    <HStack spacing={1}>
                      <Box w="8px" h="8px" bg="green.600" borderRadius="full" />
                      <Text>食事記録あり</Text>
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>

              {/* Today's Meals */}
              <Card bg={bgColor}>
                <CardHeader>
                  <Flex justify="space-between" align="center">
                    <VStack spacing={1} align="start">
                      <Heading size="md">
                        {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日の食事
                      </Heading>
                      {activePlanForDate && (
                        <Text fontSize="xs" color="purple.600" fontWeight="medium">
                          📝 {activePlanForDate.name} プラン適用中
                        </Text>
                      )}
                    </VStack>
                    <Text fontSize="sm" color="gray.600">
                      {todayCalories} / {targetCalories} kcal
                    </Text>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <MealSection mealType="breakfast" meals={mealsByType.breakfast} />
                  <MealSection mealType="lunch" meals={mealsByType.lunch} />
                  <MealSection mealType="dinner" meals={mealsByType.dinner} />
                  <MealSection mealType="snack" meals={mealsByType.snack} />
                </CardBody>
              </Card>
            </>
          )}

          {activeTab === 1 && (
            <Card bg={bgColor}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">食品データベース</Heading>
                  <Button
                    size="sm"
                    colorScheme="brand"
                    onClick={onCreateFoodOpen}
                  >
                    <Icon as={FiPlus} mr={2} />
                    新しい食品を作成
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                <FormControl mb={4}>
                  <Input
                    placeholder="食品を検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftElement={<Icon as={FiSearch} color="gray.400" ml={3} />}
                  />
                </FormControl>
                
                {searchLoading ? (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Spinner size="lg" color="brand.500" />
                      <Text color="gray.600">検索中...</Text>
                    </VStack>
                  </Center>
                ) : foods.length === 0 ? (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Icon as={FiSearch} boxSize={12} color="gray.300" />
                      <Text color="gray.600" fontWeight="medium">
                        {searchTerm ? '検索結果が見つかりません' : '食品がありません'}
                      </Text>
                      <Text fontSize="sm" color="gray.500" textAlign="center">
                        {searchTerm 
                          ? '別のキーワードで検索してみてください' 
                          : '「新しい食品を作成」ボタンから食品を追加してください'}
                      </Text>
                    </VStack>
                  </Center>
                ) : (
                  <>
                    <VStack spacing={2} align="stretch">
                      {(() => {
                        const startIndex = (foodCurrentPage - 1) * foodItemsPerPage;
                        const endIndex = startIndex + foodItemsPerPage;
                        return foods.slice(startIndex, endIndex).map((food) => (
                      <Flex
                        key={food.id}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        justify="space-between"
                        align="center"
                        _hover={{ bg: hoverBg }}
                      >
                        <Box>
                          <Text fontWeight="medium">{food.name}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {food.serving_size}{food.unit || 'g'} • {food.calories} kcal • P: {food.protein}g • C: {food.carbohydrates}g • F: {food.fats}g
                          </Text>
                        </Box>
                        <HStack>
                          <Tooltip label="お気に入り" placement="top">
                            <IconButton
                              aria-label="お気に入り"
                              icon={<FiHeart />}
                              size="sm"
                              variant="ghost"
                              colorScheme={favorites.some(f => f.food.id === food.id) ? 'red' : 'gray'}
                              onClick={() => toggleFavorite(food)}
                            />
                          </Tooltip>
                          {/* <IconButton
                            aria-label="追加"
                            icon={<FiPlus />}
                            size="sm"
                            variant="ghost"
                            colorScheme="brand"
                            onClick={() => handleFoodSelect(food)}
                          /> */}
                          {food.is_custom && (
                            <>
                              <Tooltip label="編集" placement="top">
                                <IconButton
                                  aria-label="編集"
                                  icon={<FiEdit />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => handleEditFood(food)}
                                />
                              </Tooltip>
                              <Tooltip label="削除" placement="top">
                                <IconButton
                                  aria-label="削除"
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDeleteFood(food)}
                                />
                              </Tooltip>
                            </>
                          )}
                        </HStack>
                      </Flex>
                        ));
                      })()}
                    </VStack>
                    
                    {/* ページネーション */}
                    {foods.length > foodItemsPerPage && (
                      <Box mt={4}>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontSize="sm" color="gray.600">
                            {foods.length}件中 {Math.min((foodCurrentPage - 1) * foodItemsPerPage + 1, foods.length)}-{Math.min(foodCurrentPage * foodItemsPerPage, foods.length)}件を表示
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            ページ {foodCurrentPage} / {Math.ceil(foods.length / foodItemsPerPage)}
                          </Text>
                        </Flex>
                        <Flex justify="center" align="center" gap={2}>
                          <IconButton
                            aria-label="前のページ"
                            icon={<FiChevronLeft />}
                            size="sm"
                            variant="outline"
                            isDisabled={foodCurrentPage === 1}
                            onClick={() => setFoodCurrentPage(foodCurrentPage - 1)}
                          />
                          
                          {(() => {
                            const totalPages = Math.ceil(foods.length / foodItemsPerPage);
                            const buttons = [];
                            const showPages = 5; // 表示するページボタンの数
                            
                            let startPage = Math.max(1, foodCurrentPage - Math.floor(showPages / 2));
                            let endPage = Math.min(totalPages, startPage + showPages - 1);
                            
                            if (endPage - startPage + 1 < showPages) {
                              startPage = Math.max(1, endPage - showPages + 1);
                            }
                            
                            for (let i = startPage; i <= endPage; i++) {
                              buttons.push(
                                <Button
                                  key={i}
                                  size="sm"
                                  variant={i === foodCurrentPage ? "solid" : "outline"}
                                  colorScheme={i === foodCurrentPage ? "brand" : "gray"}
                                  onClick={() => setFoodCurrentPage(i)}
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
                            isDisabled={foodCurrentPage === Math.ceil(foods.length / foodItemsPerPage)}
                            onClick={() => setFoodCurrentPage(foodCurrentPage + 1)}
                          />
                        </Flex>
                      </Box>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 2 && (
            <Card bg={bgColor}>
              <CardHeader>
                <VStack spacing={3} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Heading size="md">食事プラン</Heading>
                    <Button 
                      size={{ base: "xs", md: "sm" }} 
                      colorScheme="brand" 
                      onClick={handleCreatePlan}
                      leftIcon={<Icon as={FiPlus} />}
                    >
                      <Text display={{ base: "none", sm: "inline" }}>新しいプランを作成</Text>
                      <Text display={{ base: "inline", sm: "none" }}>作成</Text>
                    </Button>
                  </Flex>
                  
                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="プランを検索..."
                      value={planSearchTerm}
                      onChange={(e) => setPlanSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </VStack>
                {planSearchTerm && filteredMealPlans.length > 0 && (
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                    <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                      検索結果: {filteredMealPlans.length}件
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="gray"
                      onClick={() => setPlanSearchTerm('')}
                    >
                      クリア
                    </Button>
                  </Flex>
                )}
              </CardHeader>
              <CardBody>
                {loading ? (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Spinner size="lg" color="brand.500" />
                      <Text color="gray.600">読み込み中...</Text>
                    </VStack>
                  </Center>
                ) : filteredMealPlans.length === 0 ? (
                  <Box
                    p={8}
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={borderColor}
                    borderRadius="lg"
                    textAlign="center"
                  >
                    {planSearchTerm ? (
                      <>
                        <Icon as={FiSearch} boxSize={12} color="gray.400" mb={3} />
                        <Text color="gray.600" fontWeight="medium" fontSize="lg" mb={2}>
                          検索結果が見つかりません
                        </Text>
                        <Text fontSize="sm" color="gray.500" mb={4}>
                          「{planSearchTerm}」に一致するプランはありません
                        </Text>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          colorScheme="brand"
                          onClick={() => setPlanSearchTerm('')}
                        >
                          検索をクリア
                        </Button>
                      </>
                    ) : (
                      <>
                        <Icon as={FiPlus} boxSize={12} color="gray.400" mb={3} />
                        <Text color="gray.600" fontWeight="medium" fontSize="lg" mb={2}>
                          食事プランがまだありません
                        </Text>
                        <Text fontSize="sm" color="gray.500" mb={4}>
                          新しい食事プランを作成して、目標達成をサポートしましょう
                        </Text>
                        <Button colorScheme="brand" onClick={handleCreatePlan}>
                          <Icon as={FiPlus} mr={2} />
                          最初のプランを作成
                        </Button>
                      </>
                    )}
                  </Box>
                ) : (
                  <>
                    <VStack spacing={4} align="stretch">
                      {/* Display Real Meal Plans with pagination */}
                      {(() => {
                        const startIndex = (planCurrentPage - 1) * planItemsPerPage;
                        const endIndex = startIndex + planItemsPerPage;
                        return filteredMealPlans.slice(startIndex, endIndex).map((plan) => (
                      <Box 
                        key={plan.id} 
                        p={{ base: 3, md: 4 }}
                        borderWidth="1px" 
                        borderColor={borderColor}
                        borderRadius="lg" 
                        _hover={{ bg: hoverBg, shadow: 'md' }}
                        bg={bgColor}
                        transition="all 0.2s"
                      >
                        <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                          <Box flex="1">
                            <Flex justify="space-between" align="center" mb={2} flexWrap="wrap" gap={2}>
                              <Heading size={{ base: "xs", md: "sm" }}>{plan.name}</Heading>
                              {plan.start_date && plan.end_date && (
                                <Badge colorScheme="green" fontSize={{ base: "2xs", md: "xs" }}>
                                  適用中
                                </Badge>
                              )}
                            </Flex>
                            
                            {plan.description && (
                              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600" mb={2}>
                                {plan.description}
                              </Text>
                            )}
                            
                            <Flex wrap="wrap" gap={1} mb={2}>
                              <Badge colorScheme="blue" fontSize={{ base: "2xs", md: "xs" }}>
                                {plan.daily_calories || plan.target_calories || 0} kcal/日
                              </Badge>
                              {(plan.protein_percentage !== null && plan.protein_percentage !== undefined) && (
                                <Badge fontSize={{ base: "2xs", md: "xs" }}>P: {plan.protein_percentage}%</Badge>
                              )}
                              {(plan.carbs_percentage !== null && plan.carbs_percentage !== undefined) && (
                                <Badge fontSize={{ base: "2xs", md: "xs" }}>C: {plan.carbs_percentage}%</Badge>
                              )}
                              {(plan.fats_percentage !== null && plan.fats_percentage !== undefined) && (
                                <Badge fontSize={{ base: "2xs", md: "xs" }}>F: {plan.fats_percentage}%</Badge>
                              )}
                            </Flex>
                            
                            <VStack spacing={2} align="start">
                              {plan.start_date && plan.end_date ? (
                                <Text fontSize="xs" color="green.600" fontWeight="medium">
                                  📅 {plan.start_date} ～ {plan.end_date}
                                </Text>
                              ) : (
                                <Text fontSize="xs" color="gray.500">
                                  日付が設定されていません
                                </Text>
                              )}
                              
                              {plan.duration_days && (
                                <Text fontSize="2xs" color="gray.500">
                                  推奨期間: {plan.duration_days}日間
                                </Text>
                              )}
                            </VStack>
                          </Box>
                          
                          <VStack spacing={2}>
                            <Button
                              size="sm"
                              colorScheme="brand"
                              variant={plan.start_date && plan.end_date ? "outline" : "solid"}
                              onClick={() => handlePlanClick(plan)}
                            >
                              {plan.start_date && plan.end_date ? '期間変更' : '期間設定'}
                            </Button>
                            
                            {plan.start_date && plan.end_date && (
                              <Button
                                size="sm"
                                colorScheme="orange"
                                variant="outline"
                                onClick={() => handleCancelPlan(plan)}
                              >
                                キャンセル
                              </Button>
                            )}
                            
                            <IconButton
                              icon={<FiTrash2 />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlan(plan);
                              }}
                              aria-label="削除"
                            />
                          </VStack>
                        </Flex>
                      </Box>
                        ));
                      })()}
                      
                      {/* ページネーション */}
                      {filteredMealPlans.length > planItemsPerPage && (
                        <Box>
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontSize="sm" color="gray.600">
                              {filteredMealPlans.length}件中 {Math.min((planCurrentPage - 1) * planItemsPerPage + 1, filteredMealPlans.length)}-{Math.min(planCurrentPage * planItemsPerPage, filteredMealPlans.length)}件を表示
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              ページ {planCurrentPage} / {Math.ceil(filteredMealPlans.length / planItemsPerPage)}
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
                              const totalPages = Math.ceil(filteredMealPlans.length / planItemsPerPage);
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
                              isDisabled={planCurrentPage === Math.ceil(filteredMealPlans.length / planItemsPerPage)}
                              onClick={() => setPlanCurrentPage(planCurrentPage + 1)}
                            />
                          </Flex>
                        </Box>
                      )}
                    </VStack>
                  </>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 3 && (
            <Card bg={bgColor}>
              <CardHeader>
                <VStack spacing={3} align="stretch">
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                    <Heading size="md">レシピ</Heading>
                    <Button 
                      size={{ base: "xs", md: "sm" }} 
                      colorScheme="brand" 
                      onClick={handleCreateRecipe}
                      leftIcon={<Icon as={FiPlus} />}
                    >
                      <Text display={{ base: "none", sm: "inline" }}>レシピを追加</Text>
                      <Text display={{ base: "inline", sm: "none" }}>追加</Text>
                    </Button>
                  </Flex>
                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="レシピを検索..."
                      value={recipeSearchTerm}
                      onChange={(e) => setRecipeSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </VStack>
              </CardHeader>
              <CardBody>
                {filteredRecipes.length === 0 ? (
                  <Center py={12}>
                    <VStack spacing={4}>
                      <Icon as={FiPlus} boxSize={16} color="gray.300" />
                      <Heading size="md" color="gray.600">
                        {recipeSearchTerm ? 'レシピが見つかりません' : 'レシピがまだありません'}
                      </Heading>
                      <Text color="gray.500" textAlign="center">
                        {recipeSearchTerm 
                          ? '別のキーワードで検索してみてください' 
                          : '「レシピを追加」ボタンから最初のレシピを作成しましょう'}
                      </Text>
                      {!recipeSearchTerm && (
                        <Button colorScheme="brand" onClick={handleCreateRecipe} size="lg" mt={2}>
                          <Icon as={FiPlus} mr={2} />
                          最初のレシピを作成
                        </Button>
                      )}
                    </VStack>
                  </Center>
                ) : (
                  <>
                    <SimpleGrid columns={{ base: 1, sm: 1, md: 2, lg: 2, xl: 3 }} spacing={{ base: 3, md: 4 }}>
                      {/* All Recipes with pagination */}
                      {(() => {
                        const startIndex = (recipeCurrentPage - 1) * recipeItemsPerPage;
                        const endIndex = startIndex + recipeItemsPerPage;
                        return filteredRecipes.slice(startIndex, endIndex).map((recipe) => (
                    <Card 
                      key={recipe.id} 
                      overflow="hidden" 
                      variant="outline"
                      _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                      position="relative"
                      bg={bgColor}
                    >
                      {/* Recipe Image or Icon */}
                      <Box 
                        h={{ base: "180px", sm: "200px", md: "200px" }}
                        bg="gray.200" 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        onClick={() => openRecipeDetail(recipe)}
                        cursor="pointer"
                        position="relative"
                      >
                        {recipe.image ? (
                          <Image
                            src={recipe.image}
                            alt={recipe.name}
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        ) : (
                          <Icon as={recipe.icon || FiCoffee} boxSize={{ base: 10, md: 12 }} color="gray.400" />
                        )}
                      </Box>
                      
                      <CardBody p={{ base: 3, md: 4 }}>
                        <VStack align="stretch" spacing={{ base: 2, md: 2 }}>
                          {/* Title */}
                          <Heading 
                            size={{ base: "sm", md: "md" }}
                            onClick={() => openRecipeDetail(recipe)} 
                            cursor="pointer"
                            noOfLines={2}
                            _hover={{ color: 'brand.500' }}
                            fontWeight="bold"
                            mb={1}
                          >
                            {recipe.name}
                          </Heading>
                          
                          {/* Description */}
                          <Text 
                            fontSize={{ base: "xs", md: "sm" }}
                            color="gray.600" 
                            noOfLines={2}
                            minH={{ base: "32px", md: "40px" }}
                            mb={1}
                          >
                            {recipe.description}
                          </Text>
                          
                          {/* Nutrition Info - Large Style */}
                          <Box 
                            bg="gray.50" 
                            p={{ base: 2, md: 3 }}
                            borderRadius="md"
                            mb={1}
                          >
                            <Text 
                              fontSize={{ base: "2xs", md: "xs" }}
                              color="gray.600" 
                              mb={1} 
                              fontWeight="semibold"
                            >
                              栄養成分
                            </Text>
                            <Grid templateColumns="repeat(2, 1fr)" gap={{ base: 1, md: 2 }}>
                              <Box>
                                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="green.600">
                                  {recipe.calories}
                                </Text>
                                <Text fontSize={{ base: "2xs", md: "xs" }} color="gray.600">
                                  KCAL
                                </Text>
                              </Box>
                              <VStack align="flex-start" spacing={{ base: 0.5, md: 1 }}>
                                <HStack spacing={1}>
                                  <Text fontSize={{ base: "2xs", md: "xs" }} fontWeight="semibold">
                                    P:
                                  </Text>
                                  <Text fontSize={{ base: "2xs", md: "xs" }}>
                                    {recipe.protein}G
                                  </Text>
                                </HStack>
                                <HStack spacing={1}>
                                  <Text fontSize={{ base: "2xs", md: "xs" }} fontWeight="semibold">
                                    C:
                                  </Text>
                                  <Text fontSize={{ base: "2xs", md: "xs" }}>
                                    {recipe.carbs}G
                                  </Text>
                                </HStack>
                                <HStack spacing={1}>
                                  <Text fontSize={{ base: "2xs", md: "xs" }} fontWeight="semibold">
                                    F:
                                  </Text>
                                  <Text fontSize={{ base: "2xs", md: "xs" }}>
                                    {recipe.fats}G
                                  </Text>
                                </HStack>
                              </VStack>
                            </Grid>
                          </Box>
                          
                          {/* Time and Servings */}
                          <HStack 
                            spacing={{ base: 2, md: 3 }}
                            fontSize={{ base: "xs", md: "sm" }}
                            color="gray.600"
                            py={1}
                          >
                            <HStack spacing={1}>
                              <Icon as={FiClock} boxSize={{ base: 3, md: 4 }} />
                              <Text fontWeight="medium">{recipe.time}分</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <Text fontSize={{ base: "sm", md: "md" }}>👤</Text>
                              <Text fontWeight="medium">{recipe.servings}人前</Text>
                            </HStack>
                          </HStack>

                          {/* Action Buttons */}
                          <HStack 
                            spacing={{ base: 1, md: 2 }}
                            pt={2}
                            borderTop="1px"
                            borderColor={borderColor}
                          >
                            <IconButton
                              icon={<FiHeart />}
                              size={{ base: "sm", md: "md" }}
                              variant="ghost"
                              colorScheme={recipeFavorites.includes(recipe.id) ? 'red' : 'gray'}
                              color={recipeFavorites.includes(recipe.id) ? 'red.500' : 'gray.400'}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRecipeFavorite(recipe.id);
                              }}
                              aria-label="お気に入り"
                              flex="1"
                            />
                            <IconButton
                              icon={<FiEdit />}
                              size={{ base: "sm", md: "md" }}
                              variant="ghost"
                              colorScheme="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditRecipe(recipe);
                              }}
                              aria-label="レシピを編集"
                              flex="1"
                            />
                            <IconButton
                              icon={<FiTrash2 />}
                              size={{ base: "sm", md: "md" }}
                              variant="ghost"
                              colorScheme="red"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await nutritionService.recipes.delete(recipe.id);
                                  setCustomRecipes(customRecipes.filter(r => r.id !== recipe.id));
                                  toast({
                                    title: 'レシピを削除しました',
                                    status: 'success',
                                    duration: 2000,
                                  });
                                } catch (error) {
                                  console.error('Delete recipe error:', error);
                                  toast({
                                    title: '削除エラー',
                                    description: 'レシピの削除に失敗しました',
                                    status: 'error',
                                    duration: 3000,
                                  });
                                }
                              }}
                              aria-label="レシピを削除"
                              flex="1"
                            />
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                        ));
                      })()}
                    </SimpleGrid>
                    
                    {/* ページネーション */}
                    {filteredRecipes.length > recipeItemsPerPage && (
                      <Box mt={6}>
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontSize="sm" color="gray.600">
                            {filteredRecipes.length}件中 {Math.min((recipeCurrentPage - 1) * recipeItemsPerPage + 1, filteredRecipes.length)}-{Math.min(recipeCurrentPage * recipeItemsPerPage, filteredRecipes.length)}件を表示
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            ページ {recipeCurrentPage} / {Math.ceil(filteredRecipes.length / recipeItemsPerPage)}
                          </Text>
                        </Flex>
                        <Flex justify="center" align="center" gap={2}>
                          <IconButton
                            aria-label="前のページ"
                            icon={<FiChevronLeft />}
                            size="sm"
                            variant="outline"
                            isDisabled={recipeCurrentPage === 1}
                            onClick={() => setRecipeCurrentPage(recipeCurrentPage - 1)}
                          />
                          
                          {(() => {
                            const totalPages = Math.ceil(filteredRecipes.length / recipeItemsPerPage);
                            const buttons = [];
                            const showPages = 5;
                            
                            let startPage = Math.max(1, recipeCurrentPage - Math.floor(showPages / 2));
                            let endPage = Math.min(totalPages, startPage + showPages - 1);
                            
                            if (endPage - startPage + 1 < showPages) {
                              startPage = Math.max(1, endPage - showPages + 1);
                            }
                            
                            for (let i = startPage; i <= endPage; i++) {
                              buttons.push(
                                <Button
                                  key={i}
                                  size="sm"
                                  variant={i === recipeCurrentPage ? "solid" : "outline"}
                                  colorScheme={i === recipeCurrentPage ? "brand" : "gray"}
                                  onClick={() => setRecipeCurrentPage(i)}
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
                            isDisabled={recipeCurrentPage === Math.ceil(filteredRecipes.length / recipeItemsPerPage)}
                            onClick={() => setRecipeCurrentPage(recipeCurrentPage + 1)}
                          />
                        </Flex>
                      </Box>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          )}
        </Box>

        {/* Sidebar */}
        <VStack spacing={6} align="stretch">
          {/* Daily Summary */}
          <Card bg={bgColor}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md">1日の概要</Heading>
                <Text fontSize="xs" color="gray.500">
                  {selectedDate.toLocaleDateString('ja-JP')}
                </Text>
              </Flex>
              {activePlanForDate && (
                <Box mt={2} p={3} bg="brand.50" borderRadius="lg" border="1px solid" borderColor="brand.200">
                  <HStack spacing={2} mb={2}>
                    <Icon as={FiStar} color="brand.500" boxSize={4} />
                    <Text fontSize="sm" fontWeight="bold" color="brand.700">
                      {activePlanForDate.name}
                    </Text>
                  </HStack>
                  <VStack spacing={1} align="start">
                    {activePlanForDate.start_date && activePlanForDate.end_date && (
                      <Text fontSize="2xs" color="brand.600">
                        📅 {activePlanForDate.start_date} ～ {activePlanForDate.end_date}
                      </Text>
                    )}
                    <Text fontSize="2xs" color="green.600" fontWeight="medium">
                      ✓ {selectedDate.toLocaleDateString('ja-JP')}の目標値を使用中
                    </Text>
                  </VStack>
                </Box>
              )}
              {!activePlanForDate && (
                <Box mt={2} p={3} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
                  <HStack spacing={2} mb={2}>
                    <Icon as={FiClock} color="gray.500" boxSize={4} />
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      アクティブなプランなし
                    </Text>
                  </HStack>
                  <VStack spacing={1} align="start">
                    <Text fontSize="2xs" color="gray.500">
                      デフォルト目標値を使用中
                    </Text>
                    <Text fontSize="2xs" color="blue.600">
                      📅 {selectedDate.toLocaleDateString('ja-JP')}選択中
                    </Text>
                  </VStack>
                </Box>
              )}
            </CardHeader>
            <CardBody>
              {/* Calories */}
              <Box mb={6}>
                <Flex justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">カロリー</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {todayCalories} / {targetCalories}
                  </Text>
                </Flex>
                <Progress
                  value={caloriesPercent}
                  colorScheme="green"
                  size="sm"
                  borderRadius="full"
                  mb={1}
                />
                <Text fontSize="xs" color="gray.600">
                  残り {Math.max(0, targetCalories - todayCalories).toFixed(1)} kcal
                </Text>
              </Box>

              {/* Protein */}
              <Box mb={4}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.700">タンパク質</Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {todayProtein.toFixed(0)}g / {targetProtein}g
                  </Text>
                </Flex>
                <Progress
                  value={proteinPercent}
                  colorScheme="blue"
                  size="sm"
                  borderRadius="full"
                />
              </Box>

              {/* Carbs */}
              <Box mb={4}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.700">炭水化物</Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {todayCarbs.toFixed(0)}g / {targetCarbs}g
                  </Text>
                </Flex>
                <Progress
                  value={carbsPercent}
                  colorScheme="green"
                  size="sm"
                  borderRadius="full"
                />
              </Box>

              {/* Fats */}
              <Box>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.700">脂質</Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {todayFats.toFixed(0)}g / {targetFats}g
                  </Text>
                </Flex>
                <Progress
                  value={fatsPercent}
                  colorScheme="yellow"
                  size="sm"
                  borderRadius="full"
                />
              </Box>
            </CardBody>
          </Card>

          {/* Quick Add Favorites */}
          <Card bg={bgColor}>
            <CardHeader>
              <Heading size="md">お気に入りをクイック追加</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {/* Favorite Recipes */}
                {customRecipes.filter(recipe => recipeFavorites.includes(recipe.id)).length > 0 && (
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} textTransform="uppercase">
                      レシピ
                    </Text>
                    <VStack spacing={2} align="stretch">
                      {customRecipes
                        .filter(recipe => recipeFavorites.includes(recipe.id))
                        .slice(0, 3)
                        .map((recipe) => (
                          <Button
                            key={`recipe-${recipe.id}`}
                            variant="ghost"
                            justifyContent="space-between"
                            onClick={() => openRecipeDetail(recipe)}
                            p={3}
                            h="auto"
                            _hover={{ bg: hoverBg }}
                          >
                            <HStack spacing={3}>
                              {recipe.image && (
                                <Image
                                  src={recipe.image}
                                  alt={recipe.name}
                                  boxSize="40px"
                                  objectFit="cover"
                                  borderRadius="md"
                                />
                              )}
                              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                {recipe.name}
                              </Text>
                            </HStack>
                            <HStack spacing={3}>
                              <Text fontSize="xs" color="gray.600">
                                {recipe.calories} kcal
                              </Text>
                              <Icon as={FiStar} color="yellow.500" boxSize={4} flexShrink={0} />
                            </HStack>
                          </Button>
                        ))}
                    </VStack>
                  </Box>
                )}

                {/* Favorite Foods */}
                {favorites.length > 0 && (
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} textTransform="uppercase">
                      食品
                    </Text>
                    <VStack spacing={2} align="stretch">
                      {favorites.slice(0, 5).map((favorite) => (
                        <Button
                          key={favorite.id}
                          variant="ghost"
                          justifyContent="space-between"
                          onClick={() => quickAddFavorite(favorite)}
                          p={3}
                          h="auto"
                          _hover={{ bg: hoverBg }}
                        >
                          <HStack spacing={2}>
                            <Text fontSize="sm" fontWeight="medium">
                              {favorite.food.name}
                            </Text>
                          </HStack>
                          <HStack spacing={3}>
                            <Text fontSize="xs" color="gray.600">
                              {favorite.food.calories} kcal
                            </Text>
                            <Icon as={FiStar} color="yellow.500" boxSize={4} flexShrink={0} />
                          </HStack>
                        </Button>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Empty State */}
                {favorites.length === 0 && customRecipes.filter(recipe => recipeFavorites.includes(recipe.id)).length === 0 && (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    お気に入りはまだありません
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Grid>

      {/* Log Meal Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "4xl" }}>
        <ModalOverlay />
        <ModalContent maxH={{ base: "100vh", md: "90vh" }} m={{ base: 0, md: 4 }}>
          <form onSubmit={handleSubmit} noValidate>
            <ModalHeader fontSize={{ base: "md", md: "lg" }}>食事を記録</ModalHeader>
            <ModalCloseButton />
            <ModalBody maxH={{ base: "calc(100vh - 140px)", md: "calc(90vh - 140px)" }} overflowY="auto" px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={{ base: 4, md: 6 }}>
                {/* Meal Details */}
                <Box>
                  <Heading size="sm" mb={4}>食事の詳細</Heading>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>食事タイプ</FormLabel>
                      <Select name="meal_type" value={formData.meal_type} onChange={handleChange}>
                        {MEAL_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>日付</FormLabel>
                      <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={getTodayDate()}
                        // max={getMaxDate()}
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
                          // max={getMaxDate()}
                        />
                      </FormControl>
                    )}
                  </VStack>

                  {/* Selected Foods */}
                  <Heading size="sm" mt={6} mb={4}>選択した食品</Heading>
                  {selectedFoods.length > 0 ? (
                    <VStack spacing={2} align="stretch">
                      {selectedFoods.map((food, index) => (
                        <HStack key={index} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">{food.name}</Text>
                            <Text fontSize="xs" color="gray.600">
                              {food.serving_size}{food.unit || 'g'}あたり {food.calories} kcal
                            </Text>
                          </Box>
                          <HStack>
                            <Input
                              type="number"
                              size="sm"
                              width="80px"
                              value={food.quantity}
                              onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value))}
                              placeholder={food.serving_size}
                            />
                            <Text fontSize="xs" color="gray.600">{food.unit || 'g'}</Text>
                            <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleFoodRemove(index)}>
                              ×
                            </Button>
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.500">食品が選択されていません</Text>
                  )}
                </Box>

                {/* Food Search */}
                <Box>
                  <Heading size="sm" mb={4}>食品を追加</Heading>
                  <FormControl mb={4}>
                    <FormLabel>食品を検索</FormLabel>
                    <Input
                      placeholder="食品を検索..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                    />
                  </FormControl>

                  {modalSearchLoading ? (
                    <Center py={4}>
                      <Spinner size="md" color="brand.500" />
                    </Center>
                  ) : (
                    <Box maxH="300px" overflowY="auto">
                      {foods.length === 0 ? (
                        <Center py={4}>
                          <Text fontSize="sm" color="gray.500">
                            {modalSearchTerm ? '検索結果が見つかりません' : '食品を検索してください'}
                          </Text>
                        </Center>
                      ) : (
                        <VStack spacing={2} align="stretch">
                          {foods
                            .filter(food => !selectedFoods.some(selected => selected.id === food.id))
                            .slice(0, 10).map((food) => (
                            <HStack
                              key={food.id}
                              p={3}
                              borderWidth="1px"
                              borderRadius="md"
                              cursor="pointer"
                              _hover={{ bg: 'gray.50' }}
                              onClick={() => handleFoodSelect(food)}
                            >
                              <Box flex="1">
                                <Text fontSize="sm" fontWeight="medium">{food.name}</Text>
                                <Text fontSize="xs" color="gray.600">
                                  {food.calories} kcal • P: {food.protein}g • C: {food.carbohydrates}g • F: {food.fats}g
                                </Text>
                              </Box>
                              <Icon as={FiPlus} color="brand.500" />
                            </HStack>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                食事を記録
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

        {/* Delete Food Confirmation Modal */}
        <Modal isOpen={isDeleteOpen} onClose={() => { setFoodToDelete(null); onDeleteClose(); }} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>食品を削除</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>
                {foodToDelete ? `${foodToDelete.name} を本当に削除しますか？` : 'この食品を削除してもよいですか？'}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => { setFoodToDelete(null); onDeleteClose(); }}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={performDeleteFood} isLoading={submitting}>
                削除
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

      {/* Delete Meal Plan Confirmation Modal */}
      <Modal isOpen={isDeletePlanOpen} onClose={() => { setPlanToDelete(null); onDeletePlanClose(); }} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>食事プランを削除</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Text>
                {planToDelete ? `「${planToDelete.name}」を本当に削除しますか？` : 'この食事プランを削除してもよいですか？'}
              </Text>
              {planToDelete && (
                <Box p={3} bg="red.50" borderRadius="md">
                  <Text fontSize="sm" color="red.800">
                    ⚠️ この操作は元に戻せません
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { setPlanToDelete(null); onDeletePlanClose(); }}>
              キャンセル
            </Button>
            <Button colorScheme="red" onClick={performDeletePlan} isLoading={submitting}>
              削除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Plan Date Range Selection Modal */}
      <Modal isOpen={isPlanDateRangeOpen} onClose={handlePlanDateRangeCancel} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>プランの期間を設定</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {planToActivate && (
                <Box p={4} bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor}>
                  <Text fontWeight="semibold" mb={2}>{planToActivate.name}</Text>
                  <HStack spacing={4} fontSize="sm" color="gray.600">
                    <Text>目標: {planToActivate.daily_calories || planToActivate.target_calories || 0} kcal/日</Text>
                    {planToActivate.duration_days && (
                      <Text>推奨期間: {planToActivate.duration_days}日間</Text>
                    )}
                  </HStack>
                </Box>
              )}
              
              <Text fontSize="sm" color="gray.600">
                このプランを使用する期間を設定してください。
              </Text>
              
              <FormControl isRequired>
                <FormLabel fontSize="sm">開始日</FormLabel>
                <Input
                  type="date"
                  value={planStartDate}
                  onChange={(e) => setPlanStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel fontSize="sm">終了日</FormLabel>
                <Input
                  type="date"
                  value={planEndDate}
                  onChange={(e) => setPlanEndDate(e.target.value)}
                  min={planStartDate || new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              
              {planStartDate && planEndDate && (
                <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                  <Text fontSize="sm" color="blue.700">
                    📅 期間: {Math.ceil((new Date(planEndDate) - new Date(planStartDate)) / (1000 * 60 * 60 * 24)) + 1}日間
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handlePlanDateRangeCancel}>
              キャンセル
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handlePlanActivation}
              isDisabled={!planStartDate || !planEndDate}
              isLoading={submitting}
            >
              期間を設定
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Cancel Plan Modal */}
      <Modal isOpen={isCancelPlanOpen} onClose={() => { setPlanToCancel(null); onCancelPlanClose(); }} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>プランをキャンセル</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Text>
                {planToCancel ? `「${planToCancel.name}」の期間設定を解除しますか？` : 'このプランの期間設定を解除してもよいですか？'}
              </Text>
              {planToCancel && planToCancel.start_date && planToCancel.end_date && (
                <Box p={3} bg="orange.50" borderRadius="md">
                  <Text fontSize="sm" color="orange.800">
                    📅 現在の期間: {planToCancel.start_date} ～ {planToCancel.end_date}
                  </Text>
                  <Text fontSize="sm" color="orange.600" mt={2}>
                    ⚠️ キャンセルすると、プランの期間設定が解除され、未使用状態になります
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { setPlanToCancel(null); onCancelPlanClose(); }}>
              戻る
            </Button>
            <Button colorScheme="orange" onClick={performCancelPlan} isLoading={submitting}>
              期間設定を解除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Food Modal */}
      <Modal isOpen={isCreateFoodOpen} onClose={onCreateFoodClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleCreateFood}>
            <ModalHeader>新しい食品を作成</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>食品名</FormLabel>
                  <Input
                    name="name"
                    value={newFoodData.name}
                    onChange={handleNewFoodChange}
                    placeholder="例: 鶏胸肉"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>カテゴリー</FormLabel>
                  <Select
                    name="category"
                    value={newFoodData.category}
                    onChange={handleNewFoodChange}
                  >
                    <option value="protein">タンパク質</option>
                    <option value="carbs">炭水化物</option>
                    <option value="fats">脂質</option>
                    <option value="vegetables">野菜</option>
                    <option value="fruits">果物</option>
                    <option value="dairy">乳製品</option>
                    <option value="grains">穀物</option>
                    <option value="snacks">スナック</option>
                    <option value="beverages">飲料</option>
                    <option value="other">その他</option>
                  </Select>
                </FormControl>

                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>カロリー (kcal)</FormLabel>
                    <Input
                      type="number"
                      name="calories"
                      value={newFoodData.calories}
                      onChange={handleNewFoodChange}
                      placeholder="100"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>タンパク質 (g)</FormLabel>
                    <Input
                      type="number"
                      name="protein"
                      value={newFoodData.protein}
                      onChange={handleNewFoodChange}
                      placeholder="20"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>炭水化物 (g)</FormLabel>
                    <Input
                      type="number"
                      name="carbohydrates"
                      value={newFoodData.carbohydrates}
                      onChange={handleNewFoodChange}
                      placeholder="30"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>脂質 (g)</FormLabel>
                    <Input
                      type="number"
                      name="fats"
                      value={newFoodData.fats}
                      onChange={handleNewFoodChange}
                      placeholder="10"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                </Grid>

                <Grid templateColumns="2fr 1fr" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>サービングサイズ</FormLabel>
                    <Input
                      type="number"
                      name="serving_size"
                      value={newFoodData.serving_size}
                      onChange={handleNewFoodChange}
                      placeholder="100"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>単位</FormLabel>
                    <Select
                      name="unit"
                      value={newFoodData.unit}
                      onChange={handleNewFoodChange}
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="個">個</option>
                      <option value="枚">枚</option>
                      <option value="本">本</option>
                    </Select>
                  </FormControl>
                </Grid>

                <Box w="full" p={4} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" color="blue.800" fontWeight="semibold" mb={2}>
                    💡 ヒント
                  </Text>
                  <Text fontSize="xs" color="blue.700">
                    栄養情報は100gあたりの値を入力してください。サービングサイズは1回分の量です。
                  </Text>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCreateFoodClose}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                作成
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Food Modal */}
      <Modal isOpen={isEditFoodOpen} onClose={onEditFoodClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleUpdateFood}>
            <ModalHeader>食品を編集</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>食品名</FormLabel>
                  <Input
                    name="name"
                    value={newFoodData.name}
                    onChange={handleNewFoodChange}
                    placeholder="例: 鶏胸肉"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>カテゴリー</FormLabel>
                  <Select
                    name="category"
                    value={newFoodData.category}
                    onChange={handleNewFoodChange}
                  >
                    <option value="protein">タンパク質</option>
                    <option value="carbs">炭水化物</option>
                    <option value="fats">脂質</option>
                    <option value="vegetables">野菜</option>
                    <option value="fruits">果物</option>
                    <option value="dairy">乳製品</option>
                    <option value="grains">穀物</option>
                    <option value="snacks">スナック</option>
                    <option value="beverages">飲料</option>
                    <option value="other">その他</option>
                  </Select>
                </FormControl>

                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>カロリー (kcal)</FormLabel>
                    <Input
                      type="number"
                      name="calories"
                      value={newFoodData.calories}
                      onChange={handleNewFoodChange}
                      placeholder="100"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>タンパク質 (g)</FormLabel>
                    <Input
                      type="number"
                      name="protein"
                      value={newFoodData.protein}
                      onChange={handleNewFoodChange}
                      placeholder="20"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>炭水化物 (g)</FormLabel>
                    <Input
                      type="number"
                      name="carbohydrates"
                      value={newFoodData.carbohydrates}
                      onChange={handleNewFoodChange}
                      placeholder="30"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>脂質 (g)</FormLabel>
                    <Input
                      type="number"
                      name="fats"
                      value={newFoodData.fats}
                      onChange={handleNewFoodChange}
                      placeholder="10"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                </Grid>

                <Grid templateColumns="2fr 1fr" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>サービングサイズ</FormLabel>
                    <Input
                      type="number"
                      name="serving_size"
                      value={newFoodData.serving_size}
                      onChange={handleNewFoodChange}
                      placeholder="100"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>単位</FormLabel>
                    <Select
                      name="unit"
                      value={newFoodData.unit}
                      onChange={handleNewFoodChange}
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="個">個</option>
                      <option value="枚">枚</option>
                      <option value="本">本</option>
                    </Select>
                  </FormControl>
                </Grid>

                <Box w="full" p={4} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" color="blue.800" fontWeight="semibold" mb={2}>
                    💡 ヒント
                  </Text>
                  <Text fontSize="xs" color="blue.700">
                    栄養情報は100gあたりの値を入力してください。サービングサイズは1回分の量です。
                  </Text>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditFoodClose}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                更新
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Recipe Detail Modal */}
      <Modal isOpen={isRecipeDetailOpen} onClose={onRecipeDetailClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedRecipe?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRecipe && (
              <VStack spacing={4} align="stretch">
                <Box 
                  h="200px" 
                  bg="gray.200" 
                  borderRadius="lg" 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  overflow="hidden"
                >
                  {selectedRecipe.image ? (
                    <Image
                      src={selectedRecipe.image}
                      alt={selectedRecipe.name}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  ) : (
                    <Icon as={selectedRecipe.icon} boxSize={20} color="gray.400" />
                  )}
                </Box>
                
                <Text color="gray.700">{selectedRecipe.description}</Text>
                
                <Divider />
                
                <Box>
                  <Heading size="sm" mb={3}>栄養情報</Heading>
                  <SimpleGrid columns={2} spacing={3}>
                    <Box p={3} bg={hoverBg} borderRadius="md">
                      <Text fontSize="xs" color="gray.600">カロリー</Text>
                      <Text fontWeight="bold">{selectedRecipe.calories} kcal</Text>
                    </Box>
                    <Box p={3} bg={hoverBg} borderRadius="md">
                      <Text fontSize="xs" color="gray.600">タンパク質</Text>
                      <Text fontWeight="bold">{selectedRecipe.protein}g</Text>
                    </Box>
                    <Box p={3} bg={hoverBg} borderRadius="md">
                      <Text fontSize="xs" color="gray.600">炭水化物</Text>
                      <Text fontWeight="bold">{selectedRecipe.carbs}g</Text>
                    </Box>
                    <Box p={3} bg={hoverBg} borderRadius="md">
                      <Text fontSize="xs" color="gray.600">脂質</Text>
                      <Text fontWeight="bold">{selectedRecipe.fats}g</Text>
                    </Box>
                  </SimpleGrid>
                </Box>
                
                <Divider />
                
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={FiClock} />
                    <Text fontSize="sm">調理時間: {selectedRecipe.time}</Text>
                  </HStack>
                  <HStack>
                    <Text fontSize="sm">👤 {selectedRecipe.servings}</Text>
                  </HStack>
                </HStack>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRecipeDetailClose}>
              閉じる
            </Button>
            <Button colorScheme="brand" onClick={() => {
              toast({
                title: 'レシピを食事に追加',
                description: 'この機能は近日公開予定です',
                status: 'info',
                duration: 3000,
              });
            }}>
              食事に追加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Plan Modal */}
      <Modal isOpen={isCreatePlanOpen} onClose={onCreatePlanClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmitPlan}>
            <ModalHeader>新しい食事プランを作成</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>プラン名</FormLabel>
                  <Input 
                    name="name"
                    value={newPlanData.name}
                    onChange={handleNewPlanChange}
                    placeholder="例: 私の減量プラン" 
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>説明 (オプション)</FormLabel>
                  <Input 
                    name="description"
                    value={newPlanData.description}
                    onChange={handleNewPlanChange}
                    placeholder="例: 高タンパク質・低炭水化物" 
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>目標カロリー (kcal/日)</FormLabel>
                  <Input 
                    type="number" 
                    name="target_calories"
                    value={newPlanData.target_calories}
                    onChange={handleNewPlanChange}
                    placeholder="2000"
                    step="1"
                    min="0"
                    onKeyPress={(e) => {
                      if (!/[0-9.]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>
                
                <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                  <FormControl>
                    <FormLabel>タンパク質 (g)</FormLabel>
                    <Input 
                      type="number" 
                      name="target_protein"
                      value={newPlanData.target_protein}
                      onChange={handleNewPlanChange}
                      placeholder="150"
                      step="0.1"
                      min="0"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>炭水化物 (g)</FormLabel>
                    <Input 
                      type="number" 
                      name="target_carbs"
                      value={newPlanData.target_carbs}
                      onChange={handleNewPlanChange}
                      placeholder="200"
                      step="0.1"
                      min="0"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>脂質 (g)</FormLabel>
                    <Input 
                      type="number" 
                      name="target_fats"
                      value={newPlanData.target_fats}
                      onChange={handleNewPlanChange}
                      placeholder="60"
                      step="0.1"
                      min="0"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                </Grid>
                
                <FormControl>
                  <FormLabel>期間 (オプション)</FormLabel>
                  <Select 
                    name="duration_days"
                    value={newPlanData.duration_days}
                    onChange={handleNewPlanChange}
                  >
                    <option value="7">7日間</option>
                    <option value="14">14日間</option>
                    <option value="30">30日間</option>
                    <option value="60">60日間</option>
                    <option value="90">90日間</option>
                  </Select>
                </FormControl>
                
                <Box w="full" p={4} bg="purple.50" borderRadius="md">
                  <Text fontSize="sm" color="purple.800" fontWeight="semibold" mb={2}>
                    💡 ヒント
                  </Text>
                  <Text fontSize="xs" color="purple.700">
                    プランを作成すると、毎日の目標値が自動的に設定されます。タンパク質、炭水化物、脂質の目標値は任意です。
                  </Text>
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

      {/* Create Recipe Modal */}
      <Modal isOpen={isCreateRecipeOpen} onClose={onCreateRecipeClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmitRecipe}>
            <ModalHeader>新しいレシピを追加</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                {/* Image Upload Section */}
                <FormControl>
                  <FormLabel>レシピ画像</FormLabel>
                  {recipeImagePreview ? (
                    <Box position="relative">
                      <Image
                        src={recipeImagePreview}
                        alt="Recipe preview"
                        borderRadius="lg"
                        maxH="250px"
                        w="full"
                        objectFit="cover"
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme="red"
                        size="sm"
                        onClick={removeRecipeImage}
                        aria-label="画像を削除"
                      />
                    </Box>
                  ) : (
                    <Box
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor={borderColor}
                      borderRadius="lg"
                      p={8}
                      textAlign="center"
                      cursor="pointer"
                      _hover={{ bg: hoverBg }}
                      onClick={() => document.getElementById('recipe-image-input').click()}
                    >
                      <Icon as={FiPlus} boxSize={10} color="gray.400" mb={2} />
                      <Text color="gray.600" fontSize="sm" mb={1}>
                        画像をアップロード
                      </Text>
                      <Text color="gray.500" fontSize="xs">
                        クリックして画像を選択
                      </Text>
                    </Box>
                  )}
                  <Input
                    id="recipe-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleRecipeImageChange}
                    display="none"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>レシピ名</FormLabel>
                  <Input
                    name="name"
                    value={newRecipeData.name}
                    onChange={handleNewRecipeChange}
                    placeholder="例: ヘルシーチキンサラダ"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>説明</FormLabel>
                  <Input
                    name="description"
                    value={newRecipeData.description}
                    onChange={handleNewRecipeChange}
                    placeholder="レシピの簡単な説明"
                  />
                </FormControl>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>カロリー (kcal)</FormLabel>
                    <Input
                      type="number"
                      name="calories"
                      value={newRecipeData.calories}
                      onChange={handleNewRecipeChange}
                      placeholder="400"
                      min="0"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>調理時間</FormLabel>
                    <Input
                      name="time"
                      value={newRecipeData.time}
                      onChange={handleNewRecipeChange}
                      placeholder="例: 30分"
                      pattern="[0-9]+分?"
                      onKeyPress={(e) => {
                        if (!/[0-9分]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                </Grid>
                
                <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>タンパク質 (g)</FormLabel>
                    <Input
                      type="number"
                      name="protein"
                      value={newRecipeData.protein}
                      onChange={handleNewRecipeChange}
                      placeholder="40"
                      min="0"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>炭水化物 (g)</FormLabel>
                    <Input
                      type="number"
                      name="carbs"
                      value={newRecipeData.carbs}
                      onChange={handleNewRecipeChange}
                      placeholder="30"
                      min="0"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>脂質 (g)</FormLabel>
                    <Input
                      type="number"
                      name="fats"
                      value={newRecipeData.fats}
                      onChange={handleNewRecipeChange}
                      placeholder="15"
                      min="0"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                </Grid>
                
                <FormControl isRequired>
                  <FormLabel>人数</FormLabel>
                  <Input
                    type="number"
                    name="servings"
                    value={newRecipeData.servings}
                    onChange={handleNewRecipeChange}
                    placeholder="2"
                    min="1"
                    step="1"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>
                
                <Box w="full" p={4} bg="green.50" borderRadius="md">
                  <Text fontSize="sm" color="green.800" fontWeight="semibold" mb={2}>
                    💡 ヒント
                  </Text>
                  <Text fontSize="xs" color="green.700">
                    レシピを追加すると、食事計画に簡単に組み込むことができます。画像を追加すると、より魅力的なレシピカードになります。
                  </Text>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCreateRecipeClose}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                追加
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Recipe Modal */}
      <Modal isOpen={isEditRecipeOpen} onClose={onEditRecipeClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleUpdateRecipe}>
            <ModalHeader>レシピを編集</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                {/* Image Upload Section */}
                <FormControl>
                  <FormLabel>レシピ画像</FormLabel>
                  {recipeImagePreview ? (
                    <Box position="relative">
                      <Image
                        src={recipeImagePreview}
                        alt="Recipe preview"
                        borderRadius="lg"
                        maxH="250px"
                        w="full"
                        objectFit="cover"
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme="red"
                        size="sm"
                        onClick={removeRecipeImage}
                        aria-label="画像を削除"
                      />
                    </Box>
                  ) : (
                    <Box
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor={borderColor}
                      borderRadius="lg"
                      p={8}
                      textAlign="center"
                      cursor="pointer"
                      _hover={{ bg: hoverBg }}
                      onClick={() => document.getElementById('edit-recipe-image-input').click()}
                    >
                      <Icon as={FiPlus} boxSize={10} color="gray.400" mb={2} />
                      <Text color="gray.600" fontSize="sm" mb={1}>
                        画像をアップロード
                      </Text>
                      <Text color="gray.500" fontSize="xs">
                        クリックして画像を選択
                      </Text>
                    </Box>
                  )}
                  <Input
                    id="edit-recipe-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleRecipeImageChange}
                    display="none"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>レシピ名</FormLabel>
                  <Input
                    name="name"
                    value={newRecipeData.name}
                    onChange={handleNewRecipeChange}
                    placeholder="例: ヘルシーチキンサラダ"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>説明</FormLabel>
                  <Input
                    name="description"
                    value={newRecipeData.description}
                    onChange={handleNewRecipeChange}
                    placeholder="レシピの簡単な説明"
                  />
                </FormControl>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>カロリー (kcal)</FormLabel>
                    <Input
                      type="number"
                      name="calories"
                      value={newRecipeData.calories}
                      onChange={handleNewRecipeChange}
                      placeholder="400"
                      min="0"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>調理時間</FormLabel>
                    <Input
                      name="time"
                      value={newRecipeData.time}
                      onChange={handleNewRecipeChange}
                      placeholder="例: 30分"
                      pattern="[0-9]+分?"
                      onKeyPress={(e) => {
                        if (!/[0-9分]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                </Grid>
                
                <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>タンパク質 (g)</FormLabel>
                    <Input
                      type="number"
                      name="protein"
                      value={newRecipeData.protein}
                      onChange={handleNewRecipeChange}
                      placeholder="40"
                      min="0"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>炭水化物 (g)</FormLabel>
                    <Input
                      type="number"
                      name="carbs"
                      value={newRecipeData.carbs}
                      onChange={handleNewRecipeChange}
                      placeholder="30"
                      min="0"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>脂質 (g)</FormLabel>
                    <Input
                      type="number"
                      name="fats"
                      value={newRecipeData.fats}
                      onChange={handleNewRecipeChange}
                      placeholder="15"
                      min="0"
                      step="0.1"
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                </Grid>
                
                <FormControl isRequired>
                  <FormLabel>人数</FormLabel>
                  <Input
                    type="number"
                    name="servings"
                    value={newRecipeData.servings}
                    onChange={handleNewRecipeChange}
                    placeholder="2"
                    min="1"
                    step="1"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>
                
                <Box w="full" p={4} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" color="blue.800" fontWeight="semibold" mb={2}>
                    💡 ヒント
                  </Text>
                  <Text fontSize="xs" color="blue.700">
                    画像を変更しない場合は、そのままにしておいてください。新しい画像を選択すると置き換えられます。
                  </Text>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditRecipeClose}>
                キャンセル
              </Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                更新
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Nutrition;

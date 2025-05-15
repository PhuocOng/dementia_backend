import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Menu from './Menu'; // Import the Menu component

const API_BASE_URL = `http://localhost:6000`;
const { width, height } = Dimensions.get('window');

// Menu icons
const MENU_ICON = '≡';
const CLOSE_ICON = '✕';

// Category emojis mapping
const categoryEmojis = {
  politics: '🗳️',
  geography: '🗺️',
  history: '📚',
  mythology: '🏛️',
  generalknowledge: '🧠',
  entertainment: '🎬',
  sports: '🏏',
  'current affairs': '📰',
  default: '📱',
};

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const [scaleValue] = useState(new Animated.Value(1));
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // New state for selected categories
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Animation for the menu
  const menuAnimation = useRef(new Animated.Value(-width * 0.7)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const categories = [
    {
      name: 'politics',
      subDomains: ['National', 'North Indian', 'South Indian'],
      icon: 'newspaper-outline',
      colorStart: '#1e3c72',
      colorEnd: '#2a5298',
    },
    {
      name: 'geography',
      subDomains: ['States and Capitals', 'Rivers and Mountains', 'National Parks', 'Libraries and Statues'],
      icon: 'map-outline',
      colorStart: '#56ab2f',
      colorEnd: '#a8e063',
    },
    {
      name: 'history',
      subDomains: ['Ancient India', 'Medieval India', 'Modern India','Freedom Movement'],
      icon: 'book-outline',
      colorStart: '#ff7e5f',
      colorEnd: '#feb47b',
    },
    {
      name: 'mythology',
      subDomains: ['Hindu', 'Other Mythologies'],
      icon: 'accessibility-outline',
      colorStart: '#614385',
      colorEnd: '#516395',
    },
    {
      name: 'generalKnowledge',
      subDomains: ['Economy', 'Festivals','Literature','Indian Literature','Science and Technology in India'],
      icon: 'accessibility-outline',
      colorStart: '#614385',
      colorEnd: '#516395',
    },
    {
      name: 'entertainment',
      subDomains: ['Bollywood Movies', 'Bollywood Actors', 'Bollywood Songs','Indian TV Shows'],
      icon: 'tv-outline',
      colorStart: '#ff4e50',
      colorEnd: '#f9d423',
    },
    {
      name: 'sports',
      subDomains: ['Cricket'],
      icon: 'tv-outline',
      colorStart: '#ff4e50',
      colorEnd: '#f9d423',
    },
    {
      name: 'current affairs',
      subDomains: ['Economic Affairs','Infrastructure','International Relations','Health and Environment'],
      icon: 'tv-outline',
      colorStart: '#ff4e50',
      colorEnd: '#f9d423',
    },
  ];

  // Toggle menu function
  const toggleMenu = () => {
    if (menuOpen) {
      // Close menu
      Animated.parallel([
        Animated.timing(menuAnimation, {
          toValue: -width * 0.7,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Open menu
      Animated.parallel([
        Animated.timing(menuAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(screenOpacity, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setMenuOpen(!menuOpen);
  };

  // Fetch User ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const sessionToken = await AsyncStorage.getItem('sessionToken');
        if (!sessionToken) {
          throw new Error('Session token not found');
        }
    
        const response = await axios.get(`${API_BASE_URL}/api/auth/get-user-id`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
          withCredentials: true,
        });
    
        setUserId(response.data.userId);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user ID:', error.response?.data || error.message);
        Alert.alert('Error', 'Failed to retrieve user information. Please log in again.');
        navigation.replace('Login');
      }
    };
    fetchUserId();
  }, [navigation]);

  // Log Activity
  const logActivity = async (category, subDomain) => {
    try {
      const sessionToken = await AsyncStorage.getItem('sessionToken');

      if (!sessionToken) {
        console.error('No session token found');
        Alert.alert('Error', 'User is not logged in.');
        return;
      }
      domain = subDomain;
      await axios.post(
        `${API_BASE_URL}/api/log-activity`,
        { category, domain },
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );
      console.log('Activity logged successfully');
    } catch (error) {
      console.error('Error logging activity:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to log activity.');
    }
  };

  // Handle Category Selection
  const handleCategorySelect = async (category, subDomain) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please log in again.');
      navigation.replace('Login');
      return;
    }
    await logActivity(category, subDomain);
    navigation.navigate('Trivia', { category, subDomain });
  };

  // Button Animation
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('sessionToken');
      Alert.alert('Logout Successful', 'You have been logged out.');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  // New function to handle selection of categories
  const handleSubdomainSelect = (category, subDomain) => {
    animateButtonPress();
    
    console.log(`Selection action: category=${category}, subDomain=${subDomain}`);
    
    // Check if this category/subdomain pair is already selected
    const alreadySelected = selectedCategories.some(
      selection => selection.category === category && selection.subDomain === subDomain
    );
    
    if (alreadySelected) {
      // Remove if already selected
      console.log(`Removing selection: ${category} - ${subDomain}`);
      setSelectedCategories(prev => 
        prev.filter(item => !(item.category === category && item.subDomain === subDomain))
      );
    } else {
      // Add if not selected
      console.log(`Adding selection: ${category} - ${subDomain}`);
      setSelectedCategories(prev => {
        const newSelections = [...prev, { category, subDomain }];
        console.log("Updated selections:", JSON.stringify(newSelections));
        return newSelections;
      });
    }
  };
  
  // Function to check if a category/subdomain is selected
  const isSelected = (category, subDomain) => {
    return selectedCategories.some(
      selection => selection.category === category && selection.subDomain === subDomain
    );
  };

  // New function to handle adding selected categories
  const handleAddCategories = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('No Categories Selected', 'Please select at least one category.');
      return;
    }
    
    console.log("About to add categories:", JSON.stringify(selectedCategories));
    
    try {
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        console.error('No session token found');
        Alert.alert('Error', 'User is not logged in.');
        return;
      }
      
      // Log activity for each selected category
      for (const { category, subDomain } of selectedCategories) {
        await logActivity(category, subDomain);
      }
      
      // First, fetch current preferences
      const currentPrefsResponse = await axios.get(
        `${API_BASE_URL}/api/user-preferences`,
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
        }
      );
      const currentPrefs = currentPrefsResponse.data.preferences || [];
      
      
      console.log("Current preferences from API:", JSON.stringify(currentPrefs));
      console.log("Adding new preferences:", JSON.stringify(selectedCategories));
      
      // Combine current and new preferences
      // Use a Set to track unique category-subDomain pairs to avoid duplicates
      const uniquePairs = new Set();
      const combinedPreferences = [];
      
      // Process current preferences first to keep existing selections
      currentPrefs.forEach(pref => {
        let category, subDomain;
        
        // Extract category and subDomain from various possible structures
        if (typeof pref === 'object') {
          if (pref.category && typeof pref.category === 'string') {
            category = pref.category;
            subDomain = pref.subDomain;
          } else if (pref.category && typeof pref.category === 'object') {
            category = pref.category.category;
            subDomain = pref.subDomain;
          } else {
            console.warn("Skipping unrecognized preference format:", pref);
            return;
          }
        } else {
          console.warn("Skipping non-object preference:", pref);
          return;
        }
        
        // Skip if category is missing or if subDomain is null/undefined/"General" 
        if (!category || !subDomain || subDomain === "General") {
          console.warn("Skipping incomplete or General-only preference:", JSON.stringify(pref));
          return;
        }
        
        const key = `${category}-${subDomain}`;
        console.log(`Processing existing preference: ${key}`);
        
        if (!uniquePairs.has(key)) {
          uniquePairs.add(key);
          // Store preferences in the normalized format
          combinedPreferences.push({
            category: category,
            subDomain: subDomain
          });
        }
      });
      
      // Add new preferences
      selectedCategories.forEach(item => {
        const key = `${item.category}-${item.subDomain}`;
        console.log(`Processing new preference: ${key}`);
        
        if (!uniquePairs.has(key)) {
          uniquePairs.add(key);
          combinedPreferences.push({
            category: item.category,
            subDomain: item.subDomain
          });
        }
      });
      
      console.log("Final combined preferences to send:", JSON.stringify(combinedPreferences));
      console.log("Selected categories:", JSON.stringify(selectedCategories));
      // Update user preferences on the server with the combined list
      for (const { category, subDomain } of selectedCategories) {
        console.log("Logging activity for is sending request:", category, subDomain);
        await axios.post(
          `${API_BASE_URL}/api/log-activity`, 
          { category, domain: subDomain }, 
          {
            headers: { Authorization: `Bearer ${sessionToken}` },
          }
        );
        console.log("Activity logged successfully", category, subDomain);
      }
      
      // Create a more descriptive success message
      const categoryCounts = {};
      selectedCategories.forEach(({ category, subDomain }) => {
        if (!categoryCounts[category]) {
          categoryCounts[category] = [];
        }
        categoryCounts[category].push(subDomain);
      });
      
      // Format message to include category and subcategory details
      const categoryMessages = Object.entries(categoryCounts)
        .map(([category, subDomains]) => 
          `${category}: ${subDomains.join(', ')}`
        );
      
      // Create the main success message with counts
      let successMsg = selectedCategories.length === 1
        ? `Added 1 subcategory successfully!\n`
        : `Added ${selectedCategories.length} subcategories successfully!\n`;
      
      // Add detail about which categories and subcategories were added
      if (categoryMessages.length > 0) {
        successMsg += categoryMessages.join('\n');
      }
      
      console.log("Success message:", successMsg);
      
      // Show success message
      setSuccessMessage(successMsg);
      
      // Clear message and selections after 5 seconds (increased from 3 for readability)
      setTimeout(() => {
        setSuccessMessage('');
        setSelectedCategories([]);
      }, 5000);
      
    } catch (error) {
      console.error('Error adding categories:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to add categories. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#A78BFA" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F5F3FF" barStyle="dark-content" />
      
      {/* Main Content */}
      <Animated.View style={[styles.mainContent, { opacity: screenOpacity }]}>
        {/* Header with Menu Icon */}
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            <Text style={styles.menuIconText}>{MENU_ICON}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categories</Text>
          <View style={styles.emptyBox} />
        </View>

        {/* Success message */}
        {successMessage ? (
          <View style={styles.successMessage}>
            <Text style={styles.successMessageText}>{successMessage}</Text>
          </View>
        ) : null}

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((category) => {
            // Count selected subdomains for this category
            const selectedCount = selectedCategories.filter(
              item => item.category === category.name
            ).length;
            
            return (
              <View key={category.name} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIconContainer}>
                    <Text style={styles.categoryEmoji}>
                      {categoryEmojis[category.name.toLowerCase()] || categoryEmojis.default}
                    </Text>
                  </View>
                  <View style={styles.categoryTitleContainer}>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    {selectedCount > 0 && (
                      <Text style={styles.selectedCount}>
                        {selectedCount} selected
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.subdomainsContainer}>
                  {category.subDomains.map((subDomain) => (
                    <TouchableOpacity
                      key={subDomain}
                      style={[
                        styles.subdomainCard,
                        isSelected(category.name, subDomain) && styles.selectedSubdomainCard
                      ]}
                      onPress={() => handleSubdomainSelect(category.name, subDomain)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.subdomainText}>{subDomain}</Text>
                      {isSelected(category.name, subDomain) && (
                        <View style={styles.checkmarkContainer}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
          
          {/* Add some padding at the bottom to account for the floating button */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Add Categories Button */}
        {selectedCategories.length > 0 && (
          <View style={styles.addButtonContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddCategories}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>
                Add ({selectedCategories.length}) {selectedCategories.length === 1 ? 'Category' : 'Categories'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Drawer Menu */}
      <Menu 
        navigation={navigation}
        isOpen={menuOpen}
        closeMenu={toggleMenu}
        menuAnimation={menuAnimation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3FF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#F5F3FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#F5F3FF",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4B5563",
  },
  menuButton: {
    padding: 8,
  },
  menuIconText: {
    fontSize: 26,
    color: "#4B5563",
  },
  emptyBox: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  categorySection: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4B5563",
    textTransform: "capitalize",
  },
  selectedCount: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
  },
  subdomainsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  subdomainCard: {
    backgroundColor: "#A78BFA",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 4,
    minWidth: "45%",
    alignItems: "center",
  },
  subdomainText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
  menu: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width * 0.7,
    height: "100%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    paddingTop: StatusBar.currentHeight || 0,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4B5563",
  },
  closeButton: {
    padding: 4,
  },
  closeIconText: {
    fontSize: 22,
    color: "#6B7280",
  },
  menuItemsContainer: {
    padding: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  menuItemIcon: {
    fontSize: 22,
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: "#4B5563",
  },
  logoutText: {
    color: "#EF4444",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 999,
  },
  selectedSubdomainCard: {
    backgroundColor: '#8B5CF6', // Darker purple when selected
  },
  checkmarkContainer: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  addButton: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    backgroundColor: '#10B981', // Green success color
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  successMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CategoriesScreen;

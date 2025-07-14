import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons'; // Added Feather
import { useAuth } from '@/Context/AuthContext';
import { api } from '@/api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/Context/ThemeContext'; // Import useTheme
import { useTranslation } from 'react-i18next';

const RESTAURANT_ID_KEY = 'restaurantId';

interface RestaurantType {
  id: string | number;
  image?: string | null;
  name: string;
  address: string;
  subdomain?: string | null;
}

const LogoPlaceholder = () => {
  const { colors } = useTheme(); // Use theme colors for the placeholder if needed
  const styles = createDynamicStyles(colors); // Re-create styles if they depend on theme
  return (
    <View style={styles.logoPlaceholder}>
      <Image source={require('../assets/images/LOGO.png')} style={styles.logoImage} resizeMode="contain" />
    </View>
  );
};

// Skeleton Loader Component for Restaurant Card
const RestaurantCardSkeleton = ({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) => {
  const styles = createDynamicStyles(colors);
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.skeletonImageContainer} />
      <View style={styles.skeletonTextContainer}>
        <View style={styles.skeletonTextLine} />
      </View>
    </View>
  );
};

const SelectRestaurantScreen = () => {
  const router = useRouter();
  const { updateRestaurantSelection, logout } = useAuth(); // Added logout
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme(); // Get colors from theme context
  const styles = createDynamicStyles(colors); // Create styles dynamically
  const { t } = useTranslation();

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/bo/restaurants/my_restaurants/');
      const restaurantData = response.data?.data || response.data || [];
      const uniqueRestaurants = (restaurantData as RestaurantType[]).filter(
        (restaurant, index, self) => index === self.findIndex(t => t.id === restaurant.id)
      );
      setRestaurants(uniqueRestaurants);
      
      const persistedRestaurantId = await AsyncStorage.getItem(RESTAURANT_ID_KEY);
      if (persistedRestaurantId) {
        setSelectedRestaurantId(persistedRestaurantId);
      }

    } catch (err: any) {
      console.error('Failed to fetch restaurants:', err);
      setError(t('failedToLoadRestaurants'));
    } finally {
      setIsLoading(false);
    }
  }, []); // Added useCallback

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSelectRestaurant = async (restaurant: RestaurantType) => {
    if (!restaurant || restaurant.id === undefined) {
      Alert.alert(t("error"), t("invalidRestaurantData"));
      return;
    }
    const newRestaurantId = restaurant.id.toString();
    try {
      // AsyncStorage update is handled within updateRestaurantSelection in AuthContext
      await updateRestaurantSelection(newRestaurantId); 
      // No need to set api.defaults here, AuthContext effect handles it
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 300);

    } catch (e) {
      console.error("Failed to select restaurant:", e);
      Alert.alert(t("error"), t("couldNotSaveRestaurantSelection"));
    }
  };

  const handleChangeUser = async () => {
    await logout();
    // Navigation to login or initial screen will be handled by AuthContext or root navigator
  };

  return (
    <View style={styles.screenContainerWithFixedButton}>
      <ScrollView style={styles.screenContainerScrollView} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('chooseRestaurant')}</Text>
          <Text style={styles.subtitle}>{t('selectRestaurantToManage')}</Text>
        </View>

        {isLoading ? (
          <View style={styles.listContainer}>
            {[...Array(2)].map((_, index) => ( // Display 2 skeletons
              <RestaurantCardSkeleton key={index} colors={colors} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.centeredContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchRestaurants} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : restaurants.length === 0 ? (
          <View style={styles.centeredContent}>
            <Text style={{ color: colors.text }}>{t('noRestaurantsFound')}</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {restaurants.map((restaurant) => {
              const isActive = selectedRestaurantId === restaurant.id.toString();
              return (
                <TouchableOpacity
                  key={restaurant.id}
                  style={[
                    styles.card,
                    isActive && styles.cardActive,
                  ]}
                  onPress={() => handleSelectRestaurant(restaurant)}
                >
                  <View style={[
                    styles.cardImageContainer,
                    isActive ? styles.cardImageContainerActive : styles.cardImageContainerInactive,
                  ]}>
                    <LogoPlaceholder />
                    <View style={[styles.addressBadge, isActive && styles.addressBadgeActive]}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color={isActive ? colors.text : colors.subtext} style={styles.mapPinIcon} />
                      <Text style={[styles.addressText, isActive && styles.addressTextActive]} numberOfLines={1}>
                        {restaurant.address || t('notAvailable')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, isActive && styles.cardTitleActive]} numberOfLines={1}>
                      {restaurant.name || t('unnamedRestaurant')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.changeUserButton} onPress={handleChangeUser}>
        <Feather name="log-out" size={20} color={colors.white} />
        <Text style={styles.changeUserButtonText}>{t('changeUser')}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Function to create styles dynamically based on theme colors
const createDynamicStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  screenContainerWithFixedButton: { // New style for the main container
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainerScrollView: { // Style for the ScrollView part
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContentContainer: {
    alignItems: 'center',
    paddingBottom: 80, // Increased padding to avoid overlap with fixed button
  },
  centeredContent: { // Renamed from 'centered' to be more specific for content
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 50, // Add some margin if needed
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.subtext,
    marginBottom: 30,
    fontSize: 16,
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 16,
  },
  card: {
    width: 180,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000', // Consider using a theme color for shadow if appropriate
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardActive: {
    transform: [{ scale: 1.05 }],
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
    borderColor: colors.primary,
  },
  cardImageContainer: {
    height: '75%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 10,
    margin: 6,
  },
  cardImageContainerInactive: {
     backgroundColor: colors.border, // Using border color as a neutral secondary
  },
  cardImageContainerActive: {
    backgroundColor: colors.primary,
  },
  logoPlaceholder: {
    // Styles for your logo placeholder
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  addressBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background, // Use background for badge, or a lighter card color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    opacity: 0.9,
  },
  addressBadgeActive: {
     backgroundColor: colors.card, // Slightly different for active state
     opacity: 0.95,
  },
  mapPinIcon: {
    marginRight: 4,
  },
  addressText: {
    fontSize: 10,
    color: colors.subtext,
    maxWidth: 100,
  },
  addressTextActive: {
    color: colors.text, // Use primary text color for active badge
  },
  cardContent: {
    padding: 10,
    height: '25%',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  cardTitleActive: {
    color: colors.primary, // Or a brighter text color if primary is too strong
  },
  // Skeleton Styles
  cardSkeleton: {
    width: 180,
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  skeletonImageContainer: {
    height: '75%',
    backgroundColor: colors.border, // Placeholder color
    margin: 6,
    borderRadius: 10,
  },
  skeletonTextContainer: {
    padding: 10,
    height: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonTextLine: {
    width: '80%',
    height: 16,
    backgroundColor: colors.border, // Placeholder color
    borderRadius: 4,
  },
  // Retry Button Styles
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Change User Button Styles
  changeUserButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary, // Similar to logout button
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  changeUserButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SelectRestaurantScreen;
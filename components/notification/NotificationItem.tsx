import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons'; // Assuming you use Expo or have react-native-vector-icons configured
import { NotificationType } from '@/app/Notifications';
import { useTheme } from '../../Context/ThemeContext'; // Import useTheme

interface NotificationItemProps {
  notification: NotificationType;
  onPress: (notification: NotificationType) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const getIcon = () => {
    switch (notification.notification_type) {
      case 'RESERVATION':
        return <Feather name="calendar" size={20} color={colors.success} />; // Use theme's success color
      case 'ALERT':
        return <Feather name="alert-triangle" size={20} color={colors.danger} />; // Use theme's danger color
      default:
        return <Feather name="info" size={20} color={colors.info} />; // Use theme's info color
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.is_read && styles.unreadContainer,
      ]}
      delayPressIn={100} // Delay to prevent accidental taps
      onPress={() => onPress(notification)}
    >
      {!notification.is_read && <View style={styles.unreadIndicator} />}
      <View style={styles.iconContainer}>{getIcon()}</View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !notification.is_read && styles.unreadTitle]}>
          {notification.title}
        </Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.timestamp}>
          {new Date(notification.created_at).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'flex-start',
  },
  unreadContainer: {
    backgroundColor: colors.primary + '1A', // Example: primary color with some opacity for unread background
  },
  unreadIndicator: { // Small dot for unread items, similar to web
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.notification, // Use theme's notification color
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 2, // Align icon nicely with text
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold', // Keep bold, or make it more prominent
  },
  message: {
    fontSize: 13,
    color: colors.subtext, // Use theme's subtext color
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: colors.subtext, // Use theme's subtext color (or a muted variant if available)
  },
});

export default NotificationItem;

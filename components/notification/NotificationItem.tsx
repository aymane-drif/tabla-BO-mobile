import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons'; // Assuming you use Expo or have react-native-vector-icons configured
import { NotificationType } from '@/app/Notifications';

interface NotificationItemProps {
  notification: NotificationType;
  onPress: (notification: NotificationType) => void;
}

// Basic colors, replace with your app's theme
const colors = {
  text: '#333333',
  textSecondary: '#555555',
  textMuted: '#777777',
  primary: '#007bff',
  accentGreen: '#28a745',
  accentRed: '#dc3545',
  unreadBackground: '#e6f7ff', // A light blue for unread items
  border: '#dddddd',
  cardBackground: '#ffffff',
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'RESERVATION':
        return <Feather name="calendar" size={20} color={colors.accentGreen} />;
      case 'ALERT':
        return <Feather name="alert-triangle" size={20} color={colors.accentRed} />;
      default:
        return <Feather name="info" size={20} color={colors.textSecondary} />;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.is_read && styles.unreadContainer,
      ]}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'flex-start',
  },
  unreadContainer: {
    backgroundColor: colors.unreadBackground, // Highlight unread items
  },
  unreadIndicator: { // Small dot for unread items, similar to web
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
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
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default NotificationItem;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Assuming you use React Navigation
// import * as Notifications from 'expo-notifications';
import NotificationItem from '../components/notification/NotificationItem'; // Adjust path as needed
import {PermissionsAndroid} from 'react-native';
export const dummyNotifications = [
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  },
  {
    "user_notification_id": 21,
    "notification_id": 4,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Created: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been created.",
    "data": {
      "action": "created",
      "status": "APPROVED",
      "event_type": "reservation_created_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T21:36:10.489309Z",
    "is_read": false,
    "read_at": null
  },
  {
    "user_notification_id": 22,
    "notification_id": 5,
    "restaurant_id": 1,
    "restaurant_name": "La Pizza Italiana",
    "notification_type": "RESERVATION",
    "title": "Reservation Updated: 417 for La Pizza Italiana",
    "message": "Reservation for 417 (2 guests) at La Pizza Italiana on 2025-05-15 12:15 has been updated.",
    "data": {
      "action": "updated",
      "status": "PENDING",
      "event_type": "reservation_updated_lifecycle",
      "reservation_id": "417",
      "restaurant_name": "La Pizza Italiana",
      "restaurant_id_payload": "1"
    },
    "created_at": "2025-05-12T22:36:10.489309Z",
    "is_read": true,
    "read_at": "2025-05-12T22:40:10.489309Z"
  }
];

export type NotificationType = typeof dummyNotifications[0];

type ActiveTab = 'unread' | 'read';

// Basic colors, replace with your app's theme
const colors = {
  text: '#333333',
  textLight: '#ffffff',
  primary: '#007bff',
  secondary: '#6c757d',
  background: '#f8f9fa',
  cardBackground: '#ffffff',
  border: '#dddddd',
  error: '#dc3545',
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('unread');
  const navigation = useNavigation();
  // const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  // const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  // const appState = useRef(AppState.currentState);


  // PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

  // useEffect(() => {
  //   // Listener for when a notification is received while the app is foregrounded
  //   notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
  //     // You might want to update your notifications list here,
  //     // or display a custom in-app notification UI
  //     console.log('Notification received in foreground:', notification);
  //     // Example: Add to current notifications list if it's new
  //     // This is a basic example, you'll need to adapt it to your data structure and avoid duplicates
  //     const newNotificationData = notification.request.content.data as NotificationType; // Adjust type as needed
  //     // Ensure it's a valid notification structure before adding
  //     if (newNotificationData && newNotificationData.user_notification_id) {
  //       setNotifications(prev => {
  //         // Avoid adding duplicates if the notification is already in the list
  //         if (prev.find(n => n.user_notification_id === newNotificationData.user_notification_id)) {
  //           return prev;
  //         }
  //         return [newNotificationData, ...prev];
  //       });
  //     }
  //   });

  //   // Listener for when a user interacts with a notification (taps on it)
  //   // This is fired when the app is foregrounded, backgrounded, or killed
  //   responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
  //     console.log('Notification response received:', response);
  //     const notificationData = response.notification.request.content.data as NotificationType; // Adjust type as needed

  //     // Example: Navigate to a specific screen or handle the notification
  //     if (notificationData?.notification_type === 'RESERVATION' && notificationData?.data?.reservation_id) {
  //       // @ts-ignore
  //       navigation.navigate('Reservations', { reservation_id: notificationData.data.reservation_id });
  //     }
  //     // You might also want to mark the notification as read here
  //     if (notificationData && notificationData.user_notification_id) {
  //         handleMarkAsRead(notificationData, false); // Pass false to avoid navigation if already handled
  //     }
  //   });

  //   // Handle initial notification if the app was opened from a notification
  //   Notifications.getLastNotificationResponseAsync().then(response => {
  //     if (response && response.notification) {
  //       console.log('App opened from notification:', response);
  //       const notificationData = response.notification.request.content.data as NotificationType; // Adjust type as needed
  //       if (notificationData?.notification_type === 'RESERVATION' && notificationData?.data?.reservation_id) {
  //         // @ts-ignore
  //         navigation.navigate('Reservations', { reservation_id: notificationData.data.reservation_id });
  //       }
  //        if (notificationData && notificationData.user_notification_id) {
  //         handleMarkAsRead(notificationData, false); // Pass false to avoid navigation if already handled
  //       }
  //     }
  //   });

  //   return () => {
  //     if (notificationListener.current) {
  //       Notifications.removeNotificationSubscription(notificationListener.current);
  //     }
  //     if (responseListener.current) {
  //       Notifications.removeNotificationSubscription(responseListener.current);
  //     }
  //   };
  // }, [navigation]);


  useEffect(() => {
    // Initialize with dummy data, ensuring proper is_read status
    // In a real app, you'd fetch this data
    const initialNotifications = dummyNotifications.map((n,i) => ({...n, user_notification_id: n.user_notification_id+i*Math.random()}));
    setNotifications(initialNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.filter(n => n.is_read).length;

  const handleMarkAsRead = useCallback((notificationToMark: NotificationType, shouldNavigate = true) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        n.user_notification_id === notificationToMark.user_notification_id
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );

    // Navigate if it's a reservation notification and navigation is allowed
    if (shouldNavigate && notificationToMark.notification_type === 'RESERVATION' && notificationToMark.data?.reservation_id) {
      // Assuming you have a 'Reservations' screen that can take 'reservation_id' as a param
      // Adjust screen name and params as per your navigation setup
      // @ts-ignore
      navigation.navigate('Reservations', { reservation_id: notificationToMark.data.reservation_id });
    }
  }, [navigation]);

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        !n.is_read ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    );
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: () => setNotifications([]) }
      ]
    );
  };

  const filteredNotifications = notifications.filter(n =>
    activeTab === 'unread' ? !n.is_read : n.is_read
  );

  const renderItem = ({ item }: { item: NotificationType }) => (
    <NotificationItem notification={item} onPress={handleMarkAsRead} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'unread' && styles.activeTabButton]}
            onPress={() => setActiveTab('unread')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'unread' && styles.activeTabButtonText]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'read' && styles.activeTabButton]}
            onPress={() => setActiveTab('read')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'read' && styles.activeTabButtonText]}>
              Read ({readCount})
            </Text>
          </TouchableOpacity>
        </View>

        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              {activeTab === 'unread' ? 'No unread notifications.' : 'No read notifications.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={renderItem}
            keyExtractor={item => item.user_notification_id.toString()}
            style={styles.list}
          />
        )}

        {notifications.length > 0 && (
          <View style={styles.footerActions}>
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              style={[styles.footerButton, unreadCount === 0 && styles.disabledButton]}
            >
              <Text style={styles.footerButtonText}>Mark all as read ({unreadCount})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClearAll}
              disabled={notifications.length === 0}
              style={[styles.footerButton, styles.clearButton, notifications.length === 0 && styles.disabledButton]}
            >
              <Text style={[styles.footerButtonText, styles.clearButtonText]}>Clear all ({notifications.length})</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: colors.secondary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.secondary,
  },
  footerActions: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBackground,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    // backgroundColor: colors.primary, // Using text buttons for actions
  },
  footerButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  clearButton: {
    // backgroundColor: colors.error,
  },
  clearButtonText: {
    color: colors.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default NotificationsScreen;

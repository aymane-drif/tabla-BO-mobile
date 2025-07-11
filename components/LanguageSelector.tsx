import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/Context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { handleRTL } from '@/i18n';

const LANGUAGE_KEY = 'app-language';

// Define your languages here
// Make sure the image paths are correct.
const languages = [
  { code: 'en', name: 'English', image: require('../assets/images/en.png') },
  { code: 'fr', name: 'Français', image: require('../assets/images/fr.png') },
  { code: 'ar', name: 'العربية', image: require('../assets/images/ar.png') },
];

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage && savedLanguage !== i18n.language) {
        i18n.changeLanguage(savedLanguage);
        setCurrentLanguage(savedLanguage);
      }
    };
    loadLanguage();
  }, [i18n]);

  const changeLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    await AsyncStorage.setItem(LANGUAGE_KEY, langCode);
    setCurrentLanguage(langCode);
    setModalVisible(false);
    handleRTL(langCode);
  };

  const selectedLanguage = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const styles = StyleSheet.create({
    // ... styles from below
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
    },
    flag: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
    },
    langName: {
      color: colors.text,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      width: '80%',
      maxHeight: '60%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
    },
    checkIcon: {
      marginLeft: 'auto',
    },
  });

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => setModalVisible(true)}>
        <Image source={selectedLanguage.image} style={styles.flag} />
        <Text style={styles.langName}>{t(selectedLanguage.code)}</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => changeLanguage(item.code)}>
                  <Image source={item.image} style={styles.flag} />
                  <Text style={styles.optionText}>{t(item.code)}</Text>
                  {currentLanguage === item.code && (
                    <Feather name="check" size={20} color={colors.primary} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default LanguageSelector;
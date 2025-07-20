import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from "react-native"
import * as Updates from "expo-updates"

// Import your translation files
import i18nEn from './locales/en.json';
import i18nFr from './locales/fr.json';
import i18nAr from './locales/ar.json';

import { LocaleConfig } from "react-native-calendars"
import { enUS, fr, ar, Locale } from "date-fns/locale"

// date-fns locales mapping
export const dateFnsLocales: { [key: string]: Locale } = {
  en: enUS,
  fr: fr,
  ar: ar
}

// react-native-calendars localization
export const configureCalendars = (language: string) => {
  if (language === "fr") {
    LocaleConfig.locales.fr = {
      monthNames: [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre",
      ],
      monthNamesShort: ["Janv.", "Févr.", "Mars", "Avril", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."],
      dayNames: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
      dayNamesShort: ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."],
      today: "Aujourd'hui",
    }
    LocaleConfig.defaultLocale = "fr"
  } else if (language === "ar") {
    LocaleConfig.locales.ar = {
      monthNames: [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ],
      monthNamesShort: ["ينا.", "فبر.", "مار.", "أبر.", "ماي.", "يون.", "يول.", "أغس.", "سبت.", "أكت.", "نوف.", "ديس."],
      dayNames: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
      dayNamesShort: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
      today: "اليوم",
    }
    LocaleConfig.defaultLocale = "ar"
  } else {
    LocaleConfig.locales.en = {
      monthNames: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      monthNamesShort: ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."],
      dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      dayNamesShort: ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."],
      today: "Today",
    };
    LocaleConfig.defaultLocale = "en"
  }
}

// Initial configuration
configureCalendars(i18n.language)

const resources = {
  en: {
    translation: i18nEn.translation,
  },
  fr: {
    translation: i18nFr.translation,
  },
  ar: {
    translation: i18nAr.translation,
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: Localization.getLocales()[0]?.languageCode, // detect user language
    fallbackLng: 'en', // use en if detected lng is not available
    compatibilityJSON: 'v3', // To make it work for Android devices
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });
export const handleRTL = (lng: string)=> {
  const isRTL = lng.startsWith("ar")
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL)
    Updates.reloadAsync()
  }
}
// Listen for language changes
i18n.on("languageChanged", (lng) => {
  configureCalendars(lng)
});

export default i18n;
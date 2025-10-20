import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export async function saveItem(key: string, value: string) {
  try {
    if (Platform.OS === 'web') await AsyncStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Storage error:', error);
  }
};

export async function getItem(key: string) {
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem(key);
    else return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Storage error:', error);
    return null;
  }
};

export async function removeItem(key: string) {
  try {
    if(Platform.OS === 'web') await AsyncStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Storage error:', error);
  }
}
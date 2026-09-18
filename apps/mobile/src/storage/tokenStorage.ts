import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cross-platform secure-ish storage:
 * - Native: expo-secure-store
 * - Web: localStorage (HttpOnly cookies would require API changes; tokens stay client-side)
 */
const memory = new Map<string, string>();

function canUseLocalStorage() {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (canUseLocalStorage()) return localStorage.getItem(key);
    return memory.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (canUseLocalStorage()) {
      localStorage.setItem(key, value);
      return;
    }
    memory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (canUseLocalStorage()) {
      localStorage.removeItem(key);
      return;
    }
    memory.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

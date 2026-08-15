import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "meme_auth_token";
const ADMIN_KEY_KEY = "meme_admin_key";

export interface AuthUser {
  id: number;
  username: string;
  status: "pending" | "approved" | "rejected";
  token: string;
  createdAt: string;
}

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuth(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, user.token);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getAdminKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ADMIN_KEY_KEY);
  } catch {
    return null;
  }
}

export async function setAdminKey(key: string): Promise<void> {
  await AsyncStorage.setItem(ADMIN_KEY_KEY, key);
}

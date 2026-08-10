import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "meme_favorites_v1";

export async function getFavorites(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(Number) : [];
  } catch {
    return [];
  }
}

export async function setFavorites(ids: number[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(ids));
}

export async function isFavorite(id: number): Promise<boolean> {
  return (await getFavorites()).includes(id);
}

export async function toggleFavorite(id: number): Promise<number[]> {
  const cur = await getFavorites();
  const next = cur.includes(id)
    ? cur.filter((x) => x !== id)
    : [...cur, id];
  await setFavorites(next);
  return next;
}

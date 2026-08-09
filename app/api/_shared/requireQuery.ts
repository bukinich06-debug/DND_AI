export const requireQuery = (url: string, key: string) => {
  const value = new URL(url).searchParams.get(key);
  if (!value) throw new Error(`Параметр ${key} обязателен.`);
  return value;
};

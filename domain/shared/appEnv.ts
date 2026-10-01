export type AppEnv = 'production' | 'staging' | 'development';

const APP_ENVS = new Set<string>(['production', 'staging', 'development']);

export const getAppEnv = (): AppEnv => {
  const value = process.env.APP_ENV?.trim().toLowerCase();
  if (value && APP_ENVS.has(value)) return value as AppEnv;
  return 'production';
};

export const isDevAppEnv = () => getAppEnv() === 'development';

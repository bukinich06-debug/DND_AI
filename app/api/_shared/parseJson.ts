export const parseJson = async <T>(req: Request): Promise<T> => {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error('Некорректный JSON.');
  }
};

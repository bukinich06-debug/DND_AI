export const CATALOG_KEY_RE = /^[a-z][a-zA-Z0-9]*$/;

const KEY_ERROR = 'key — латиница, с буквы, без пробелов и дефисов (например dagger).';

export const parseCatalogKey = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const key = value.trim();
  if (!key) return null;
  if (!CATALOG_KEY_RE.test(key)) throw new Error(KEY_ERROR);
  return key;
};

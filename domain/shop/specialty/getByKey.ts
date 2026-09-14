import { loadSpecialtyCatalog } from './loadCatalog';

export const getSpecialtyByKey = (key: string) => {
  const catalog = loadSpecialtyCatalog();
  const specialty = catalog.find((s) => s.key === key);
  if (!specialty) throw new Error(`Специальность "${key}" не найдена в справочнике.`);
  return specialty;
};

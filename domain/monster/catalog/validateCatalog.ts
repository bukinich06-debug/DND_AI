import type { IMonsterAbility, IMonsterAction, IMonsterCatalogEntry } from './types';

const KEY_RE = /^[a-z][a-zA-Z0-9]*$/;

const ALLOWED = new Set([
  'key',
  'aliases',
  'name',
  'summary',
  'size',
  'creatureType',
  'challengeRating',
  'proficiencyBonus',
  'str',
  'dex',
  'con',
  'int',
  'wis',
  'cha',
  'hpMax',
  'ac',
  'speed',
  'initiativeBonus',
  'saveProf',
  'resistances',
  'immunities',
  'vulnerabilities',
  'conditionImmunities',
  'senses',
  'languages',
  'traits',
  'actions',
  'reactions',
  'legendaryActions',
  'lootCoinsCp',
]);

const validateAbility = (raw: unknown, where: string, field: string): IMonsterAbility => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error(`${where}.${field}: элемент должен быть объектом.`);

  const obj = raw as Record<string, unknown>;
  if (typeof obj.name !== 'string' || !obj.name.trim())
    throw new Error(`${where}.${field}: name обязателен.`);
  if (typeof obj.description !== 'string' || !obj.description.trim())
    throw new Error(`${where}.${field}: description обязателен.`);

  return {
    name: obj.name.trim(),
    description: obj.description.trim(),
  };
};

const validateAction = (raw: unknown, where: string, field: string): IMonsterAction => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error(`${where}.${field}: элемент должен быть объектом.`);

  const obj = raw as Record<string, unknown>;
  if (typeof obj.name !== 'string' || !obj.name.trim())
    throw new Error(`${where}.${field}: name обязателен.`);
  if (typeof obj.description !== 'string' || !obj.description.trim())
    throw new Error(`${where}.${field}: description обязателен.`);

  if (obj.attackBonus !== undefined && typeof obj.attackBonus !== 'number')
    throw new Error(`${where}.${field}: attackBonus должен быть числом.`);
  if (obj.damage !== undefined && typeof obj.damage !== 'string')
    throw new Error(`${where}.${field}: damage должен быть строкой.`);
  if (obj.damageType !== undefined && typeof obj.damageType !== 'string')
    throw new Error(`${where}.${field}: damageType должен быть строкой.`);

  return {
    name: obj.name.trim(),
    description: obj.description.trim(),
    ...(obj.attackBonus !== undefined ? { attackBonus: obj.attackBonus as number } : {}),
    ...(obj.damage !== undefined ? { damage: (obj.damage as string).trim() } : {}),
    ...(obj.damageType !== undefined ? { damageType: (obj.damageType as string).trim() } : {}),
  };
};

const parseEntry = (raw: unknown, index: number): IMonsterCatalogEntry => {
  const where = `monsters.json[${index}]`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error(`${where}: запись справочника должна быть объектом.`);

  const row = raw as Record<string, unknown>;
  for (const field of Object.keys(row)) {
    if (!ALLOWED.has(field)) throw new Error(`${where}: запрещённое поле «${field}».`);
  }

  if (typeof row.key !== 'string' || !KEY_RE.test(row.key))
    throw new Error(`${where}: key — латиница, с буквы, без пробелов и дефисов (например goblin).`);

  if (!Array.isArray(row.aliases) || row.aliases.length < 1)
    throw new Error(`${where}: aliases — непустой массив строк.`);
  const aliases: string[] = [];
  for (const alias of row.aliases) {
    if (typeof alias !== 'string' || !alias.trim()) throw new Error(`${where}: каждый alias — непустая строка.`);
    aliases.push(alias.trim());
  }

  if (typeof row.name !== 'string' || !row.name.trim()) throw new Error(`${where}: name обязателен.`);

  if (row.summary !== null && typeof row.summary !== 'string') throw new Error(`${where}: summary — строка или null.`);
  if (row.size !== null && typeof row.size !== 'string') throw new Error(`${where}: size — строка или null.`);
  if (row.creatureType !== null && typeof row.creatureType !== 'string')
    throw new Error(`${where}: creatureType — строка или null.`);
  if (row.challengeRating !== null && typeof row.challengeRating !== 'string')
    throw new Error(`${where}: challengeRating — строка или null.`);
  if (row.proficiencyBonus !== null && typeof row.proficiencyBonus !== 'number')
    throw new Error(`${where}: proficiencyBonus — число или null.`);

  if (typeof row.str !== 'number') throw new Error(`${where}: str обязателен.`);
  if (typeof row.dex !== 'number') throw new Error(`${where}: dex обязателен.`);
  if (typeof row.con !== 'number') throw new Error(`${where}: con обязателен.`);
  if (typeof row.int !== 'number') throw new Error(`${where}: int обязателен.`);
  if (typeof row.wis !== 'number') throw new Error(`${where}: wis обязателен.`);
  if (typeof row.cha !== 'number') throw new Error(`${where}: cha обязателен.`);
  if (typeof row.hpMax !== 'number') throw new Error(`${where}: hpMax обязателен.`);
  if (typeof row.ac !== 'number') throw new Error(`${where}: ac обязателен.`);
  if (typeof row.speed !== 'number') throw new Error(`${where}: speed обязателен.`);

  if (row.initiativeBonus !== null && typeof row.initiativeBonus !== 'number')
    throw new Error(`${where}: initiativeBonus — число или null.`);

  if (!Array.isArray(row.saveProf)) throw new Error(`${where}: saveProf — массив строк.`);
  if (!Array.isArray(row.resistances)) throw new Error(`${where}: resistances — массив строк.`);
  if (!Array.isArray(row.immunities)) throw new Error(`${where}: immunities — массив строк.`);
  if (!Array.isArray(row.vulnerabilities)) throw new Error(`${where}: vulnerabilities — массив строк.`);
  if (!Array.isArray(row.conditionImmunities)) throw new Error(`${where}: conditionImmunities — массив строк.`);
  if (!Array.isArray(row.senses)) throw new Error(`${where}: senses — массив строк.`);
  if (!Array.isArray(row.languages)) throw new Error(`${where}: languages — массив строк.`);

  let traits: IMonsterAbility[] | null = null;
  if (row.traits !== null) {
    if (!Array.isArray(row.traits)) throw new Error(`${where}: traits — массив объектов или null.`);
    traits = row.traits.map((t) => validateAbility(t, where, 'traits'));
  }

  let actions: IMonsterAction[] | null = null;
  if (row.actions !== null) {
    if (!Array.isArray(row.actions)) throw new Error(`${where}: actions — массив объектов или null.`);
    actions = row.actions.map((a) => validateAction(a, where, 'actions'));
  }

  let reactions: IMonsterAbility[] | null = null;
  if (row.reactions !== null) {
    if (!Array.isArray(row.reactions)) throw new Error(`${where}: reactions — массив объектов или null.`);
    reactions = row.reactions.map((r) => validateAbility(r, where, 'reactions'));
  }

  let legendaryActions: IMonsterAction[] | null = null;
  if (row.legendaryActions !== null) {
    if (!Array.isArray(row.legendaryActions)) throw new Error(`${where}: legendaryActions — массив объектов или null.`);
    legendaryActions = row.legendaryActions.map((la) => validateAction(la, where, 'legendaryActions'));
  }

  if (typeof row.lootCoinsCp !== 'number' || !Number.isInteger(row.lootCoinsCp) || row.lootCoinsCp < 0)
    throw new Error(`${where}: lootCoinsCp — целое ≥ 0.`);

  return {
    key: row.key,
    aliases,
    name: row.name.trim(),
    summary: row.summary ? (row.summary as string).trim() : null,
    size: row.size ? (row.size as string).trim() : null,
    creatureType: row.creatureType ? (row.creatureType as string).trim() : null,
    challengeRating: row.challengeRating ? (row.challengeRating as string).trim() : null,
    proficiencyBonus: (row.proficiencyBonus as number | null) ?? null,
    str: row.str as number,
    dex: row.dex as number,
    con: row.con as number,
    int: row.int as number,
    wis: row.wis as number,
    cha: row.cha as number,
    hpMax: row.hpMax as number,
    ac: row.ac as number,
    speed: row.speed as number,
    initiativeBonus: (row.initiativeBonus as number | null) ?? null,
    saveProf: row.saveProf as string[],
    resistances: row.resistances as string[],
    immunities: row.immunities as string[],
    vulnerabilities: row.vulnerabilities as string[],
    conditionImmunities: row.conditionImmunities as string[],
    senses: row.senses as string[],
    languages: row.languages as string[],
    traits,
    actions,
    reactions,
    legendaryActions,
    lootCoinsCp: row.lootCoinsCp as number,
  };
};

export const validateCatalogFile = (raw: unknown): IMonsterCatalogEntry[] => {
  if (!Array.isArray(raw)) throw new Error('monsters.json: корневое значение должно быть массивом.');
  return raw.map((row, index) => parseEntry(row, index));
};

export const assertUniqueKeys = (entries: IMonsterCatalogEntry[]) => {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.key)) throw new Error(`Дублирующийся key справочника: ${entry.key}.`);
    seen.add(entry.key);
  }
};

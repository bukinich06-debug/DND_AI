/** Навыки PHB 2024 */
export const Skill = {
  athletics: 'athletics',
  acrobatics: 'acrobatics',
  sleightOfHand: 'sleightOfHand',
  stealth: 'stealth',
  arcana: 'arcana',
  history: 'history',
  investigation: 'investigation',
  nature: 'nature',
  religion: 'religion',
  animalHandling: 'animalHandling',
  insight: 'insight',
  medicine: 'medicine',
  perception: 'perception',
  survival: 'survival',
  deception: 'deception',
  intimidation: 'intimidation',
  performance: 'performance',
  persuasion: 'persuasion',
} as const;

export type Skill = (typeof Skill)[keyof typeof Skill];

/** Инструменты PHB 2024 */
export const Tool = {
  alchemistsSupplies: 'alchemistsSupplies',
  brewersSupplies: 'brewersSupplies',
  calligraphersSupplies: 'calligraphersSupplies',
  carpentersTools: 'carpentersTools',
  cartographersTools: 'cartographersTools',
  cobblersTools: 'cobblersTools',
  cooksUtensils: 'cooksUtensils',
  glassblowersTools: 'glassblowersTools',
  jewelersTools: 'jewelersTools',
  leatherworkersTools: 'leatherworkersTools',
  masonsTools: 'masonsTools',
  paintersSupplies: 'paintersSupplies',
  pottersTools: 'pottersTools',
  smithsTools: 'smithsTools',
  tinkersTools: 'tinkersTools',
  weaversTools: 'weaversTools',
  woodcarversTools: 'woodcarversTools',
  disguiseKit: 'disguiseKit',
  forgeryKit: 'forgeryKit',
  herbalismKit: 'herbalismKit',
  navigatorsTools: 'navigatorsTools',
  poisonersKit: 'poisonersKit',
  thievesTools: 'thievesTools',
  bagpipes: 'bagpipes',
  drum: 'drum',
  dulcimer: 'dulcimer',
  flute: 'flute',
  horn: 'horn',
  lute: 'lute',
  lyre: 'lyre',
  panFlute: 'panFlute',
  shawm: 'shawm',
  viol: 'viol',
} as const;

export type Tool = (typeof Tool)[keyof typeof Tool];

/** Алиасы навыков: ключ + en/ru имена */
export const SKILL_ALIASES: Record<Skill, string[]> = {
  athletics: ['athletics', 'атлетика'],
  acrobatics: ['acrobatics', 'акробатика'],
  sleightOfHand: ['sleight of hand', 'sleight-of-hand', 'ловкость рук'],
  stealth: ['stealth', 'скрытность'],
  arcana: ['arcana', 'магия', 'аркана'],
  history: ['history', 'история'],
  investigation: ['investigation', 'анализ', 'расследование'],
  nature: ['nature', 'природа'],
  religion: ['religion', 'религия'],
  animalHandling: ['animal handling', 'animal-handling', 'уход за животными', 'обращение с животными'],
  insight: ['insight', 'проницательность'],
  medicine: ['medicine', 'медицина'],
  perception: ['perception', 'внимательность', 'восприятие'],
  survival: ['survival', 'выживание'],
  deception: ['deception', 'обман'],
  intimidation: ['intimidation', 'запугивание'],
  performance: ['performance', 'выступление'],
  persuasion: ['persuasion', 'убеждение'],
};

/** Алиасы инструментов: ключ + en/ru имена */
export const TOOL_ALIASES: Record<Tool, string[]> = {
  alchemistsSupplies: ["alchemist's supplies", 'alchemists supplies', 'набор алхимика', 'принадлежности алхимика'],
  brewersSupplies: ["brewer's supplies", 'brewers supplies', 'пивоваренный набор', 'принадлежности пивовара'],
  calligraphersSupplies: [
    "calligrapher's supplies",
    'calligraphers supplies',
    'каллиграфический набор',
    'принадлежности каллиграфа',
  ],
  carpentersTools: ["carpenter's tools", 'carpenters tools', 'плотничьи инструменты', 'инструменты плотника'],
  cartographersTools: [
    "cartographer's tools",
    'cartographers tools',
    'картографические инструменты',
    'инструменты картографа',
  ],
  cobblersTools: ["cobbler's tools", 'cobblers tools', 'сапожные инструменты', 'инструменты сапожника'],
  cooksUtensils: ["cook's utensils", 'cooks utensils', 'поварские принадлежности', 'кухонная утварь'],
  glassblowersTools: [
    "glassblower's tools",
    'glassblowers tools',
    'стеклодувные инструменты',
    'инструменты стеклодува',
  ],
  jewelersTools: ["jeweler's tools", 'jewelers tools', 'ювелирные инструменты', 'инструменты ювелира'],
  leatherworkersTools: [
    "leatherworker's tools",
    'leatherworkers tools',
    'кожевенные инструменты',
    'инструменты кожевника',
  ],
  masonsTools: ["mason's tools", 'masons tools', 'каменщицкие инструменты', 'инструменты каменщика'],
  paintersSupplies: ["painter's supplies", 'painters supplies', 'живописный набор', 'принадлежности художника'],
  pottersTools: ["potter's tools", 'potters tools', 'гончарные инструменты', 'инструменты гончара'],
  smithsTools: ["smith's tools", 'smiths tools', 'кузнечные инструменты', 'инструменты кузнеца'],
  tinkersTools: ["tinker's tools", 'tinkers tools', 'инструменты жестянщика', 'инструменты ремесленника-жестянщика'],
  weaversTools: ["weaver's tools", 'weavers tools', 'ткацкие инструменты', 'инструменты ткача'],
  woodcarversTools: [
    "woodcarver's tools",
    'woodcarvers tools',
    'резчицкие инструменты',
    'инструменты резчика по дереву',
  ],
  disguiseKit: ['disguise kit', 'набор для грима', 'набор маскировки'],
  forgeryKit: ['forgery kit', 'набор для подделки', 'набор фальсификатора'],
  herbalismKit: ['herbalism kit', 'набор травника', 'травницкий набор'],
  navigatorsTools: ["navigator's tools", 'navigators tools', 'навигационные инструменты', 'инструменты навигатора'],
  poisonersKit: ["poisoner's kit", 'poisoners kit', 'набор отравителя'],
  thievesTools: ["thieves' tools", 'thieves tools', 'воровские инструменты', 'инструменты вора'],
  bagpipes: ['bagpipes', 'волынка'],
  drum: ['drum', 'барабан'],
  dulcimer: ['dulcimer', 'цимбалы', 'дульцимер'],
  flute: ['flute', 'флейта'],
  horn: ['horn', 'рог'],
  lute: ['lute', 'лютня'],
  lyre: ['lyre', 'лира'],
  panFlute: ['pan flute', 'panflute', 'свирель', 'флейта пана'],
  shawm: ['shawm', 'шалмей'],
  viol: ['viol', 'виола'],
};

/** Состояния PHB 2024 */
export const Condition = {
  blinded: 'blinded',
  charmed: 'charmed',
  deafened: 'deafened',
  exhaustion: 'exhaustion',
  frightened: 'frightened',
  grappled: 'grappled',
  incapacitated: 'incapacitated',
  invisible: 'invisible',
  paralyzed: 'paralyzed',
  petrified: 'petrified',
  poisoned: 'poisoned',
  prone: 'prone',
  restrained: 'restrained',
  stunned: 'stunned',
  unconscious: 'unconscious',
} as const;

export type Condition = (typeof Condition)[keyof typeof Condition];

export const MAX_EXHAUSTION_LEVEL = 6;

export const CONDITION_ALIASES: Record<Condition, string[]> = {
  blinded: ['blinded', 'ослеплён', 'ослеплен', 'слепота'],
  charmed: ['charmed', 'очарован', 'очарование'],
  deafened: ['deafened', 'оглушён', 'оглушен', 'глухота'],
  exhaustion: ['exhaustion', 'истощение', 'усталость'],
  frightened: ['frightened', 'испуган', 'страх'],
  grappled: ['grappled', 'схвачен', 'захват'],
  incapacitated: ['incapacitated', 'недееспособен', 'недееспособность'],
  invisible: ['invisible', 'невидим', 'невидимость'],
  paralyzed: ['paralyzed', 'парализован', 'паралич'],
  petrified: ['petrified', 'окаменел', 'окаменение'],
  poisoned: ['poisoned', 'отравлен', 'отравление'],
  prone: ['prone', 'сбит с ног', 'лежит', 'повержен'],
  restrained: ['restrained', 'обездвижен', 'скован'],
  stunned: ['stunned', 'оглушён станом', 'стан', 'ошеломлён', 'ошеломлен'],
  unconscious: ['unconscious', 'без сознания', 'сон', 'спит', 'asleep', 'sleep'],
};

/** Краткие правила PHB 2024 для ответа LLM */
export const CONDITION_RULES: Record<Condition, string> = {
  blinded:
    'Не видит; автоматически проваливает проверки, требующие зрения. Атаки по нему с преимуществом, его атаки с помехой.',
  charmed:
    'Не может атаковать очаровавшего и использовать на него вредоносные эффекты. Очаровавший имеет преимущество на социальные проверки против него.',
  deafened: 'Не слышит; автоматически проваливает проверки, требующие слуха.',
  exhaustion:
    'Уровни 1–6. За каждый уровень: −2 ко всем D20 Test и −5 фт. к скорости. На 6 уровне — смерть (dead = true). Долгий отдых снимает 1 уровень.',
  frightened:
    'Помеха на проверки и атаки, пока источник страха в зоне видимости. Не может добровольно приближаться к источнику страха.',
  grappled: 'Скорость 0. Помеха на атаки по целям, кроме схватившего. Схвативший может тащить/нести (движение дороже).',
  incapacitated: 'Нельзя совершать действия, бонусные действия и реакции.',
  invisible:
    'Сильно скрыт (Heavily Obscured) без магии видения. Атаки по нему с помехой, его атаки с преимуществом (пока не обнаружен).',
  paralyzed:
    'Недееспособен, не может двигаться и говорить. Автопровал спасбросков Силы и Ловкости. Атаки по нему с преимуществом; попадание в упор — критическое.',
  petrified:
    'Превращён в твердое вещество; недееспособен, скорость 0. Сопротивление урону; иммунитет к яду и болезням. Вес ×10.',
  poisoned: 'Помеха на броски атаки и проверки характеристик.',
  prone:
    'Может ползти или встать (тратит движение). Помеха на атаки. Атаки вблизи по нему с преимуществом, дальние — с помехой.',
  restrained: 'Скорость 0. Помеха на атаки и спасброски Ловкости. Атаки по нему с преимуществом.',
  stunned:
    'Недееспособен, не может двигаться, говорит с трудом. Автопровал спасбросков Силы и Ловкости. Атаки по нему с преимуществом.',
  unconscious:
    'Недееспособен, падает ничком (prone), скорость 0, не осознаёт окружение. Автопровал спасбросков Силы и Ловкости. Атаки по нему с преимуществом; попадание в упор — критическое.',
};

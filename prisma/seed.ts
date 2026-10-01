import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client';

const SEED_CAMPAIGN_NAME = 'Пыльный тракт';
/** Stable IDs for local UI `.env` (`NEXT_PUBLIC_COMPANY_ID` / `NEXT_PUBLIC_PLAYER_ID`). */
const SEED_CAMPAIGN_ID = 'cmseedcampaigndustyroad01';
const SEED_PLAYER_ID = 'cmseedplayerelarawind01';

const createDb = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Не задан DATABASE_URL.');

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

const db = createDb();

const main = async () => {
  const existing = await db.campaign.findUnique({ where: { id: SEED_CAMPAIGN_ID } });
  if (existing) {
    console.log(`Seed уже есть: кампания «${SEED_CAMPAIGN_NAME}» (${existing.id}). Пропуск.`);
    console.log(`  UI: NEXT_PUBLIC_COMPANY_ID=${SEED_CAMPAIGN_ID}`);
    console.log(`  UI: NEXT_PUBLIC_PLAYER_ID=${SEED_PLAYER_ID}`);
    return;
  }

  const campaign = await db.campaign.create({
    data: {
      id: SEED_CAMPAIGN_ID,
      name: SEED_CAMPAIGN_NAME,
      description:
        'Стартовая кампания для локальной разработки: маленький городок у тракта, таверна, кузница и один квест.',
      dayIndex: 1,
      timeOfDay: 'morning',
    },
  });

  const region = await db.location.create({
    data: {
      campaignId: campaign.id,
      kind: 'region',
      name: 'Серые холмы',
      summary: 'Низкие холмы вдоль старого тракта.',
      description:
        'Волнистые холмы, каменистые пастбища и редкие рощи. Пыль тракта видна за мили. Здесь редко бывает тихо: скрип телег и далёкий лай псов.',
      features: 'Каменистые тропы; редкие овечьи загоны; туман по утрам.',
      tags: ['hills', 'road'],
    },
  });

  const town = await db.location.create({
    data: {
      campaignId: campaign.id,
      parentId: region.id,
      kind: 'settlement',
      name: 'Мельничный Брод',
      summary: 'Небольшой торговый посёлок у брода.',
      description:
        'Десяток домов вокруг деревянного моста. Мельница стучит с рассвета. Люди здесь привыкли к странникам, но не любят лишних вопросов.',
      features: 'Мост через мелкую речку; мельница; рыночная площадь.',
      tags: ['town', 'trade'],
    },
  });

  const inn = await db.location.create({
    data: {
      campaignId: campaign.id,
      parentId: town.id,
      kind: 'building',
      name: 'Таверна «Ржавый кубок»',
      summary: 'Единственная таверна в посёлке.',
      description:
        'Низкий зал с закопчёнными балками. На стойке — кружки и миска с солёными орехами. В углу тихо играют в кости.',
      features: 'Общий зал; комнаты наверху; погреб с бочками.',
      tags: ['inn', 'rest'],
    },
  });

  const forge = await db.location.create({
    data: {
      campaignId: campaign.id,
      parentId: town.id,
      kind: 'building',
      name: 'Кузница Брана',
      summary: 'Мастерская оружейника у площади.',
      description:
        'Жар печи, запах железа и угля. На стене висят клинки и наконечники. Бран редко улыбается, но работу знает.',
      features: 'Горн; наковальня; стойка с готовым оружием.',
      tags: ['shop', 'forge'],
    },
  });

  const road = await db.location.create({
    data: {
      campaignId: campaign.id,
      parentId: region.id,
      kind: 'wilderness',
      name: 'Старая дорога',
      summary: 'Пыльный тракт к востоку от посёлка.',
      description:
        'Утоптанная дорога между холмами. Колея от телег, придорожные камни с выцветшими рунами. Ночью здесь слышен вой.',
      features: 'Придорожный камень-указатель; редкие кусты; следы зверей.',
      tags: ['road', 'travel'],
    },
  });

  await db.locationLink.create({
    data: {
      campaignId: campaign.id,
      fromId: town.id,
      toId: road.id,
      days: 1,
      label: 'Восточные ворота',
    },
  });

  const player = await db.player.create({
    data: {
      id: SEED_PLAYER_ID,
      campaignId: campaign.id,
      locationId: inn.id,
      name: 'Элара Ветрогон',
      species: 'Human',
      className: 'Fighter',
      subclass: null,
      background: 'Soldier',
      level: 1,
      xp: 0,
      alignment: 'Neutral Good',
      str: 15,
      dex: 14,
      con: 13,
      int: 10,
      wis: 12,
      cha: 8,
      hpMax: 12,
      hpCurrent: 12,
      hitDie: 'd10',
      hitDiceLeft: 1,
      ac: 14,
      speed: 30,
      proficiencyBonus: 2,
      armorProf: ['light', 'medium', 'heavy', 'shields'],
      weaponProf: ['simple', 'martial'],
      toolProf: [],
      languages: ['Common'],
      skillProf: ['Athletics', 'Intimidation'],
      skillExpertise: [],
      saveProf: ['str', 'con'],
      coinsCp: 1500,
      notes: 'Стартовый персонаж для локальной разработки.',
    },
  });

  const innkeeper = await db.npc.create({
    data: {
      campaignId: campaign.id,
      name: 'Марта Хмельная',
      title: 'Хозяйка таверны',
      appearance: 'Полная женщина средних лет с седой прядью и фартуком в пятнах эля.',
      personality: 'Прямолинейная, заботливая к постояльцам, не терпит драк в зале.',
      speech: 'Говорит коротко, с местным акцентом; часто вздыхает «ну вот опять».',
      habits: 'Протирает кружки даже когда они чистые; слушает сплетни у стойки.',
      attitude: 'Дружелюбна к тем, кто платит и не шумит.',
      dmNotes: 'Знает о крысах в погребе и может дать квест.',
      coinsCp: 800,
      locations: {
        create: [{ locationId: inn.id, role: 'keeper', isPrimary: true }],
      },
    },
  });

  const smith = await db.npc.create({
    data: {
      campaignId: campaign.id,
      name: 'Бран Углерук',
      title: 'Оружейник',
      appearance: 'Кряжистый человек с ожогами на руках и короткой чёрной бородой.',
      personality: 'Молчаливый перфекционист; ценит честную плату и хорошую сталь.',
      speech: 'Говорит низким голосом, почти без лишних слов.',
      habits: 'Стучит молотом в такт разговору; проверяет кромку пальцем.',
      attitude: 'Нейтрален, пока не заговорят о работе.',
      dmNotes: 'Торговец оружия (weaponsmith).',
      coinsCp: 5000,
      shopSpecialtyKey: 'weaponsmith',
      locations: {
        create: [{ locationId: forge.id, role: 'smith', isPrimary: true }],
      },
    },
  });

  await db.npcKnowledge.create({
    data: {
      npcId: innkeeper.id,
      title: 'Крысы в погребе',
      content:
        'В погребе таверны завёлся выводок крыс. Марта платит 5 зм тому, кто разберётся — тихо, без пожара.',
      reveal: 'open',
    },
  });

  await db.npcKnowledge.create({
    data: {
      npcId: smith.id,
      title: 'Странный клинок',
      content:
        'Неделю назад через Брод проезжал купец с запечатанным ящиком. Говорил, что везёт «не для продажи». На восточной дороге его телега пропала.',
      reveal: 'check',
      skillHint: 'Persuasion',
      dc: 12,
    },
  });

  const quest = await db.quest.create({
    data: {
      campaignId: campaign.id,
      locationId: inn.id,
      title: 'Крысы в погребе',
      description:
        'Марта Хмельная просит очистить погреб «Ржавого кубка» от крыс. Награда — 5 зм и бесплатная ночёвка.',
      status: 'available',
      npcs: {
        create: [{ npcId: innkeeper.id, role: 'giver' }],
      },
    },
  });

  await db.item.createMany({
    data: [
      {
        campaignId: campaign.id,
        playerId: player.id,
        name: 'Длинный меч',
        kind: 'weapon',
        description: 'Одноручное оружие ближнего боя.',
        weight: 3,
        valueCp: 1500,
        catalogKey: 'longsword',
        equipSlot: 'mainHand',
        quantity: 1,
      },
      {
        campaignId: campaign.id,
        playerId: player.id,
        name: 'Кожаный доспех',
        kind: 'armor',
        description: 'Лёгкий доспех из прочной кожи.',
        weight: 10,
        valueCp: 1000,
        catalogKey: 'leatherArmor',
        equipSlot: 'armor',
        quantity: 1,
      },
      {
        campaignId: campaign.id,
        playerId: player.id,
        name: 'Зелье лечения',
        kind: 'consumable',
        description: 'Восстанавливает 2d4+2 хитов.',
        weight: 0.5,
        valueCp: 5000,
        catalogKey: 'potionOfHealing',
        quantity: 1,
      },
      {
        campaignId: campaign.id,
        npcId: smith.id,
        name: 'Кинжал',
        kind: 'weapon',
        description: 'Лёгкое фехтовальное оружие.',
        weight: 1,
        valueCp: 200,
        catalogKey: 'dagger',
        quantity: 3,
      },
      {
        campaignId: campaign.id,
        locationId: inn.id,
        name: 'Факел',
        kind: 'gear',
        description: 'Горит около часа.',
        weight: 1,
        valueCp: 1,
        catalogKey: 'torch',
        quantity: 2,
      },
    ],
  });

  console.log('Seed готов:');
  console.log(`  campaignId: ${campaign.id}`);
  console.log(`  playerId:   ${player.id} (${player.name} @ ${inn.name})`);
  console.log(`  questId:    ${quest.id} (${quest.title})`);
  console.log(`  npc:        ${innkeeper.name}, ${smith.name}`);
  console.log(`  locations:  ${region.name} → ${town.name} → [${inn.name}, ${forge.name}], ${road.name}`);
  console.log('  DND_UI .env:');
  console.log(`    NEXT_PUBLIC_COMPANY_ID=${campaign.id}`);
  console.log(`    NEXT_PUBLIC_PLAYER_ID=${player.id}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

import { paths } from './paths';
import { schemas } from './schemas';

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'DnD API',
    version: '0.1.0',
    description: 'HTTP API кампании (Route Handlers в app/api).',
  },
  tags: [
    { name: 'Campaigns' },
    { name: 'Location' },
    { name: 'Items' },
    { name: 'Players' },
    { name: 'Npcs' },
    { name: 'NpcKnowledge' },
    { name: 'NpcRelation' },
    { name: 'NpcMemory' },
    { name: 'Quests' },
    { name: 'MonsterTemplates' },
    { name: 'DiceRolls' },
    { name: 'Coins' },
    { name: 'NpcChat' },
  ],
  paths,
  components: {
    schemas,
  },
};

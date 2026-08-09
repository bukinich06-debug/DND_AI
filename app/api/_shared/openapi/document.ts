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
    { name: 'Locations' },
    { name: 'Items' },
    { name: 'Players' },
    { name: 'Npcs' },
    { name: 'NpcKnowledge' },
    { name: 'Quests' },
    { name: 'MonsterTemplates' },
    { name: 'DiceRolls' },
  ],
  paths,
  components: {
    schemas,
  },
};

import { lookCast } from '@/domain/location';
import type { IWorldContext } from './loadWorldContext';

const peopleRules = `В look попадают только люди из npcsHere: имя или роль и одно живое занятие (из title / role / habits), не биография. Каждого из списка вплети. Если npcsHere пуст — никого не выдумывай: ни бармена, ни хозяина, ни «человека у стойки».`;

const placesRules = `Не называй людей из npcsHere. Вплети children (имя/теги) звуком и взглядом: рынок гудит, из таверны шум, дым кузни. Массовка без имён ок (стража, грузчики). Если children пуст — толпа и сенсорика; не выдумывай именные здания, либо 1–3 якоря-места если снимок совсем пустой.`;

export const buildWorldPrompt = (ctx: IWorldContext) => {
  const cast = lookCast(ctx.location.kind);
  const snapshot = {
    cast,
    current: {
      name: ctx.location.name,
      kind: ctx.location.kind,
      tags: ctx.location.tags,
      summary: ctx.location.summary,
      description: ctx.location.description,
      features: ctx.location.features,
    },
    parent: ctx.parent,
    children: ctx.children,
    npcsHere: ctx.npcsHere,
  };

  const focus = cast === 'people' ? peopleRules : placesRules;

  return `Ты описываешь место мира D&D: игрок ${ctx.player.name} осматривается. Ты не ассистент и не ИИ.

Напиши короткий look: 4–8 предложений. Сенсорика (вид, звук, запах, свет, температура). Без списков, markdown и фраз вроде «вы видите». Не выдумывай секреты, сюжет и людей, которых нет в npcsHere. Не пропускай людей или детей из снимка: каждый — придаточное, не абзац.

${focus}

Опирайся ТОЛЬКО на JSON ниже.

## Снимок
${JSON.stringify(snapshot, null, 2)}

## Формат ответа
Верни ТОЛЬКО один JSON-объект без текста вокруг:
{"look":"..."}`;
};

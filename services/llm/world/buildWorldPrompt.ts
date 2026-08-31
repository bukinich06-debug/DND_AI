import { lookCast } from '@/domain/location';
import type { IWorldContext } from './loadWorldContext';

const peopleRules = `В look попадают только люди из npcsHere: имя или роль и одно живое занятие (из title / role / habits), не биография. Каждого из списка вплети. Если npcsHere пуст — никого не выдумывай: ни бармена, ни хозяина, ни «человека у стойки».`;

const placesRules = `Не называй людей из npcsHere. Вплети children (имя/теги) звуком и взглядом: рынок гудит, из таверны шум, дым кузни. Массовка без имён ок (стража, грузчики). Если children пуст — толпа и сенсорика; не выдумывай именные здания, либо 1–3 якоря-места если снимок совсем пустой.`;

export const buildWorldPrompt = (ctx: IWorldContext) => {
  const lookAt = ctx.location;
  const samePlace = ctx.playerHere.id === lookAt.id;
  const cast = lookCast(lookAt.kind);
  const snapshot = {
    cast,
    playerId: ctx.player.id,
    playerHere: ctx.playerHere,
    lookAt: {
      id: lookAt.id,
      name: lookAt.name,
      kind: lookAt.kind,
      tags: lookAt.tags,
      summary: lookAt.summary,
      description: lookAt.description,
      features: lookAt.features,
    },
    parent: ctx.parent,
    children: ctx.children,
    npcsHere: ctx.npcsHere,
    samePlace,
  };

  const focus = cast === 'people' ? peopleRules : placesRules;

  return `Ты описываешь место мира D&D: игрок ${ctx.player.name}. Ты не ассистент и не ИИ.

Снимок: playerHere — где игрок СЕЙЧАС; lookAt — что описываешь. samePlace=${samePlace}.

## move_player — жёсткие правила
Сначала реши tool. Потом один JSON {"look":"..."}. Других tools нет.

Вызови move_player РОВНО ОДИН РАЗ, args: playerId из снимка, locationId = lookAt.id — тогда и только тогда, когда ВСЁ верно:
1) playerHere.id ≠ lookAt.id
2) по реплике игрока персонаж ОКАЗЫВАЕТСЯ ВНУТРИ lookAt

MUST tool (вход/занятость lookAt): захожу, вхожу, вхожу внутрь, выхожу (lookAt = куда выходит, обычно parent), перехожу в, оказываюсь в, поднимаюсь в, спускаюсь в — и цель = lookAt.

MUST NOT tool (запрет, даже если lookAt другое место):
- samePlace === true
- вокруг, рядом, около, мимо, снаружи, к двери, к зданию, заглянуть, в окно, выглянуть, осмотреться, осматриваюсь, подойти к, посмотреть на
- нет явного входа внутрь lookAt
- сомнение: НЕ вызывай (ложный переезд хуже пропуска)

## look
4–8 предложений. Сенсорика. Без списков, markdown и «вы видите». Не выдумывай секреты, сюжет и людей вне npcsHere. Каждый из снимка — придаточное.

Если tool вызван — персонаж УЖЕ внутри lookAt: интерьер.
Если tool НЕ вызван и samePlace === false — с позиции playerHere СНАРУЖИ lookAt: фасад, окружение. Не пиши интерьер и не пиши «ты внутри».
Если samePlace — осмотр здесь, без переезда.

${focus}

Опирайся ТОЛЬКО на JSON ниже.

## Снимок
${JSON.stringify(snapshot, null, 2)}

## Формат ответа
Верни ТОЛЬКО один JSON-объект без текста вокруг:
{"look":"..."}`;
};

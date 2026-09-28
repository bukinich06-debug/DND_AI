import type { IMonsterCombatContext } from './loadMonsterCombatContext';

const calculateAbilityMod = (score: number): number => Math.floor((score - 10) / 2);

const normalizeToArray = <T>(value: T[] | null | undefined | object): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [];
};

const formatParticipants = (ctx: IMonsterCombatContext) => {
  if (ctx.participants.length === 0) return 'Нет других участников.';
  return ctx.participants
    .map((p) => {
      const hpText = p.hp !== null ? `, HP: ${p.hp}` : '';
      const outText = p.isOut ? ' [ВЫБЫЛ]' : '';
      const distance = Math.abs(p.positionFeet - (ctx.monster.positionFeet ?? 0));
      const direction =
        p.positionFeet > (ctx.monster.positionFeet ?? 0)
          ? 'впереди'
          : p.positionFeet < (ctx.monster.positionFeet ?? 0)
            ? 'позади'
            : 'на месте';
      const distanceText = `, позиция: ${p.positionFeet} фт (${direction}, дистанция: ${distance} фт)`;
      return `- ${p.name} (id: ${p.id}, ${p.kind}, инициатива: ${p.initiative}, порядок: ${p.order}${hpText}${distanceText})${outText}`;
    })
    .join('\n');
};

const formatActions = (ctx: IMonsterCombatContext) => {
  const actions = normalizeToArray(ctx.monster.actions);
  if (actions.length === 0) {
    return 'Действия из справочника отсутствуют. Используй простую рукопашную атаку (1d6 + модификатор характеристики).';
  }

  return actions
    .map((a) => {
      const bonus = a.attackBonus !== undefined ? `, бонус атаки: +${a.attackBonus}` : '';
      const damage = a.damage ? `, урон: ${a.damage}` : '';
      const damageType = a.damageType ? ` ${a.damageType}` : '';
      return `- ${a.name}: ${a.description}${bonus}${damage}${damageType}`;
    })
    .join('\n');
};

const formatTraits = (ctx: IMonsterCombatContext) => {
  const traits = normalizeToArray(ctx.monster.traits);
  if (traits.length === 0) return 'Нет особых черт.';
  return traits.map((t) => `- ${t.name}: ${t.description}`).join('\n');
};

export const buildMonsterPrompt = (ctx: IMonsterCombatContext) => {
  const strMod = calculateAbilityMod(ctx.monster.str);
  const dexMod = calculateAbilityMod(ctx.monster.dex);
  const conMod = calculateAbilityMod(ctx.monster.con);
  const intMod = calculateAbilityMod(ctx.monster.int);
  const wisMod = calculateAbilityMod(ctx.monster.wis);
  const chaMod = calculateAbilityMod(ctx.monster.cha);

  const actionStatus = ctx.monster.actionUsed ? 'использовано' : 'доступно';
  const bonusActionStatus = ctx.monster.bonusActionUsed ? 'использовано' : 'доступно';
  const reactionStatus = ctx.monster.reactionUsed ? 'использована' : 'доступна';
  const movementStatus = `${ctx.monster.movementLeftFeet} из ${ctx.monster.speed} фт`;

  return `Ты — ${ctx.monster.name}, существо в боевой сцене D&D. Ты не ассистент и не ИИ — ты монстр, который действует инстинктивно в бою. Твоя задача — выбрать одно боевое действие на этот ход.

## Твои характеристики
Имя: ${ctx.monster.name}
Ключ справочника: ${ctx.monster.catalogKey}
HP: ${ctx.monster.hpCurrent} / ${ctx.monster.hpMax}
AC: ${ctx.monster.ac}
Скорость: ${ctx.monster.speed}

Характеристики:
- Сила (STR): ${ctx.monster.str} (модификатор: ${strMod >= 0 ? '+' : ''}${strMod})
- Ловкость (DEX): ${ctx.monster.dex} (модификатор: ${dexMod >= 0 ? '+' : ''}${dexMod})
- Телосложение (CON): ${ctx.monster.con} (модификатор: ${conMod >= 0 ? '+' : ''}${conMod})
- Интеллект (INT): ${ctx.monster.int} (модификатор: ${intMod >= 0 ? '+' : ''}${intMod})
- Мудрость (WIS): ${ctx.monster.wis} (модификатор: ${wisMod >= 0 ? '+' : ''}${wisMod})
- Харизма (CHA): ${ctx.monster.cha} (модификатор: ${chaMod >= 0 ? '+' : ''}${chaMod})

## Экономия действий (текущий ход)
- Основное действие: ${actionStatus}
- Бонусное действие: ${bonusActionStatus}
- Реакция: ${reactionStatus}
- Движение: ${movementStatus}

## Доступные действия (атаки)
${formatActions(ctx)}

## Черты и способности
${formatTraits(ctx)}

## Боевая сцена
Раунд: ${ctx.encounter.round}
Текущий индекс хода: ${ctx.encounter.currentTurnIndex}

## Участники боя (снимок)
${formatParticipants(ctx)}

## Инструкции
1. **Отвечай ТОЛЬКО на русском языке** — все твои ответы, включая поля say и do, должны быть на русском языке в кириллице.
2. **Проверь экономию действий**:
   - Если основное действие уже использовано — НЕ атакуй повторно. Пропусти ход или используй другое действие.
   - Если движение исчерпано — НЕ вызывай move_in_combat.
3. **Выбери одно боевое действие** на этот ход: атака, использование способности, перемещение.
4. **Не сочиняй HP, AC или броски** — используй tools для получения информации и разрешения действий.
5. **Дистанция имеет значение**:
   - **Рукопашные атаки** (меч, когти, укус) работают только на расстоянии **≤5 футов**.
   - **Дальнобойные атаки** (лук, арбалет) работают на большей дистанции (см. описание атаки).
   - Твоя **скорость: ${ctx.monster.speed} футов** — используй move_in_combat (action='approach'/'retreat'/'move_away') для перемещения, если цель слишком далеко.
6. **Для атаки используй resolve_monster_attack** — он автоматически проверит дистанцию, сделает бросок атаки d20, проверит попадание по AC цели, бросит урон и применит его к HP цели. Максимум ОДНА атака за ход.
7. **Передай targetParticipantId точно из списка участников** — используй id из списка выше (например, если участник указан как «id: abc123», передай targetParticipantId: "abc123").
8. **Если хочешь атаковать конкретной атакой из «Доступные действия»** — передай attackName (название действия из списка выше) в resolve_monster_attack. Все параметры атаки (урон, бонус, дальность) будут взяты из каталога монстра автоматически.
9. **Если действия из справочника пусты** — используй простую рукопашную атаку без attackName: resolve_monster_attack автоматически применит d20 + максимальный модификатор из STR/DEX против AC цели, урон 1d6 + тот же модификатор.
10. **Не описывай свой ход как Мастер** — ты монстр, а не рассказчик. Короткие фразы или рык достаточно.
11. **Не выдумывай результаты действий** — tools вернут результат после выполнения.
12. **list_combat_targets** — используй, чтобы увидеть актуальные цели с расстоянием до тебя (livingOnly=true покажет только живых). encounterId автоматически берётся из контекста.
13. **get_self_combat_stats** — если нужно уточнить свои характеристики или действия перед выбором.
14. **move_in_combat** — двигает монстра по линии боя: action='approach' (приближается к цели, останавливается в 5 фт), 'retreat'/'move_away' (отходит от цели или ближайшего противника). Параметр feet задаёт количество футов. Можешь двигаться и атаковать в один ход, но общее движение ≤ остатка. monsterInstanceId и encounterId автоматически берутся из контекста.
15. **roll_dice** — для проверок характеристик или других бросков (не для атак — используй resolve_monster_attack).

## Формат финального ответа
После нужных tool-вызовов верни ТОЛЬКО один JSON-объект без текста вокруг:
{"say":"короткая фраза или рык","do":"краткое действие"}
или
{"say":"","do":null}

Поле say — короткая фраза или звук на русском языке в кириллице (например, «Кри!», «Гррр!», «Умри!»). Поле do — краткое описание действия на русском языке (например, "атакует ближайшую цель", "использует когти").

Не описывай результат действия в say или do — tools вернут результат, и система сама сообщит игрокам о попадании/промахе/уроне.`;
};

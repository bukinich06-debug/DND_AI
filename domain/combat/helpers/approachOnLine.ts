interface IApproachOnLineInput {
  from: number;
  target: number;
  maxFeet: number;
}

export const approachOnLine = ({ from, target, maxFeet }: IApproachOnLineInput) => {
  const distance = Math.abs(target - from);
  const maxMoveToStop = Math.max(0, distance - 5);
  const movedFeet = Math.min(Math.max(0, maxFeet), maxMoveToStop);
  const direction = target === from ? 0 : target > from ? 1 : -1;
  const positionAfter = from + direction * movedFeet;
  return {
    movedFeet,
    positionAfter,
    distanceAfter: Math.abs(positionAfter - target),
    distanceBefore: distance,
  };
};

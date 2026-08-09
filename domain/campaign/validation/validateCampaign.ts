import type { ICreateCampaign, IUpdateCampaign } from '../types';

export const validateCreateCampaign = (input: ICreateCampaign) => {
  if (!input.name.trim()) throw new Error('Название кампании обязательно.');
};

export const validateUpdateCampaign = (input: IUpdateCampaign) => {
  if (input.name !== undefined && !input.name.trim()) throw new Error('Название кампании обязательно.');
};

'use server';

import { locationRepository } from '@/data/location';

export const listLocationChildren = async (parentId: string) => locationRepository.listChildren(parentId);

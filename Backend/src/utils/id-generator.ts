// ID Generator for PowerWorld Gyms
// Format: PWG-{LOCATION}-{TYPE}-{NANOID}
// Example: PWG-KBT-MEM-A1B2C

import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5);
const nanoidLong = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

const LOCATION_CODE = process.env.GYM_LOCATION_CODE || 'KBT';

export const generateId = {
  member:       () => `PWG-${LOCATION_CODE}-MEM-${nanoid()}`,
  trainer:      () => `PWG-${LOCATION_CODE}-TRN-${nanoid()}`,
  staff:        () => `PWG-${LOCATION_CODE}-STF-${nanoid()}`,
  subscription: () => `PWG-SUB-${nanoidLong()}`,
  payment:      () => `PWG-PAY-${nanoidLong()}`,
  equipment:    () => `PWG-EQP-${nanoid()}`,
  workout:      () => `PWG-WRK-${nanoid()}`,
  session:      () => `PWG-SES-${nanoid()}`,
  branch:       () => `PWG-BRN-${nanoid()}`,
  plan:         () => `PWG-PLN-${nanoid()}`,
  generic:      () => crypto.randomUUID(),
};

// Keep legacy named exports for backward compat
export const generateMemberId       = generateId.member;
export const generateTrainerId      = generateId.trainer;
export const generateStaffId        = generateId.staff;
export const generateSubscriptionId = generateId.subscription;
export const generatePaymentId      = generateId.payment;
export const generateEquipmentId    = generateId.equipment;
export const generateWorkoutId      = generateId.workout;


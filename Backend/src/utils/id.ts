import { nanoid, customAlphabet } from 'nanoid';

export function generateId(): string {
  return crypto.randomUUID();
}

const memberCodeGen = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export const ids = {
  uuid: generateId,
  memberCode: () => `PWG-KBG-${memberCodeGen()}`,
  qrSecret: () => nanoid(32),
  resetToken: () => nanoid(48),
};

import admin from 'firebase-admin';
import redis from '../utils/redis.js';

type Role = 'admin' | 'manager' | 'trainer' | 'member';

const USER_PUSH_PREFIX = 'gms:push:user:';
const ROLE_PUSH_PREFIX = 'gms:push:role:';

let appInitialized = false;

function ensureFirebaseApp() {
  if (appInitialized) return;
  if (admin.apps.length > 0) {
    appInitialized = true;
    return;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return;
  const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  appInitialized = true;
}

function userKey(userId: string) {
  return `${USER_PUSH_PREFIX}${userId}`;
}

function roleKey(role: Role) {
  return `${ROLE_PUSH_PREFIX}${role}`;
}

export async function registerPushToken(userId: string, role: Role, token: string) {
  const t = token.trim();
  if (!t) return { registered: false };
  const p = redis.pipeline();
  p.sadd(userKey(userId), t);
  p.sadd(roleKey(role), userId);
  p.expire(userKey(userId), 60 * 60 * 24 * 30);
  p.expire(roleKey(role), 60 * 60 * 24 * 30);
  await p.exec();
  return { registered: true };
}

export async function unregisterPushToken(userId: string, token: string) {
  const t = token.trim();
  if (!t) return { removed: false };
  await redis.srem(userKey(userId), t);
  return { removed: true };
}

export async function sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
  ensureFirebaseApp();
  if (!appInitialized) {
    return { sent: 0, failed: 0, reason: 'firebase_not_configured' };
  }
  const tokens = await redis.smembers(userKey(userId));
  if (tokens.length === 0) return { sent: 0, failed: 0, reason: 'no_tokens' };

  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));

  let sent = 0;
  let failed = 0;
  for (const chunk of chunks) {
    const res = await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: { title, body },
      data,
    });
    sent += res.successCount;
    failed += res.failureCount;
  }
  return { sent, failed };
}

export async function sendToRole(role: Role, title: string, body: string, data?: Record<string, string>) {
  const userIds = await redis.smembers(roleKey(role));
  let sent = 0;
  let failed = 0;
  for (const userId of userIds) {
    const res = await sendToUser(userId, title, body, data);
    sent += res.sent;
    failed += res.failed;
  }
  return { sent, failed, userCount: userIds.length };
}

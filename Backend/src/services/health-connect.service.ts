// Health Connect Service — Phase 3
// Google Health Connect integration: OAuth flow, data sync, conflict resolution
// Uses a simulation adapter since actual Google Fitness API requires real credentials
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { memberMetrics, members, users } from '../db/schema';
import { randomUUID } from 'crypto';
import { VitalsService } from './vitals.service';

// In production, this would store Google OAuth tokens in a dedicated table.
// For demo/simulation, we store connection status in-memory.
const healthConnectSessions = new Map<string, {
  userId: string;
  memberId: string;
  connected: boolean;
  lastSyncAt: Date | null;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
}>();

export class HealthConnectService {
  /**
   * Initiate OAuth flow — returns a simulated authorization URL.
   * In production, this would redirect to Google's OAuth consent screen.
   */
  static async initiateOAuth(userId: string, memberId: string) {
    const state = randomUUID();
    // Simulate storing the pending OAuth state
    healthConnectSessions.set(state, {
      userId,
      memberId,
      connected: false,
      lastSyncAt: null,
      accessToken: '',
      refreshToken: '',
      tokenExpiresAt: new Date(),
    });

    // Simulated Google OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=SIMULATED&redirect_uri=${encodeURIComponent('http://localhost:3000/api/health-connect/callback')}&scope=https://www.googleapis.com/auth/fitness.activity.read+https://www.googleapis.com/auth/fitness.body.read&state=${state}&response_type=code&access_type=offline`;

    return { authUrl, state };
  }

  /**
   * Handle OAuth callback — simulates token exchange.
   * In production, exchanges auth code for access/refresh tokens.
   */
  static async handleCallback(state: string, code: string) {
    const session = healthConnectSessions.get(state);
    if (!session) throw new Error('Invalid OAuth state — session not found');

    // Simulate token exchange
    session.connected = true;
    session.accessToken = `sim_access_${randomUUID().slice(0, 8)}`;
    session.refreshToken = `sim_refresh_${randomUUID().slice(0, 8)}`;
    session.tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
    healthConnectSessions.set(session.userId, session);
    healthConnectSessions.delete(state);

    return { connected: true, userId: session.userId };
  }

  /** Check if a user has Health Connect linked */
  static async getConnectionStatus(userId: string) {
    const session = healthConnectSessions.get(userId);
    return {
      connected: session?.connected ?? false,
      lastSyncAt: session?.lastSyncAt?.toISOString() ?? null,
    };
  }

  /** Disconnect Health Connect */
  static async disconnect(userId: string) {
    healthConnectSessions.delete(userId);
    return { disconnected: true };
  }

  /**
   * Sync data from Health Connect — pulls latest vitals.
   * In production, this calls Google Fitness REST API.
   * For simulation, generates realistic data.
   */
  static async syncData(userId: string) {
    const session = healthConnectSessions.get(userId);
    if (!session?.connected) {
      throw new Error('Health Connect not connected. Please link your account first.');
    }

    // Look up member
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);
    if (!member) throw new Error('Member profile not found');

    // Simulate fetching data from Google Fitness API
    const simulatedData = this.generateSimulatedHealthData();

    // Use conflict resolution — only update if newer than last recorded
    const latest = await VitalsService.getLatestVitals(member.id);
    const shouldUpdate = !latest || this.isDataNewer(simulatedData, latest);

    if (shouldUpdate) {
      await VitalsService.recordVitals({
        memberId: member.id,
        weight: simulatedData.weight,
        height: simulatedData.height,
        restingHeartRate: simulatedData.heartRate,
        bodyFatPercentage: simulatedData.bodyFatPercentage,
        source: 'health_connect',
        notes: `Auto-synced from Google Health Connect at ${new Date().toISOString()}. BP: ${simulatedData.bloodPressureSystolic}/${simulatedData.bloodPressureDiastolic}`,
      });
    }

    session.lastSyncAt = new Date();
    healthConnectSessions.set(userId, session);

    return {
      synced: shouldUpdate,
      data: simulatedData,
      lastSyncAt: session.lastSyncAt.toISOString(),
      message: shouldUpdate ? 'Vitals synced successfully' : 'Data is already up to date',
    };
  }

  /** Generate realistic simulated health data */
  private static generateSimulatedHealthData() {
    return {
      weight: Math.round((60 + Math.random() * 30) * 10) / 10, // 60-90 kg
      height: Math.round((155 + Math.random() * 30) * 10) / 10, // 155-185 cm
      heartRate: Math.round(60 + Math.random() * 40), // 60-100 bpm
      bloodPressureSystolic: Math.round(110 + Math.random() * 30), // 110-140
      bloodPressureDiastolic: Math.round(70 + Math.random() * 20), // 70-90
      bodyFatPercentage: Math.round((15 + Math.random() * 20) * 10) / 10, // 15-35%
      steps: Math.round(3000 + Math.random() * 12000), // 3k-15k steps
      caloriesBurned: Math.round(1500 + Math.random() * 1500), // 1500-3000 kcal
      sleepHours: Math.round((5 + Math.random() * 4) * 10) / 10, // 5-9 hours
      timestamp: new Date().toISOString(),
    };
  }

  /** Conflict resolution: check if new data is meaningfully newer */
  private static isDataNewer(newData: any, existing: any): boolean {
    if (!existing) return true;
    // If the existing record is more than 4 hours old, accept new data
    const existingTime = new Date(existing.recordedAt || existing.createdAt || 0).getTime();
    return (Date.now() - existingTime) > 4 * 60 * 60 * 1000;
  }

  /** Simulate a full day of Health Connect syncs (for demo) */
  static async simulateFullDaySync(userId: string) {
    // Auto-connect if not already
    if (!healthConnectSessions.has(userId)) {
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.userId, userId))
        .limit(1);
      if (member) {
        healthConnectSessions.set(userId, {
          userId,
          memberId: member.id,
          connected: true,
          lastSyncAt: null,
          accessToken: `sim_${randomUUID().slice(0, 8)}`,
          refreshToken: `sim_${randomUUID().slice(0, 8)}`,
          tokenExpiresAt: new Date(Date.now() + 86400 * 1000),
        });
      }
    }

    const results = [];
    // Simulate 3 sync events throughout the day
    for (let i = 0; i < 3; i++) {
      const result = await this.syncData(userId);
      results.push(result);
    }
    return { syncEvents: results.length, results };
  }
}

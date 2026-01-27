// Dashboard API Service
import { apiClient } from '../api';

export interface DashboardStats {
    totalMembers: number;
    activeNow: number;
    monthlyRevenue: number;
    conversionRate: number;
}

export interface RecentSignup {
    id: string;
    name: string;
    initials: string;
    avatarUrl: string | null;
    planName: string;
    timeAgo: string;
}

export interface MemberStats {
    membershipStatus: string;
    planName: string;
    daysRemaining: number;
    checkInsThisMonth: number;
}

export const dashboardService = {
    // For staff/admin dashboard
    getStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get<{ data: DashboardStats }>('/dashboard/stats');
        return response.data.data;
    },

    getRecentSignups: async (): Promise<RecentSignup[]> => {
        const response = await apiClient.get<{ data: RecentSignup[] }>('/dashboard/recent-signups');
        return response.data.data;
    },

    // For member dashboard
    getMemberStats: async (): Promise<MemberStats> => {
        const response = await apiClient.get<{ data: MemberStats }>('/dashboard/member-stats');
        return response.data.data;
    }
};

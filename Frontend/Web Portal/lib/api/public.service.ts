import api from '../api';

export interface Plan {
    id: string;
    name: string;
    price: string;
    durationDays: number;
    features: string | any;
}

export interface Branch {
    id: string;
    name: string;
    code: string;
}

export interface Stats {
    activeMembers: number;
    locations: number;
    expertTrainers: number;
    classesWeekly: number;
}

export interface Trainer {
    id: string;
    name: string;
    specialization: string;
    bio: string;
    rating: number;
    avatarUrl: string;
}

export interface ClassType {
    id: string;
    name: string;
    type: string;
}

export const publicService = {
    getSubscriptionPlans: async () => {
        const response = await api.get<{ data: Plan[] }>('/public/plans');
        return response.data.data;
    },

    getBranches: async () => {
        const response = await api.get<{ data: Branch[] }>('/public/branches');
        return response.data.data;
    },

    getStats: async () => {
        const response = await api.get<{ data: Stats }>('/public/stats');
        return response.data.data;
    },

    getFeaturedTrainers: async () => {
        const response = await api.get<{ data: Trainer[] }>('/public/trainers');
        return response.data.data;
    },

    getClasses: async () => {
        const response = await api.get<{ data: ClassType[] }>('/public/classes');
        return response.data.data;
    }
};

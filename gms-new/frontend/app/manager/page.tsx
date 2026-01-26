'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { memberAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './manager.css';

export default function ManagerDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (!user || user.role !== 'MANAGER') {
            router.push('/login');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            const response = await memberAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner-large"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="manager-page">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <span className="brand-icon">💼</span>
                    <span className="brand-name">Manager Portal</span>
                </div>
                <div className="nav-links">
                    <Link href="/manager" className="nav-link active">Dashboard</Link>
                    <Link href="/manager/members" className="nav-link">Members</Link>
                    <Link href="/manager/reports" className="nav-link">Reports</Link>
                    <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
                </div>
            </nav>

            <div className="manager-container container">
                <div className="dashboard-header">
                    <div>
                        <h1>Business Overview 📊</h1>
                        <p>Real-time insights for PowerWorld Gyms</p>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card card-glass">
                        <div className="stat-header">
                            <span className="stat-icon">👥</span>
                            <h3>Total Members</h3>
                        </div>
                        <p className="stat-value">{stats?.total || 0}</p>
                        <p className="stat-change positive">+12% this month</p>
                    </div>

                    <div className="stat-card card-glass">
                        <div className="stat-header">
                            <span className="stat-icon">✅</span>
                            <h3>Active Members</h3>
                        </div>
                        <p className="stat-value">{stats?.active || 0}</p>
                        <p className="stat-label">{((stats?.active / stats?.total) * 100).toFixed(1)}% of total</p>
                    </div>

                    <div className="stat-card card-glass">
                        <div className="stat-header">
                            <span className="stat-icon">🏃</span>
                            <h3>Today's Check-ins</h3>
                        </div>
                        <p className="stat-value">{stats?.checkedInToday || 0}</p>
                        <p className="stat-label">Real-time attendance</p>
                    </div>

                    <div className="stat-card card-glass">
                        <div className="stat-header">
                            <span className="stat-icon">💰</span>
                            <h3>Revenue (Est.)</h3>
                        </div>
                        <p className="stat-value">Rs. {((stats?.active || 0) * 3500).toLocaleString()}</p>
                        <p className="stat-label">Monthly recurring</p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="card-glass chart-card">
                        <h3>Quick Actions</h3>
                        <div className="action-buttons">
                            <Link href="/manager/members" className="action-btn">
                                <span className="action-icon">👥</span>
                                <div>
                                    <h4>View All Members</h4>
                                    <p>Manage member database</p>
                                </div>
                            </Link>
                            <Link href="/manager/reports" className="action-btn">
                                <span className="action-icon">📊</span>
                                <div>
                                    <h4>Generate Report</h4>
                                    <p>Revenue & attendance</p>
                                </div>
                            </Link>
                            <Link href="/manager/subscriptions" className="action-btn">
                                <span className="action-icon">💳</span>
                                <div>
                                    <h4>Subscriptions</h4>
                                    <p>Track renewals</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="card-glass">
                        <h3>Member Status Breakdown</h3>
                        <div className="status-breakdown">
                            <div className="status-item">
                                <div className="status-bar">
                                    <div
                                        className="status-fill success"
                                        style={{ width: `${(stats?.active / stats?.total) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="status-info">
                                    <span className="status-label">Active</span>
                                    <span className="status-count">{stats?.active || 0}</span>
                                </div>
                            </div>
                            <div className="status-item">
                                <div className="status-bar">
                                    <div
                                        className="status-fill warning"
                                        style={{ width: `${(stats?.inactive / stats?.total) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="status-info">
                                    <span className="status-label">Inactive</span>
                                    <span className="status-count">{stats?.inactive || 0}</span>
                                </div>
                            </div>
                            <div className="status-item">
                                <div className="status-bar">
                                    <div
                                        className="status-fill error"
                                        style={{ width: `${(stats?.suspended / stats?.total) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="status-info">
                                    <span className="status-label">Suspended</span>
                                    <span className="status-count">{stats?.suspended || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionAPI, memberAPI, qrAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './dashboard.css';

export default function MemberDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);
    const [stats, setStats] = useState<any>({});
    const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

    useEffect(() => {
        if (!user || user.role !== 'member') {
            router.push('/login');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            const [subRes, attendanceRes] = await Promise.all([
                subscriptionAPI.getActive(),
                qrAPI.getAttendanceHistory(10)
            ]);

            setSubscription(subRes.data.data);
            setRecentAttendance(attendanceRes.data.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner-large"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    const getStatusBadge = () => {
        if (!subscription) return <span className="badge badge-error">No Active Subscription</span>;

        const daysLeft = Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) return <span className="badge badge-error">Expired</span>;
        if (daysLeft < 7) return <span className="badge badge-warning">Expires Soon</span>;
        return <span className="badge badge-success">Active</span>;
    };

    return (
        <div className="dashboard-page">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <span className="brand-icon">💪</span>
                    <span className="brand-name">PowerWorld</span>
                </div>
                <div className="nav-links">
                    <Link href="/member" className="nav-link active">Dashboard</Link>
                    <Link href="/member/qr-code" className="nav-link">My QR Code</Link>
                    <Link href="/member/profile" className="nav-link">Profile</Link>
                    <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
                </div>
            </nav>

            <div className="dashboard-container container">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome back, {user?.name}! 👋</h1>
                        <p>Here's your fitness overview</p>
                    </div>
                    {getStatusBadge()}
                </div>

                <div className="dashboard-grid">
                    {/* Subscription Card */}
                    <div className="card-glass stat-card">
                        <div className="stat-icon">💳</div>
                        <div className="stat-content">
                            <h3>Subscription</h3>
                            {subscription ? (
                                <>
                                    <p className="stat-value">{subscription.plan.planName}</p>
                                    <p className="stat-label">
                                        Expires: {new Date(subscription.endDate).toLocaleDateString()}
                                    </p>
                                    <Link href="/member/subscription" className="btn btn-primary btn-sm mt-auto">
                                        Manage
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="stat-value">No Active Plan</p>
                                    <Link href="/member/subscription" className="btn btn-secondary btn-sm mt-auto">
                                        Subscribe Now
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* QR Code Quick Access */}
                    <div className="card-glass stat-card">
                        <div className="stat-icon">📱</div>
                        <div className="stat-content">
                            <h3>QR Code</h3>
                            <p className="stat-value">Ready to Scan</p>
                            <p className="stat-label">Use for gym access</p>
                            <Link href="/member/qr-code" className="btn btn-primary btn-sm mt-auto">
                                View QR Code
                            </Link>
                        </div>
                    </div>

                    {/* Attendance Stats */}
                    <div className="card-glass stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <h3>This Month</h3>
                            <p className="stat-value">{recentAttendance.filter(a => a.eventType === 'IN').length} visits</p>
                            <p className="stat-label">Keep it up!</p>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card-glass activity-card">
                        <h3>Recent Activity</h3>
                        {recentAttendance.length > 0 ? (
                            <div className="activity-list">
                                {recentAttendance.slice(0, 5).map((attendance: any) => (
                                    <div key={attendance.attendanceId} className="activity-item">
                                        <span className={`activity-icon ${attendance.eventType === 'IN' ? 'in' : 'out'}`}>
                                            {attendance.eventType === 'IN' ? '→' : '←'}
                                        </span>
                                        <div className="activity-details">
                                            <p className="activity-type">
                                                {attendance.eventType === 'IN' ? 'Checked In' : 'Checked Out'}
                                            </p>
                                            <p className="activity-time">
                                                {new Date(attendance.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-secondary">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

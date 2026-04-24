import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, History, Clock, Star, Calendar } from 'lucide-react';

const Dashboard = () => {
    const [sessions, setSessions] = useState([]);
    const [highScore, setHighScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [sessionsRes, highScoreRes] = await Promise.all([
                    axios.get('/api/sessions', config),
                    axios.get('/api/sessions/high-score', config)
                ]);
                setSessions(sessionsRes.data);
                setHighScore(highScoreRes.data.highScore);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading stats...</div>;

    return (
        <div className="flex flex-col gap-8 py-8">
            <div className="glass p-8 flex items-center justify-between bg-gradient-to-r from-primary/20 to-accent/10">
                <div className="flex items-center gap-6">
                    <div className="bg-yellow-400 p-4 rounded-2xl shadow-lg shadow-yellow-400/20">
                        <Trophy size={48} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold">Personal Best</h1>
                        <p className="text-text-muted">Your highest score across all sessions</p>
                    </div>
                </div>
                <div className="text-6xl font-bold text-yellow-400">{highScore}</div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2">
                    <History className="text-primary" />
                    <h2 className="text-2xl font-bold">Session History</h2>
                </div>

                <div className="grid gap-4">
                    {sessions.length === 0 ? (
                        <div className="glass p-12 text-center text-text-muted">
                            No sessions found. Start practicing to see your progress!
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="glass p-6 flex items-center justify-between hover:-translate-y-1 transition-transform cursor-pointer">
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-text-muted text-sm">
                                            <Calendar size={14} />
                                            {new Date(session.date).toLocaleDateString()}
                                        </div>
                                        <div className="text-lg font-semibold">
                                            {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-text-muted text-sm">
                                            <Clock size={14} />
                                            Duration
                                        </div>
                                        <div className="text-lg font-semibold">
                                            {Math.floor(session.duration/60)}:{(session.duration%60).toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1 text-text-muted text-sm">
                                            <Star size={14} className="text-yellow-400" />
                                            Final Score
                                        </div>
                                        <div className="text-3xl font-bold text-primary">{session.score}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

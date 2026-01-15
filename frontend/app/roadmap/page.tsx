'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import RoadmapView from '@/components/roadmap/RoadmapView';
import CreateRoadmap from '@/components/roadmap/CreateRoadmap';
import AICoach from '@/components/chat/AICoach';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoadmapPage() {
    const { token, setAuth } = useAuthStore();
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);

    // API Base URL
    const API_URL = 'http://127.0.0.1:8000/api';

    useEffect(() => {
        if (token) {
            fetchRoadmap();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchRoadmap = async () => {
        try {
            const res = await fetch(`${API_URL}/roadmap/my-roadmap`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRoadmap(data);
            } else if (res.status === 404) {
                setRoadmap(null);
            } else {
                console.error('Failed to fetch roadmap');
            }
        } catch (error) {
            console.error('Error fetching roadmap:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoadmap = async (careerPath: string) => {
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/roadmap/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ career_path: careerPath })
            });

            if (res.ok) {
                const data = await res.json();
                setRoadmap(data);
                toast.success('Roadmap created!');
            } else {
                toast.error('Failed to create roadmap');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error creating roadmap');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateProgress = async (stepNumber: number) => {
        if (!roadmap) return;
        setUpdating(true);
        try {
            const res = await fetch(`${API_URL}/roadmap/update-progress/${roadmap.id}?step_number=${stepNumber}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRoadmap({ ...roadmap, current_step: stepNumber, completion_percentage: data.completion_percentage });
                toast.success('Progress updated!');
            } else {
                toast.error('Failed to update progress');
            }
        } catch (error) {
            toast.error('Error updating progress');
        } finally {
            setUpdating(false);
        }
    };

    const handleDevLogin = async () => {
        const email = 'dev@trainpi.com';
        const password = 'password123';
        const toastId = toast.loading('Logging in...');

        try {
            // 1. Try Login
            let res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ username: email, password: password })
            });

            // 2. If 401, Register then Login
            if (res.status === 401) {
                toast.loading('Creating dev user...', { id: toastId });
                await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, full_name: 'Dev User' })
                });

                // Retry Login
                res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ username: email, password: password })
                });
            }

            if (res.ok) {
                const data = await res.json();
                setAuth({ id: 1, email, full_name: 'Dev User' }, data.access_token);
                toast.success('Logged in as Dev User', { id: toastId });
                window.location.reload();
            } else {
                toast.error('Login failed', { id: toastId });
            }
        } catch (error) {
            toast.error('Connection error. Is backend running?', { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-DEFAULT" size={32} />
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                    <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                    <p className="text-slate-600 mb-6">Please login to view your roadmap.</p>
                    <button
                        onClick={handleDevLogin}
                        className="w-full py-3 bg-brand-DEFAULT text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors"
                    >
                        Auto Login (Dev Mode)
                    </button>
                    <p className="mt-4 text-xs text-slate-400">Creates a test user 'dev@trainpi.com' automatically.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-light/30">
            {roadmap ? (
                <RoadmapView
                    roadmap={roadmap}
                    onUpdateProgress={handleUpdateProgress}
                    isUpdating={updating}
                />
            ) : (
                <CreateRoadmap
                    onSelect={handleCreateRoadmap}
                    isLoading={creating}
                />
            )}
            <AICoach />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { roadmapAPI, authAPI } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import RoadmapView from '../../components/roadmap/RoadmapView';
import CreateRoadmap from '../../components/roadmap/CreateRoadmap';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoadmapPage() {
    const { token, setAuth } = useAuthStore();
    const router = useRouter();
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (token) {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            fetchRoadmap(id ? Number(id) : undefined);
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchRoadmap = async (roadmapId?: number) => {
        try {
            const data = await roadmapAPI.getMyRoadmap(roadmapId);
            setRoadmap(data);
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                setRoadmap(null);
            } else {
                console.error('Failed to fetch roadmap', error);
                // Don't show toast on 404
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoadmap = async (careerPath: string) => {
        setCreating(true);
        try {
            const data = await roadmapAPI.create(careerPath);
            setRoadmap(data);
            toast.success('Roadmap created!');
        } catch (error: any) {
            if (error?.response?.status === 402 && error?.response?.data?.detail === 'INSUFFICIENT_CREDITS') {
                toast.error('Not enough credits (need 10). Buy more to create a roadmap.', { duration: 5000 });
            } else {
                toast.error('Failed to create roadmap');
            }
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateProgress = async (stepNumber: number) => {
        if (!roadmap) return;
        setUpdating(true);
        try {
            const data = await roadmapAPI.updateProgress(roadmap.id, stepNumber);
            setRoadmap({ ...roadmap, current_step: stepNumber, completion_percentage: data.completion_percentage });
            toast.success('Progress updated!');
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
            try {
                const data = await authAPI.login(email, password);
                setAuth({ id: 1, email, full_name: 'Dev User' }, data.access_token);
                toast.success('Logged in as Dev User', { id: toastId });
                window.location.reload();
                return;
            } catch (error: any) {
                // If login fails (assume 401/404), try register
                if (error.response && error.response.status === 401) {
                    // Proceed to register
                } else {
                    throw error;
                }
            }

            // 2. Register then Login
            toast.loading('Creating dev user...', { id: toastId });
            await authAPI.register(email, password, 'Dev User');

            // Retry Login
            const data = await authAPI.login(email, password);
            setAuth({ id: 1, email, full_name: 'Dev User' }, data.access_token);
            toast.success('Logged in as Dev User', { id: toastId });
            window.location.reload();

        } catch (error) {
            toast.error('Connection error or Login failed', { id: toastId });
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
                    <p className="mt-4 text-xs text-slate-400">Creates a test user &apos;dev@trainpi.com&apos; automatically.</p>
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
        </div>
    );
}

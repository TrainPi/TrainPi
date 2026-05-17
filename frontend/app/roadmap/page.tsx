'use client';

import { useState, useEffect } from 'react';
import { roadmapAPI } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import RoadmapView from '../../components/roadmap/RoadmapView';
import CreateRoadmap from '../../components/roadmap/CreateRoadmap';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoadmapPage() {
    const { token, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const id = params?.get('id');
        fetchRoadmap(id ? Number(id) : undefined);
    }, [isAuthenticated, router]);

    const fetchRoadmap = async (roadmapId?: number) => {
        try {
            const data = await roadmapAPI.getMyRoadmap(roadmapId);
            setRoadmap(data);
        } catch {
            setRoadmap(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoadmap = async (careerPath: string) => {
        setCreating(true);
        try {
            const data = await roadmapAPI.create(careerPath);
            setRoadmap(data);
            toast.success('Operational roadmap created');
        } catch {
            toast.error('Failed to create roadmap');
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
            toast.success('Step complete — readiness updated');
        } catch {
            toast.error('Failed to update progress');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="pb-10">
            {roadmap ? (
                <RoadmapView
                    roadmap={roadmap}
                    onUpdateProgress={handleUpdateProgress}
                    isUpdating={updating}
                    onReset={() => setRoadmap(null)}
                />
            ) : (
                <CreateRoadmap onSelect={handleCreateRoadmap} isLoading={creating} />
            )}
        </div>
    );
}

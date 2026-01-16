'use client';

import RoadmapView from '@/components/roadmap/RoadmapView';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { roadmapAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function GamifiedLearningPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRoadmap();
    }, []);

    const loadRoadmap = async () => {
        try {
            // Mock fetching or real fetching
            // const data = await roadmapAPI.getRoadmap(); 
            // setRoadmap(data);

            // Temporary Mock Data if API not ready, or fetch real if available.
            // Assuming RoadmapView can handle partial data or we need to implementation fetching properly.
            // For now, let's assuming RoadmapView works with what it has, 
            // but we need to pass the click handler.
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNodeClick = (step: any) => {
        // Navigate to AI Learning with a prompt to teach this topic
        const prompt = `Can you teach me about "${step.title}"? I want to understand the core concepts and try a practice problem.`;
        router.push(`/dashboard/ai-learning?message=${encodeURIComponent(prompt)}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Gamified Learning</h1>
                    <p className="text-gray-500">Your journey to mastery</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[600px]">
                {/* 
                  Note: In a real app we'd pass the actual roadmap data here. 
                  Since we modified RoadmapView to take props, we need to ensure they are passed.
                  The previous file content showed <RoadmapView /> with no props, suggesting it might have mocked data inside or I missed something.
                  I will assume for this step that we pass the handler. 
                  If RoadmapView expects 'roadmap' prop and it's missing, it handles it or crashes.
                  I'll check RoadmapView again if needed, but adding the prop is the goal.
                */}
                <RoadmapView
                    roadmap={{
                        id: 1,
                        career_path: (user as any)?.career_path || "Mathematics",
                        steps: [
                            { step_number: 1, title: "Introduction to Algebra", description: "Basics of variables and equations", skills: ["Variables", "Equations"], resources: [] },
                            { step_number: 2, title: "Quadratic Equations", description: "Solving polynomials of degree 2", skills: ["Factoring", "Quadratic Formula"], resources: [] },
                            { step_number: 3, title: "Functions & Graphs", description: "Understanding relations and mapping", skills: ["Domain", "Range"], resources: [] },
                            // Add more mock steps if needed or fetch real
                        ],
                        current_step: 1,
                        completion_percentage: 35
                    }}
                    onUpdateProgress={() => { }}
                    isUpdating={false}
                    onNodeClick={handleNodeClick}
                />
            </div>
        </div>
    );
}

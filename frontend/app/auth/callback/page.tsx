'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '../../../lib/api';
import { MOCK_ONLY } from '../../../lib/mockConfig';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);

    useEffect(() => {
        if (MOCK_ONLY) {
            router.push('/login');
            return;
        }
        const token = searchParams.get('token');

        if (token) {
            const verifyToken = async () => {
                try {
                    // Fetch user with the OAuth token directly (no intermediate dummy state)
                    const { data } = await (await import('axios')).default.get(
                        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/me`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setAuth(data, token);
                    toast.success('Successfully logged in!');
                    router.push('/dashboard');
                } catch (error) {
                    toast.error('Authentication failed');
                    router.push('/login');
                }
            };

            verifyToken();
        } else {
            toast.error('No token found');
            router.push('/login');
        }
    }, [searchParams, router, setAuth]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-DEFAULT" />
            <span className="ml-2 text-gray-600">Completing login...</span>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}

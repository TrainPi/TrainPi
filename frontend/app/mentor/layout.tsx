import DashboardShell from '@/components/layout/DashboardShell';

export default function MentorLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell>{children}</DashboardShell>;
}

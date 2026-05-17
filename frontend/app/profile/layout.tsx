import DashboardShell from '@/components/layout/DashboardShell';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell>{children}</DashboardShell>;
}

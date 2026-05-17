import DashboardShell from '@/components/layout/DashboardShell';

export default function WorkflowsLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell>{children}</DashboardShell>;
}

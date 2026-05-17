import DashboardShell from '@/components/layout/DashboardShell';

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell>{children}</DashboardShell>;
}

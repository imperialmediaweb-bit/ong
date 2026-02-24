import { Sidebar } from "@/components/dashboard/sidebar";
import SupportWidget from "@/components/support-widget";
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />
      <Sidebar />
      <div className="lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-8">{children}</main>
      </div>
      <SupportWidget />
    </div>
  );
}

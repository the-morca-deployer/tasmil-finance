import { SponsorMount } from "@/features/sponsorship/components/dashboard-trigger-mount";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SponsorMount />
      {children}
    </>
  );
}

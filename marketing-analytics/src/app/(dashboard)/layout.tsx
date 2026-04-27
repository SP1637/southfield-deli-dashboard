import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AIChat } from "@/components/dashboard/ai-chat";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Session is optional — unauthenticated users see demo data
  const session = await getServerSession(authOptions).catch(() => null);
  const isDemo = !session;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 flex-1 min-w-0">
        {/* Demo mode banner */}
        {isDemo && (
          <div className="flex items-center justify-between border-b bg-amber-50 dark:bg-amber-950/30 px-6 py-2">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Demo mode</span> — showing sample data from the Shopify Sales Funnel template.
              Connect your GA4 account to see real data.
            </p>
            <a
              href="/connect"
              className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
            >
              Connect sources →
            </a>
          </div>
        )}
        <div className="p-6 space-y-6">
          {children}
        </div>
      </main>
      <AIChat />
    </div>
  );
}

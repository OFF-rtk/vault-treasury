import { fetchPendingUsers } from "@/lib/actions/admin";
import { SignupRequestCard } from "@/components/admin/SignupRequestCard";
import { UserPlus } from "lucide-react";

export default async function SignupsPage() {
    const pendingUsers = await fetchPendingUsers();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Access Requests
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Review and approve pending sign-up requests.
                </p>
            </div>

            {/* Content Area */}
            {pendingUsers.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-24 px-4 bg-white border border-dashed border-slate-300 rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">No pending requests</p>
                    <p className="text-xs text-slate-500 mt-1">New sign-up requests will appear here.</p>
                </div>
            ) : (
                <>
                    {/* Count Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 w-fit">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-600">
                            {pendingUsers.length} pending {pendingUsers.length === 1 ? "request" : "requests"}
                        </span>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingUsers.map((user) => (
                            <SignupRequestCard key={user.id} user={user} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
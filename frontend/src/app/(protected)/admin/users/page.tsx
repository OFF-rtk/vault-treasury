import { fetchAllUsers } from "@/lib/actions/admin";
import { UserList } from "@/components/admin/UserList";
import { Users, UserCheck, UserX } from "lucide-react";

export default async function UsersPage() {
    const users = await fetchAllUsers();

    // Quick stats for the header
    const activeCount = users.filter(u => u.status === "active").length;
    const deactivatedCount = users.filter(u => u.status === "deactivated").length;

    return (
        <div className="space-y-8">
            {/* Header: Command Bar Style */}
            <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        User Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Active personnel and security status.
                    </p>
                </div>

                {/* Status Ticker */}
                <div className="flex items-center gap-6 text-xs font-medium">
                    <div className="flex items-center gap-2 text-slate-700">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        <span>Active: <span className="font-mono font-bold">{activeCount}</span></span>
                    </div>
                    {deactivatedCount > 0 && (
                        <div className="flex items-center gap-2 text-slate-400">
                            <UserX className="w-4 h-4" />
                            <span>Deactivated: <span className="font-mono font-bold">{deactivatedCount}</span></span>
                        </div>
                    )}
                </div>
            </div>

            {/* User Table */}
            <UserList users={users} />
        </div>
    );
}
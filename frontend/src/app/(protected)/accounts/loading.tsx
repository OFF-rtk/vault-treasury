import { AccountsSkeleton } from "@/components/accounts/AccountsSkeleton";

export default function AccountsLoading() {
    return (
        <div>
            <div className="mb-6">
                <div className="h-7 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
            </div>
            <AccountsSkeleton />
        </div>
    );
}

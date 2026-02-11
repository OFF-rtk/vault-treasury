import { fetchAccount } from "@/lib/actions/accounts";
import { AccountDetailClient } from "@/components/accounts/AccountDetail";
import { notFound } from "next/navigation";

export default async function AccountDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    try {
        const account = await fetchAccount(id);
        return <AccountDetailClient account={account} />;
    } catch {
        notFound();
    }
}

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ALL_PLACEHOLDER = "__all__";

export function PaymentFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentStatus = searchParams.get("status") || "";
    const currentPriority = searchParams.get("priority") || "";
    const currentSearch = searchParams.get("search") || "";

    const updateParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== ALL_PLACEHOLDER) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            // Reset to page 1 on filter change
            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    const clearFilters = useCallback(() => {
        router.push(pathname);
    }, [router, pathname]);

    const hasFilters = currentStatus || currentPriority || currentSearch;

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter */}
            <Select
                value={currentStatus || ALL_PLACEHOLDER}
                onValueChange={(v) => updateParam("status", v)}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_PLACEHOLDER}>All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
                value={currentPriority || ALL_PLACEHOLDER}
                onValueChange={(v) => updateParam("priority", v)}
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_PLACEHOLDER}>All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
            </Select>

            {/* Search */}
            <Input
                placeholder="Search reference..."
                value={currentSearch}
                onChange={(e) => updateParam("search", e.target.value)}
                className="w-[200px]"
            />

            {/* Clear Filters */}
            {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    );
}

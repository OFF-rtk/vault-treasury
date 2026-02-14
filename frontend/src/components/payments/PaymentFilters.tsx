"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect, useTransition } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ArrowUpDown } from "lucide-react";

const ALL_PLACEHOLDER = "__all__";

export function PaymentFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const currentStatus = searchParams.get("status") || "";
    const currentPriority = searchParams.get("priority") || "";
    const currentSearch = searchParams.get("search") || "";
    const currentSort = searchParams.get("sortBy") || "";

    // Local search state for debouncing — source of truth for the input value
    const [searchTerm, setSearchTerm] = useState(currentSearch);

    // Debounce: only push URL update after 400ms of no typing
    useEffect(() => {
        if (searchTerm === currentSearch) return;
        const timer = setTimeout(() => {
            updateParam("search", searchTerm);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

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
            // Non-blocking transition — input stays responsive during server re-render
            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`);
            });
        },
        [router, pathname, searchParams, startTransition]
    );

    const clearFilters = useCallback(() => {
        setSearchTerm("");
        startTransition(() => {
            router.push(pathname);
        });
    }, [router, pathname, startTransition]);

    const hasFilters = currentStatus || currentPriority || currentSearch || currentSort;

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

            {/* Sort */}
            <Select
                value={currentSort || ALL_PLACEHOLDER}
                onValueChange={(v) => updateParam("sortBy", v)}
            >
                <SelectTrigger className="w-[180px]">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_PLACEHOLDER}>Newest First</SelectItem>
                    <SelectItem value="resolved_at">Recently Actioned</SelectItem>
                </SelectContent>
            </Select>

            {/* Search (debounced) */}
            <Input
                placeholder="Search reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

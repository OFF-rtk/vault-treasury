import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="mx-auto h-20 w-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-6">
                    <Compass className="h-10 w-10 text-slate-400 animate-pulse" />
                </div>

                {/* 404 */}
                <p className="text-6xl font-bold text-slate-200 font-mono mb-2">404</p>

                {/* Message */}
                <h1 className="text-xl font-bold text-slate-800 mb-2">
                    Looks like you&apos;re lost
                </h1>
                <p className="text-sm text-slate-500 mb-8">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
                </p>

                {/* CTA */}
                <Link href="/payments">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 h-10">
                        Back to Payments
                    </Button>
                </Link>
            </div>
        </div>
    );
}

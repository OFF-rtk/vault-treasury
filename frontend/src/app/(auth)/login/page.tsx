'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction } from '@/lib/auth/actions';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await loginAction(email, password);
            if (!result.success) {
                setError(result.error || 'Login failed');
                return;
            }
            if (result.redirectTo) {
                router.push(result.redirectTo);
                router.refresh();
            }
        } catch (err: any) {
            setError('Connection failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-sm mx-auto space-y-8"
        >
            {/* 1. Brand Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-8">
                    <div className="h-8 w-8 bg-slate-900 rounded flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <div className="h-4 w-4 bg-white rounded-full"></div>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        VAULT
                    </span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    Welcome back
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Enter your credentials to access the treasury.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </motion.div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Work Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link
                                href="#"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
                                tabIndex={-1}
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono tracking-tighter"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-medium shadow-lg shadow-slate-900/10 dark:shadow-blue-600/20 transition-all mt-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <span className="flex items-center">
                            Sign In <ArrowRight className="w-4 h-4 ml-2 opacity-70" />
                        </span>
                    )}
                </Button>
            </form>

            {/* Footer Links */}
            <div className="pt-6 space-y-6">
                <div className="text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-semibold text-slate-900 dark:text-white hover:underline">
                        Request Access
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
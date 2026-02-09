'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/signups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    department: formData.department || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            setIsSuccess(true);
            setTimeout(() => {
                router.push('/under-review');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-[320px] mx-auto text-center space-y-4"
            >
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Request Submitted</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Your access request has been sent to Admin. Redirecting...
                    </p>
                </div>
                <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-400" />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            // Scaled Down: max-w-sm -> max-w-[340px], space-y-8 -> space-y-5
            className="w-full max-w-[340px] mx-auto space-y-5"
        >
            {/* 1. Brand Header (Scaled Down) */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-4">
                    {/* Logo: h-8 -> h-6 */}
                    <div className="h-6 w-6 bg-slate-900 dark:bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <div className="h-3 w-3 bg-white rounded-full"></div>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        VAULT
                    </span>
                </div>
                {/* Text: 3xl -> 2xl */}
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    Request Access
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Submit your details for treasury approval.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md flex items-center gap-2"
                    >
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {error}
                    </motion.div>
                )}

                <div className="space-y-2.5">
                    <div className="space-y-1">
                        <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            placeholder="John Smith"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            // Height: h-11 -> h-9 (36px)
                            className="h-9 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="email" className="text-xs">Work Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            className="h-9 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="department" className="text-xs">Department <span className="text-slate-400 font-normal ml-0.5">(Optional)</span></Label>
                        <Input
                            id="department"
                            name="department"
                            type="text"
                            placeholder="Finance"
                            value={formData.department}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="h-9 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="password" className="text-xs">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Min. 8"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                                className="h-9 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="confirmPassword" className="text-xs">Confirm</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                                className="h-9 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    // Height: h-11 -> h-9
                    className="w-full h-9 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-slate-900/10 dark:shadow-blue-600/20 transition-all mt-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    ) : (
                        <span className="flex items-center">
                            Submit Request <ArrowRight className="w-3.5 h-3.5 ml-2 opacity-70" />
                        </span>
                    )}
                </Button>
            </form>

            {/* Footer Links (Scaled padding) */}
            <div className="pt-4 space-y-4">
                <div className="text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-slate-900 dark:text-white hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
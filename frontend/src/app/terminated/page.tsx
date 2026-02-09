import Link from 'next/link';
import { ShieldX, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { logoutAction } from '@/lib/auth/actions';

export default function TerminatedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--gray-50)] dark:bg-[var(--dark-bg)]">
            <div className="w-full max-w-md px-4">
                <Card className="shadow-lg border-[var(--danger-200)] dark:border-[var(--danger-700)]">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-full bg-[var(--danger-50)] dark:bg-[var(--danger-500)]/10 flex items-center justify-center mb-4">
                            <ShieldX className="w-8 h-8 text-[var(--danger-600)]" />
                        </div>
                        <CardTitle className="text-2xl font-semibold tracking-tight text-[var(--danger-700)] dark:text-[var(--danger-500)]">
                            Session Terminated
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="text-center space-y-4">
                        <p className="text-[var(--gray-600)] dark:text-[var(--dark-muted)]">
                            Your session has been terminated due to security concerns.
                        </p>
                        <p className="text-[var(--gray-600)] dark:text-[var(--dark-muted)]">
                            If you believe this is an error, please contact your administrator.
                        </p>
                    </CardContent>

                    <CardFooter>
                        <form action={logoutAction} className="w-full">
                            <Button type="submit" className="w-full">
                                <span className="flex items-center gap-2">
                                    Return to Login
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

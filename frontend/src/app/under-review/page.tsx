import Link from 'next/link';
import { Clock, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { logoutAction } from '@/lib/auth/actions';

export default function UnderReviewPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--gray-50)] dark:bg-[var(--dark-bg)]">
            <div className="w-full max-w-md px-4">
                <Card className="shadow-lg border-[var(--gray-200)] dark:border-[var(--dark-border)]">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 rounded-full bg-[var(--warning-50)] dark:bg-[var(--warning-500)]/10 flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-[var(--warning-600)]" />
                        </div>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Application Under Review
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="text-center space-y-4">
                        <p className="text-[var(--gray-600)] dark:text-[var(--dark-muted)]">
                            Thank you for signing up for Vault Treasury access.
                        </p>
                        <p className="text-[var(--gray-600)] dark:text-[var(--dark-muted)]">
                            Your request is currently being reviewed by a Treasury Administrator.
                            You will be able to access the system once your account has been approved.
                        </p>
                        <div className="pt-4 px-6 py-4 rounded-lg bg-[var(--gray-100)] dark:bg-[var(--dark-card)]">
                            <p className="text-sm text-[var(--gray-500)]">
                                If you believe this is taking too long, please contact your system administrator.
                            </p>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3">
                        <form action={logoutAction}>
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </form>
                        <Link href="/login" className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] transition-colors">
                            Return to Login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

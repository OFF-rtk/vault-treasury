import { Sidebar } from '@/components/layout/Sidebar';
import { Shield, CreditCard, Building2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAuth } from '@/lib/auth/actions';

export default async function PaymentsPage() {
    const user = await requireAuth();

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-60">
                <div className="container mx-auto max-w-6xl px-6 py-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-display text-foreground">Payment Queue</h1>
                        <p className="mt-2 text-body text-muted-foreground">
                            Welcome, {user.fullName}
                        </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        <Card className="card-interactive">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    No payments in queue
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="card-interactive">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Today&apos;s Volume</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold amount">$0.00</div>
                                <p className="text-xs text-muted-foreground">
                                    No transactions today
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="card-interactive">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">--</div>
                                <p className="text-xs text-muted-foreground">
                                    No data yet
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="card-interactive">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1</div>
                                <p className="text-xs text-muted-foreground">
                                    You
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Security Notice */}
                    <Card className="border-l-4 border-l-primary">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <CardTitle className="text-heading-3">Sentinel Protection Active</CardTitle>
                            </div>
                            <CardDescription>
                                All sensitive actions are protected by behavioral biometric verification.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Payment Queue */}
                    <div className="mt-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Queue</CardTitle>
                                <CardDescription>
                                    Payments awaiting your approval will appear here.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center py-12 text-muted-foreground">
                                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No pending payments</p>
                                <p className="text-sm mt-1">Use the ERP Simulator to generate test payments</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

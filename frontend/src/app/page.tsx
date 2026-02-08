import { Sidebar } from "@/components/layout/Sidebar";
import { Shield, CreditCard, Building2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60">
        <div className="container mx-auto max-w-6xl px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-display text-foreground">Welcome to Vault Treasury</h1>
            <p className="mt-2 text-body text-muted-foreground">
              Behavioral-security-protected Treasury Management System
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
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  +3 from yesterday
                </p>
              </CardContent>
            </Card>

            <Card className="card-interactive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Volume</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold amount">$1,245,000</div>
                <p className="text-xs text-muted-foreground">
                  -12% vs average
                </p>
              </CardContent>
            </Card>

            <Card className="card-interactive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% vs last week
                </p>
              </CardContent>
            </Card>

            <Card className="card-interactive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  2 admins, 6 treasurers
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
                Your typing and mouse patterns are continuously analyzed to ensure account security.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}

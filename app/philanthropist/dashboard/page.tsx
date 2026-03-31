'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-charity-api';
import { MapPin, Users, MessageSquare } from 'lucide-react';

export default function PhilanthropistDashboardPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Philanthropist Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.full_name || user?.username}!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <MapPin className="w-8 h-8 mb-4 text-blue-600" />
            <h3 className="text-xl font-bold mb-2">Your Regions</h3>
            <p className="text-3xl font-bold mb-4">1</p>
            <Button variant="outline" className="w-full">Manage Regions</Button>
          </Card>

          <Card className="p-6">
            <Users className="w-8 h-8 mb-4 text-green-600" />
            <h3 className="text-xl font-bold mb-2">Beneficiaries</h3>
            <p className="text-3xl font-bold mb-4">0</p>
            <Button variant="outline" className="w-full">View All</Button>
          </Card>

          <Card className="p-6">
            <MessageSquare className="w-8 h-8 mb-4 text-purple-600" />
            <h3 className="text-xl font-bold mb-2">Telegram Channel</h3>
            <p className="text-sm text-muted-foreground mb-4">Share your Telegram username to help beneficiaries connect</p>
            <Button variant="outline" className="w-full">Update Telegram</Button>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Verification Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">KYC Status</p>
                <p className="text-sm text-muted-foreground">Your verification is pending review</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Pending</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Stats</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Active Beneficiaries</p>
              <p className="text-3xl font-bold">0</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

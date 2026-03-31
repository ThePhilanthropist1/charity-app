'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      setCountry(user.country || '');
      setRegion(user.region || '');
      setLoading(false);
    }
  }, [user, authLoading, router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          country,
          region,
        })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshUser();
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Link href={
          user.role === 'beneficiary' ? '/beneficiary-dashboard' :
          user.role === 'philanthropist' ? '/philanthropist-dashboard' :
          '/admin'
        }>
          <Button variant="ghost" className="mb-6">
            ← Back to Dashboard
          </Button>
        </Link>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={user.email}
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+234..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Region/State</label>
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <Input
                value={user.role}
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Role cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Input
                value={user.status}
                disabled
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded mb-6 text-sm ${
              message.includes('Error')
                ? 'bg-destructive/10 text-destructive'
                : 'bg-green-100 text-green-800'
            }`}>
              {message}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Card>
      </div>
    </div>
  );
}

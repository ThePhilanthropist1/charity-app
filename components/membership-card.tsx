'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

interface MembershipCardProps {
  userId: string;
  fullName: string;
  email: string;
  profileImage?: string;
  joinDate: string;
}

export function MembershipCard({
  userId,
  fullName,
  email,
  profileImage,
  joinDate,
}: MembershipCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const generateMemberId = () => {
    // Generate a unique member ID based on userId
    const timestamp = new Date(joinDate).getTime();
    const random = Math.floor(Math.random() * 10000);
    return `CT-${userId.substring(0, 6).toUpperCase()}-${random.toString().padStart(4, '0')}`;
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    setError('');
    setLoading(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0A1628',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `charity-token-card-${userId}.png`;
      link.click();
    } catch (err) {
      setError('Failed to download card. Please try again.');
      console.error('[v0] Download error:', err);
    } finally {
      setLoading(false);
    }
  };

  const memberId = generateMemberId();
  const hasProfileImage = !!profileImage && profileImage.length > 0;

  if (!hasProfileImage) {
    return (
      <Card className="charity-glow-card p-6">
        <div className="flex gap-4 items-start">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <p className="font-semibold text-foreground mb-1">Upload Profile Picture First</p>
            <p className="text-sm text-muted-foreground">
              Upload your profile picture to generate and download your membership card
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Preview Card */}
      <div
        ref={cardRef}
        className="w-full max-w-sm mx-auto bg-gradient-to-br from-cyan-900/20 to-emerald-900/20 border-2 border-cyan-400/50 rounded-2xl p-8 text-white shadow-2xl"
        style={{
          aspectRatio: '16 / 10',
          background: 'linear-gradient(135deg, #0F2F3F 0%, #0A1628 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Card Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h4 className="text-lg font-bold text-cyan-300">CHARITY TOKEN</h4>
            <p className="text-xs text-cyan-200/70">Membership Card</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-white">CT</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex gap-6 mb-8">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <img
              src={profileImage}
              alt={fullName}
              className="w-24 h-24 rounded-lg object-cover border-2 border-cyan-300/50"
            />
          </div>

          {/* Member Info */}
          <div className="flex-1">
            <p className="text-xs text-cyan-200/70 mb-1">Member Name</p>
            <p className="text-lg font-bold text-white mb-3">{fullName}</p>

            <p className="text-xs text-cyan-200/70 mb-1">Member ID</p>
            <p className="text-sm font-mono text-emerald-300 font-bold">{memberId}</p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="border-t border-cyan-400/30 pt-4 flex justify-between items-end">
          <div>
            <p className="text-xs text-cyan-200/70 mb-1">Valid Since</p>
            <p className="text-sm font-semibold text-white">
              {new Date(joinDate).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-cyan-200/70 mb-1">Benefit</p>
            <p className="text-lg font-bold text-emerald-300">500 CT/Month</p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-4 right-4 opacity-10">
          <div className="text-4xl">🍃</div>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={downloadCard}
          disabled={loading}
          className="charity-btn-primary flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          {loading ? 'Generating...' : 'Download Card as PNG'}
        </Button>
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        Print your card or save it as a digital badge. Your member ID is {memberId}
      </p>
    </div>
  );
}

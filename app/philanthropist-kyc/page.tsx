'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase, submitKYC } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';
import { put } from '@vercel/blob';

export default function PhilanthropistKYCPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<'form' | 'face' | 'review'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    country: '',
    region: '',
    phone_number: '',
    home_address: '',
    id_type: 'passport' as const,
  });

  const [files, setFiles] = useState({
    id_document: null as File | null,
    face_capture: null as File | null,
  });

  const [previews, setPreviews] = useState({
    id_document: '',
    face_capture: '',
  });

  useEffect(() => {
    if (!authLoading && user?.role !== 'philanthropist') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'id_document' | 'face_capture') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [fileType]: file }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => ({ ...prev, [fileType]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!files.id_document) {
      setError('Please upload a government-issued ID');
      return;
    }

    setStep('face');
  };

  const handleSubmitKYC = async () => {
    setError('');
    setLoading(true);

    try {
      if (!user?.id) throw new Error('User not authenticated');
      if (!files.id_document || !files.face_capture) {
        throw new Error('Please provide all required documents');
      }

      // Upload ID document
      const idResponse = await put(`kyc/id/${user.id}/${Date.now()}`, files.id_document, {
        access: 'private',
      });

      // Upload face capture
      const faceResponse = await put(`kyc/face/${user.id}/${Date.now()}`, files.face_capture, {
        access: 'private',
      });

      // Submit KYC
      await submitKYC(user.id, {
        ...formData,
        id_document_url: idResponse.url,
        face_capture_url: faceResponse.url,
      });

      setStep('review');
      setTimeout(() => router.push('/philanthropist-dashboard'), 3000);
    } catch (err: any) {
      setError(err.message || 'KYC submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Philanthropist KYC Verification</h1>

            {step === 'form' && (
              <KYCForm
                formData={formData}
                previews={previews}
                onFormChange={handleFormChange}
                onFileChange={handleFileChange}
                onSubmit={handleFormSubmit}
                error={error}
              />
            )}

            {step === 'face' && (
              <FaceCapture
                onCapture={(blob) => {
                  setFiles((prev) => ({ ...prev, face_capture: blob }));
                  setPreviews((prev) => ({
                    ...prev,
                    face_capture: URL.createObjectURL(blob),
                  }));
                  setStep('review');
                }}
              />
            )}

            {step === 'review' && (
              <ReviewKYC
                formData={formData}
                previews={previews}
                onSubmit={handleSubmitKYC}
                loading={loading}
                error={error}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KYCForm({
  formData,
  previews,
  onFormChange,
  onFileChange,
  onSubmit,
  error,
}: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <Input
            name="full_name"
            value={formData.full_name}
            onChange={onFormChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth *</label>
          <Input
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={onFormChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Country *</label>
          <Input
            name="country"
            value={formData.country}
            onChange={onFormChange}
            placeholder="e.g., Nigeria"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Region/State *</label>
          <Input
            name="region"
            value={formData.region}
            onChange={onFormChange}
            placeholder="e.g., Lagos"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone Number *</label>
        <Input
          name="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={onFormChange}
          placeholder="+234..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Home Address *</label>
        <Input
          name="home_address"
          value={formData.home_address}
          onChange={onFormChange}
          placeholder="Street address"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ID Type *</label>
        <select
          name="id_type"
          value={formData.id_type}
          onChange={onFormChange}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="passport">Passport</option>
          <option value="national_id">National ID</option>
          <option value="drivers_license">Driver&apos;s License</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Government-Issued ID *</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => onFileChange(e, 'id_document')}
          className="w-full border rounded px-3 py-2"
          required
        />
        {previews.id_document && (
          <img src={previews.id_document} alt="ID preview" className="mt-2 max-w-xs rounded" />
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full">
        Continue to Face Capture
      </Button>
    </form>
  );
}

function FaceCapture({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreaming(true);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to access camera');
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob((blob) => {
          if (blob) {
            onCapture(blob);
          }
        });
      }
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <p className="text-sm text-muted-foreground">
          Please check your browser permissions and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Position your face in the center and click &quot;Capture Photo&quot;
      </p>

      <div className="relative bg-black rounded overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <Button onClick={handleCapture} className="w-full">
        Capture Photo
      </Button>
    </div>
  );
}

function ReviewKYC({
  formData,
  previews,
  onSubmit,
  loading,
  error,
}: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Review Your Information</h2>

      <div className="bg-muted p-4 rounded space-y-2">
        <p>
          <strong>Full Name:</strong> {formData.full_name}
        </p>
        <p>
          <strong>Date of Birth:</strong> {formData.date_of_birth}
        </p>
        <p>
          <strong>Country:</strong> {formData.country}
        </p>
        <p>
          <strong>Region:</strong> {formData.region}
        </p>
        <p>
          <strong>Phone:</strong> {formData.phone_number}
        </p>
        <p>
          <strong>Address:</strong> {formData.home_address}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {previews.id_document && (
          <div>
            <p className="text-sm font-medium mb-2">Government ID</p>
            <img src={previews.id_document} alt="ID" className="rounded w-full" />
          </div>
        )}

        {previews.face_capture && (
          <div>
            <p className="text-sm font-medium mb-2">Face Capture</p>
            <img src={previews.face_capture} alt="Face" className="rounded w-full" />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
          {error}
        </div>
      )}

      <Button onClick={onSubmit} className="w-full" disabled={loading}>
        {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
        {loading ? 'Submitting...' : 'Submit KYC'}
      </Button>
    </div>
  );
}

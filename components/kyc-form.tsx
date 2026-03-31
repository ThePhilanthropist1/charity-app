'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Camera, Upload } from 'lucide-react';
import { useFileUpload, useSubmitKYC } from '@/hooks/use-charity-api';

export function KYCForm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState(1);
  const [governmentIdType, setGovernmentIdType] = useState('passport');
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [governmentIdUrl, setGovernmentIdUrl] = useState('');
  const [faceCaptureUrl, setFaceCaptureUrl] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { upload } = useFileUpload();
  const { submit } = useSubmitKYC();

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('Cannot access camera. Please check permissions.');
      console.error('[v0] Camera error:', err);
    }
  }, []);

  // Capture face
  const captureFace = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setFaceCaptureUrl(imageData);
        
        // Stop video stream
        if (videoRef.current.srcObject instanceof MediaStream) {
          videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        }
        setCameraActive(false);
      }
    }
  }, []);

  // Handle government ID upload
  const handleGovernmentIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGovernmentIdFile(file);
      setLoading(true);
      setError('');

      try {
        const uploadResult = await upload(file, 'government_id');
        if (uploadResult.success) {
          setGovernmentIdUrl(uploadResult.data.url);
        } else {
          setError(uploadResult.error || 'Failed to upload ID');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle face capture upload
  const handleFaceCaptureUpload = async () => {
    if (!faceCaptureUrl) {
      setError('Please capture a face photo first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert data URL to file
      const response = await fetch(faceCaptureUrl);
      const blob = await response.blob();
      const file = new File([blob], 'face_capture.jpg', { type: 'image/jpeg' });

      const uploadResult = await upload(file, 'face_capture');
      if (uploadResult.success) {
        setFaceCaptureUrl(uploadResult.data.url);
        setStep(3);
      } else {
        setError(uploadResult.error || 'Failed to upload face capture');
      }
    } catch (err) {
      setError('Failed to process face capture');
      console.error('[v0] Face capture error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit KYC
  const handleSubmit = async () => {
    if (!governmentIdUrl || !faceCaptureUrl) {
      setError('Missing required documents');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await submit(governmentIdType, governmentIdUrl, faceCaptureUrl);
      if (result.success) {
        setSuccess(true);
        setStep(4);
      } else {
        setError(result.error || 'Submission failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
        <p className="text-muted-foreground mb-6">Complete your verification in 3 steps</p>

        {error && (
          <div className="flex gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex gap-2 p-4 mb-6 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">KYC submission successful! Our team will review your information.</p>
          </div>
        )}

        {/* Step 1: Government ID */}
        {step >= 1 && (
          <div className="mb-8 pb-8 border-b">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <h2 className="text-xl font-semibold">Upload Government ID</h2>
              {governmentIdUrl && <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ID Type</label>
                <select
                  value={governmentIdType}
                  onChange={(e) => setGovernmentIdType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={!!governmentIdUrl}
                >
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="driver_license">Driver&apos;s License</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Upload {governmentIdType === 'passport' ? 'Passport' : governmentIdType === 'national_id' ? 'National ID' : "Driver's License"}</label>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <span className="text-sm font-medium">Click to upload or drag and drop</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, or PDF up to 10MB</span>
                  <input
                    type="file"
                    onChange={handleGovernmentIdUpload}
                    className="hidden"
                    accept="image/*,.pdf"
                    disabled={loading || !!governmentIdUrl}
                  />
                </label>
                {governmentIdFile && <p className="text-sm text-green-600 mt-2">✓ {governmentIdFile.name}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Face Capture */}
        {step >= 2 && (
          <div className="mb-8 pb-8 border-b">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <h2 className="text-xl font-semibold">Live Face Capture</h2>
              {faceCaptureUrl && <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />}
            </div>

            <div className="space-y-4">
              {!cameraActive && !faceCaptureUrl && (
                <Button onClick={startCamera} className="w-full" disabled={loading}>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              )}

              {cameraActive && (
                <div>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-black"
                  />
                  <Button onClick={captureFace} className="w-full mt-4" disabled={loading}>
                    Capture Photo
                  </Button>
                </div>
              )}

              {faceCaptureUrl && (
                <div>
                  <img src={faceCaptureUrl} alt="Face capture" className="w-full rounded-lg mb-4" />
                  <div className="flex gap-2">
                    <Button
                      onClick={startCamera}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      Retake Photo
                    </Button>
                    <Button
                      onClick={handleFaceCaptureUpload}
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? 'Uploading...' : 'Continue'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step >= 3 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <h2 className="text-xl font-semibold">Review & Submit</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Government ID</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">✓ {governmentIdType.replace('_', ' ')} uploaded</div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Face Capture</p>
                <img src={faceCaptureUrl} alt="Face" className="w-full rounded-lg h-32 object-cover" />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={loading}
                size="lg"
              >
                {loading ? 'Submitting...' : 'Submit KYC'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && success && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">KYC Submitted Successfully</h2>
            <p className="text-muted-foreground mb-6">Your verification documents have been submitted for review. You'll be notified once the review is complete.</p>
            <Button onClick={() => window.location.href = '/philanthropist/dashboard'} className="w-full">
              Back to Dashboard
            </Button>
          </div>
        )}

        {/* Hidden canvas for face capture */}
        <canvas ref={canvasRef} width={1280} height={720} className="hidden" />
      </Card>
    </div>
  );
}

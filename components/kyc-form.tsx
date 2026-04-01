'use client';

import { useState, useRef, useCallback } from 'react';
import { AlertCircle, CheckCircle, Camera, Upload, Shield, FileText, Eye, Send } from 'lucide-react';
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
    }
  }, []);

  const captureFace = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setFaceCaptureUrl(imageData);
        if (videoRef.current.srcObject instanceof MediaStream) {
          videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        }
        setCameraActive(false);
      }
    }
  }, []);

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
          setStep(2);
        } else {
          setError(uploadResult.error || 'Failed to upload ID');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFaceCaptureUpload = async () => {
    if (!faceCaptureUrl) { setError('Please capture a face photo first'); return; }
    setLoading(true);
    setError('');
    try {
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!governmentIdUrl || !faceCaptureUrl) { setError('Missing required documents'); return; }
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

  const steps = [
    { num: 1, label: 'Government ID', icon: <FileText style={{ width: 16, height: 16 }} /> },
    { num: 2, label: 'Face Capture', icon: <Camera style={{ width: 16, height: 16 }} /> },
    { num: 3, label: 'Review', icon: <Eye style={{ width: 16, height: 16 }} /> },
    { num: 4, label: 'Done', icon: <CheckCircle style={{ width: 16, height: 16 }} /> },
  ];

  if (step === 4 && success) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '60px 32px', backgroundColor: '#0F1F35', border: '1px solid rgba(0,184,148,0.3)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(0,184,148,0.15)', border: '2px solid rgba(0,184,148,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle style={{ width: 44, height: 44, color: '#00B894' }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12 }}>KYC Submitted!</h2>
        <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.8, marginBottom: 32 }}>
          Your verification documents have been submitted successfully.<br />
          Our team will review and notify you within 24-48 hours.
        </p>
        <button
          onClick={() => window.location.href = '/philanthropist/dashboard'}
          style={{ padding: '14px 36px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,206,201,0.3)' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #00CEC9, #00B894)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#8FA3BF', margin: 0, letterSpacing: 1, textTransform: 'uppercase' }}>Philanthropist Portal</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0 }}>KYC Verification</h1>
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#8FA3BF', marginTop: 4 }}>Complete identity verification to activate your philanthropist account</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {steps.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, background: step >= s.num ? 'linear-gradient(135deg, #00CEC9, #00B894)' : 'rgba(255,255,255,0.06)', border: step >= s.num ? 'none' : '1px solid rgba(0,206,201,0.2)', color: step >= s.num ? 'white' : '#8FA3BF', boxShadow: step === s.num ? '0 0 16px rgba(0,206,201,0.4)' : 'none' }}>
                {step > s.num ? <CheckCircle style={{ width: 16, height: 16 }} /> : s.num}
              </div>
              <span style={{ fontSize: 10, color: step >= s.num ? '#00CEC9' : '#8FA3BF', fontWeight: step === s.num ? 700 : 400, whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, backgroundColor: step > s.num ? '#00CEC9' : 'rgba(0,206,201,0.15)', margin: '0 8px', marginBottom: 20 }} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12 }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ff6b6b', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#ffb3b3', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.15)', borderRadius: 20, padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottom: '1px solid rgba(0,206,201,0.1)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText style={{ width: 20, height: 20, color: '#00CEC9' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Upload Government ID</h2>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Provide a valid government-issued identification document</p>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>ID Type</label>
              <select
                value={governmentIdType}
                onChange={(e) => setGovernmentIdType(e.target.value)}
                disabled={!!governmentIdUrl}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', cursor: 'pointer' }}
              >
                <option value="passport">Passport</option>
                <option value="national_id">National ID Card</option>
                <option value="driver_license">Driver License</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Upload {governmentIdType === 'passport' ? 'Passport' : governmentIdType === 'national_id' ? 'National ID' : 'Driver License'}
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', border: '2px dashed rgba(0,206,201,0.3)', borderRadius: 14, cursor: loading || !!governmentIdUrl ? 'not-allowed' : 'pointer', backgroundColor: 'rgba(0,206,201,0.03)', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload style={{ width: 22, height: 22, color: '#00CEC9' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 4px' }}>Click to upload or drag and drop</p>
                  <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>PNG, JPG, or PDF up to 10MB</p>
                </div>
                {loading && <p style={{ fontSize: 13, color: '#00CEC9', margin: 0 }}>Uploading...</p>}
                <input type="file" onChange={handleGovernmentIdUpload} style={{ display: 'none' }} accept="image/*,.pdf" disabled={loading || !!governmentIdUrl} />
              </label>
              {governmentIdFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', backgroundColor: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)', borderRadius: 10 }}>
                  <CheckCircle style={{ width: 16, height: 16, color: '#00B894', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#00B894', margin: 0, fontWeight: 500 }}>{governmentIdFile.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottom: '1px solid rgba(0,206,201,0.1)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera style={{ width: 20, height: 20, color: '#00CEC9' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Live Face Capture</h2>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Take a clear photo of your face for identity verification</p>
              </div>
              {faceCaptureUrl && <CheckCircle style={{ width: 20, height: 20, color: '#00B894', marginLeft: 'auto', flexShrink: 0 }} />}
            </div>

            {!cameraActive && !faceCaptureUrl && (
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Camera style={{ width: 36, height: 36, color: '#00CEC9' }} />
                </div>
                <p style={{ fontSize: 14, color: '#8FA3BF', marginBottom: 24, lineHeight: 1.6 }}>Make sure you are in a well-lit area and your face is clearly visible</p>
                <button onClick={startCamera} disabled={loading} style={{ padding: '13px 32px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Camera style={{ width: 18, height: 18 }} />
                  Start Camera
                </button>
              </div>
            )}

            {cameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 14, backgroundColor: '#000', border: '1px solid rgba(0,206,201,0.2)' }} />
                <button onClick={captureFace} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Camera style={{ width: 18, height: 18 }} />
                  Capture Photo
                </button>
              </div>
            )}

            {faceCaptureUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
                  <img src={faceCaptureUrl} alt="Face capture" style={{ width: '100%', borderRadius: 14, border: '1px solid rgba(0,206,201,0.2)' }} />
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', borderRadius: 999, backgroundColor: 'rgba(0,184,148,0.9)', color: 'white', fontSize: 12, fontWeight: 600 }}>Captured</div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={startCamera} disabled={loading} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'transparent', color: '#00CEC9', fontWeight: 700, fontSize: 14, border: '1px solid rgba(0,206,201,0.4)', cursor: 'pointer' }}>
                    Retake Photo
                  </button>
                  <button onClick={handleFaceCaptureUpload} disabled={loading} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Uploading...' : 'Continue'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottom: '1px solid rgba(0,206,201,0.1)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Eye style={{ width: 20, height: 20, color: '#00CEC9' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Review and Submit</h2>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Verify your documents before final submission</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(0,206,201,0.03)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#8FA3BF', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Government ID</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle style={{ width: 18, height: 18, color: '#00B894', flexShrink: 0 }} />
                  <p style={{ fontSize: 14, color: 'white', margin: 0, fontWeight: 500, textTransform: 'capitalize' }}>{governmentIdType.replace('_', ' ')} uploaded successfully</p>
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(0,206,201,0.03)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#8FA3BF', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Face Capture</p>
                <img src={faceCaptureUrl} alt="Face" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)' }} />
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.12)', display: 'flex', gap: 10 }}>
                <Shield style={{ width: 16, height: 16, color: '#00CEC9', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0, lineHeight: 1.6 }}>Your documents are encrypted and stored securely. They will only be used for identity verification purposes.</p>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(0,206,201,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Send style={{ width: 18, height: 18 }} />
              {loading ? 'Submitting...' : 'Submit KYC Verification'}
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} width={1280} height={720} style={{ display: 'none' }} />
    </div>
  );
}

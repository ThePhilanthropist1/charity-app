'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle, Camera, Upload, Shield, FileText, Eye, Send, X, Clock, XCircle, RefreshCw } from 'lucide-react';

// ── DIRECT API HELPERS — no hooks, always fresh token ────────────────────────
async function uploadFile(file: File, type: 'government_id' | 'face_capture'): Promise<{ success: boolean; url?: string; error?: string }> {
  const token = localStorage.getItem('auth_token') || '';
  if (!token) return { success: false, error: 'Not authenticated. Please log in again.' };

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  // Always parse as text first to avoid JSON parse errors
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (data.success) return { success: true, url: data.data?.url };
    return { success: false, error: data.error || 'Upload failed. Please try again.' };
  } catch {
    console.error('[upload] Non-JSON response:', text.slice(0, 200));
    return { success: false, error: 'Server error during upload. Please try again.' };
  }
}

async function submitKYC(
  governmentIdType: string,
  governmentIdUrl: string,
  faceCaptureUrl: string
): Promise<{ success: boolean; error?: string }> {
  const token = localStorage.getItem('auth_token') || '';
  if (!token) return { success: false, error: 'Not authenticated. Please log in again.' };

  const response = await fetch('/api/kyc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: 'submit',
      government_id_type: governmentIdType,
      government_id_url: governmentIdUrl,
      face_capture_url: faceCaptureUrl,
    }),
  });

  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (data.success) return { success: true };
    return { success: false, error: data.error || 'Submission failed. Please try again.' };
  } catch {
    console.error('[kyc] Non-JSON response:', text.slice(0, 200));
    return { success: false, error: 'Server error during submission. Please try again.' };
  }
}

async function getExistingSubmission(): Promise<any> {
  const token = localStorage.getItem('auth_token') || '';
  if (!token) return null;
  try {
    const response = await fetch('/api/kyc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'get' }),
    });
    const text = await response.text();
    const data = JSON.parse(text);
    return data.success && data.data ? data.data : null;
  } catch { return null; }
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export function KYCForm() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep]                             = useState(1);
  const [governmentIdType, setGovernmentIdType]     = useState('passport');
  const [governmentIdFile, setGovernmentIdFile]     = useState<File | null>(null);
  const [governmentIdPreview, setGovernmentIdPreview] = useState('');
  const [governmentIdUrl, setGovernmentIdUrl]       = useState('');
  const [faceCaptureDataUrl, setFaceCaptureDataUrl] = useState('');
  const [faceCaptureUrl, setFaceCaptureUrl]         = useState('');
  const [cameraActive, setCameraActive]             = useState(false);
  const [cameraReady, setCameraReady]               = useState(false);
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState('');
  const [success, setSuccess]                       = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [checkingStatus, setCheckingStatus]         = useState(true);
  const [uploadProgress, setUploadProgress]         = useState('');
  const streamRef = useRef<MediaStream | null>(null);

  // ── CHECK EXISTING SUBMISSION ON MOUNT ────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      setCheckingStatus(true);
      const sub = await getExistingSubmission();
      if (sub) setExistingSubmission(sub);
      setCheckingStatus(false);
    };
    check();
  }, []);

  // ── CAMERA ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(''); setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
              .then(() => setCameraReady(true))
              .catch(() => setError('Camera started but could not display. Try again.'));
          };
        }
      }, 100);
    } catch (err: any) {
      if (err.name === 'NotAllowedError')
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      else if (err.name === 'NotFoundError')
        setError('No camera found on this device.');
      else
        setError('Cannot access camera: ' + (err.message || 'Unknown error'));
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false); setCameraReady(false);
  }, []);

  const captureFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setFaceCaptureDataUrl(canvas.toDataURL('image/jpeg', 0.9));
      stopCamera();
    }
  }, [stopCamera]);

  // ── UPLOAD GOVERNMENT ID ──────────────────────────────────────────────────
  const handleGovernmentIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum size is 10MB.'); return; }

    setGovernmentIdFile(file); setError(''); setUploadProgress('Uploading ID document...');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setGovernmentIdPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }

    setLoading(true);
    try {
      const result = await uploadFile(file, 'government_id');
      if (result.success && result.url) {
        setGovernmentIdUrl(result.url);
        setUploadProgress('');
        setStep(2);
      } else {
        setError(result.error || 'Upload failed. Please try again.');
        setGovernmentIdFile(null); setGovernmentIdPreview(''); setUploadProgress('');
      }
    } catch (e: any) {
      setError(e?.message || 'Upload failed. Please try again.');
      setUploadProgress('');
    } finally { setLoading(false); }
  };

  // ── UPLOAD FACE CAPTURE ───────────────────────────────────────────────────
  const handleFaceCaptureUpload = async () => {
    if (!faceCaptureDataUrl) { setError('Please capture a photo first'); return; }
    setLoading(true); setError(''); setUploadProgress('Uploading face photo...');
    try {
      const res  = await fetch(faceCaptureDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'face_capture.jpg', { type: 'image/jpeg' });
      const result = await uploadFile(file, 'face_capture');
      if (result.success && result.url) {
        setFaceCaptureUrl(result.url);
        setUploadProgress('');
        setStep(3);
      } else {
        setError(result.error || 'Failed to upload face photo. Please try again.');
        setUploadProgress('');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to process face capture. Please try again.');
      setUploadProgress('');
    } finally { setLoading(false); }
  };

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!governmentIdUrl || !faceCaptureUrl) {
      setError('Missing required documents. Please complete all steps.');
      return;
    }
    setLoading(true); setError(''); setUploadProgress('Submitting your KYC...');
    try {
      const result = await submitKYC(governmentIdType, governmentIdUrl, faceCaptureUrl);
      if (result.success) {
        setSuccess(true); setStep(4);
      } else {
        setError(result.error || 'Submission failed. Please try again.');
      }
    } catch (e: any) {
      setError(e?.message || 'Network error. Please check your connection and try again.');
    } finally { setLoading(false); setUploadProgress(''); }
  };

  const steps = [
    { num: 1, label: 'Government ID', icon: <FileText style={{ width: 15, height: 15 }} /> },
    { num: 2, label: 'Face Capture',  icon: <Camera   style={{ width: 15, height: 15 }} /> },
    { num: 3, label: 'Review',        icon: <Eye      style={{ width: 15, height: 15 }} /> },
    { num: 4, label: 'Done',          icon: <CheckCircle style={{ width: 15, height: 15 }} /> },
  ];

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (checkingStatus) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── EXISTING SUBMISSION STATUS ────────────────────────────────────────────
  if (existingSubmission && !success) {
    const status = existingSubmission.status;
    const cfg = {
      pending:  { icon: <Clock style={{ width: 44, height: 44, color: '#ffc107' }} />, bg: 'rgba(255,193,7,0.15)', border: 'rgba(255,193,7,0.3)', title: 'KYC Under Review', color: '#ffc107', message: 'Your documents have been submitted and are under review. Our team will verify your identity within 24–48 hours.' },
      approved: { icon: <CheckCircle style={{ width: 44, height: 44, color: '#00B894' }} />, bg: 'rgba(0,184,148,0.15)', border: 'rgba(0,184,148,0.3)', title: 'KYC Approved!', color: '#00B894', message: 'Your identity has been verified. You are now an approved Philanthropist.' },
      rejected: { icon: <XCircle style={{ width: 44, height: 44, color: '#ff6b6b' }} />, bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.3)', title: 'KYC Not Approved', color: '#ff6b6b', message: existingSubmission.rejection_reason ? `Reason: ${existingSubmission.rejection_reason}` : 'Please resubmit with clearer documents.' },
    }[status as 'pending' | 'approved' | 'rejected'] || { icon: <Clock style={{ width: 44, height: 44, color: '#ffc107' }} />, bg: 'rgba(255,193,7,0.15)', border: 'rgba(255,193,7,0.3)', title: 'KYC Pending', color: '#ffc107', message: 'Your submission is being processed.' };

    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '50px 32px', backgroundColor: '#0F1F35', border: `1px solid ${cfg.border}`, borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: cfg.bg, border: `2px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          {cfg.icon}
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 12 }}>{cfg.title}</h2>
        <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.8, marginBottom: 32 }}>{cfg.message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => window.location.href = '/beneficiary-dashboard'} style={{ padding: '13px 28px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
          {status === 'approved' && (
            <button onClick={() => window.location.href = '/philanthropist/dashboard'} style={{ padding: '13px 28px', borderRadius: 12, background: 'linear-gradient(to right, #00B894, #00CEC9)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              Philanthropist Dashboard
            </button>
          )}
          {status === 'rejected' && (
            <button onClick={() => setExistingSubmission(null)} style={{ padding: '13px 28px', borderRadius: 12, background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', fontWeight: 700, fontSize: 14, border: '1px solid rgba(255,107,107,0.3)', cursor: 'pointer' }}>
              Resubmit KYC
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (step === 4 && success) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '60px 32px', backgroundColor: '#0F1F35', border: '1px solid rgba(0,184,148,0.3)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(0,184,148,0.15)', border: '2px solid rgba(0,184,148,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle style={{ width: 44, height: 44, color: '#00B894' }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12 }}>KYC Submitted!</h2>
        <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.8, marginBottom: 32 }}>
          Your verification documents have been submitted successfully.<br />
          Our team will review and notify you within 24–48 hours.
        </p>
        <button onClick={() => window.location.href = '/beneficiary-dashboard'} style={{ padding: '14px 36px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
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

      {/* Step Indicator */}
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

      {/* Upload progress */}
      {uploadProgress && (
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', backgroundColor: 'rgba(0,206,201,0.08)', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 12, alignItems: 'center' }}>
          <div style={{ width: 16, height: 16, border: '2px solid rgba(0,206,201,0.3)', borderTop: '2px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#00CEC9', margin: 0 }}>{uploadProgress}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px', backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12 }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ff6b6b', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#ffb3b3', margin: 0, flex: 1 }}>{error}</p>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 0 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* Card */}
      <div style={{ backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.15)', borderRadius: 20, padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* STEP 1 — Government ID */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottom: '1px solid rgba(0,206,201,0.1)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText style={{ width: 20, height: 20, color: '#00CEC9' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Upload Government ID</h2>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>A clear photo or scan of your government-issued ID</p>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>ID Type</label>
              <select value={governmentIdType} onChange={e => setGovernmentIdType(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                <option value="passport">Passport</option>
                <option value="national_id">National ID Card</option>
                <option value="driver_license">Driver License</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Upload {governmentIdType === 'passport' ? 'Passport' : governmentIdType === 'national_id' ? 'National ID' : 'Driver License'}
              </label>
              {governmentIdPreview ? (
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <img src={governmentIdPreview} alt="ID Preview" style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(0,206,201,0.3)', maxHeight: 200, objectFit: 'cover' }} />
                  {!loading && (
                    <button onClick={() => { setGovernmentIdFile(null); setGovernmentIdPreview(''); setGovernmentIdUrl(''); }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(255,107,107,0.8)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', border: '2px dashed rgba(0,206,201,0.3)', borderRadius: 14, cursor: loading ? 'not-allowed' : 'pointer', backgroundColor: 'rgba(0,206,201,0.03)', gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {loading ? <div style={{ width: 24, height: 24, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: 22, height: 22, color: '#00CEC9' }} />}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 4px' }}>{loading ? 'Uploading...' : 'Click to upload'}</p>
                    <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>JPG, PNG, WEBP or PDF · Max 10MB</p>
                  </div>
                  <input type="file" onChange={handleGovernmentIdUpload} style={{ display: 'none' }} accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf" disabled={loading} />
                </label>
              )}
              {governmentIdFile && governmentIdUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '10px 14px', backgroundColor: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)', borderRadius: 10 }}>
                  <CheckCircle style={{ width: 16, height: 16, color: '#00B894', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#00B894', margin: 0 }}>{governmentIdFile.name} — uploaded successfully</p>
                </div>
              )}
            </div>
            {governmentIdUrl && (
              <button onClick={() => setStep(2)} style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                Continue to Face Capture →
              </button>
            )}
          </div>
        )}

        {/* STEP 2 — Face Capture */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottom: '1px solid rgba(0,206,201,0.1)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera style={{ width: 20, height: 20, color: '#00CEC9' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Live Face Capture</h2>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Take a clear selfie in a well-lit area</p>
              </div>
            </div>
            {!cameraActive && !faceCaptureDataUrl && (
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Camera style={{ width: 36, height: 36, color: '#00CEC9' }} />
                </div>
                <p style={{ fontSize: 14, color: '#8FA3BF', marginBottom: 24, lineHeight: 1.6 }}>
                  Ensure good lighting and look directly at the camera.<br />Remove glasses or hats if possible.
                </p>
                <button onClick={startCamera} style={{ padding: '13px 32px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Camera style={{ width: 18, height: 18 }} /> Start Camera
                </button>
              </div>
            )}
            {cameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', backgroundColor: '#000', border: '1px solid rgba(0,206,201,0.2)' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', borderRadius: 14 }} />
                  {!cameraReady && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,22,40,0.8)', borderRadius: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 36, height: 36, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 13, color: '#8FA3BF' }}>Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={stopCamera} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'transparent', color: '#8FA3BF', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={captureFace} disabled={!cameraReady} style={{ flex: 2, padding: '12px', borderRadius: 12, background: cameraReady ? 'linear-gradient(to right, #00CEC9, #00B894)' : 'rgba(0,206,201,0.3)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: cameraReady ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Camera style={{ width: 18, height: 18 }} />{cameraReady ? 'Capture Photo' : 'Waiting...'}
                  </button>
                </div>
              </div>
            )}
            {faceCaptureDataUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
                  <img src={faceCaptureDataUrl} alt="Face capture" style={{ width: '100%', borderRadius: 14, border: '1px solid rgba(0,206,201,0.2)' }} />
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', borderRadius: 999, backgroundColor: 'rgba(0,184,148,0.9)', color: 'white', fontSize: 12, fontWeight: 600 }}>Captured ✓</div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => { setFaceCaptureDataUrl(''); setFaceCaptureUrl(''); }} disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'transparent', color: '#00CEC9', fontWeight: 700, fontSize: 14, border: '1px solid rgba(0,206,201,0.4)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                    <RefreshCw style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Retake
                  </button>
                  <button onClick={handleFaceCaptureUpload} disabled={loading} style={{ flex: 2, padding: '12px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Uploading...' : 'Use This Photo →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Review */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottom: '1px solid rgba(0,206,201,0.1)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Eye style={{ width: 20, height: 20, color: '#00CEC9' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Review and Submit</h2>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Confirm your documents before submitting</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(0,206,201,0.03)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#8FA3BF', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Government ID</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle style={{ width: 18, height: 18, color: '#00B894', flexShrink: 0 }} />
                  <p style={{ fontSize: 14, color: 'white', margin: 0, fontWeight: 500, textTransform: 'capitalize' }}>{governmentIdType.replace('_', ' ')} — uploaded</p>
                </div>
                {governmentIdPreview && <img src={governmentIdPreview} alt="ID" style={{ width: '100%', borderRadius: 8, marginTop: 10, maxHeight: 120, objectFit: 'cover', border: '1px solid rgba(0,206,201,0.2)' }} />}
              </div>
              <div style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(0,206,201,0.03)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#8FA3BF', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Face Capture</p>
                <img src={faceCaptureDataUrl} alt="Face" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)' }} />
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.12)', display: 'flex', gap: 10 }}>
                <Shield style={{ width: 16, height: 16, color: '#00CEC9', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0, lineHeight: 1.6 }}>Your documents are securely encrypted and stored. They are only used for identity verification.</p>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(0,206,201,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Send style={{ width: 18, height: 18 }} />
              {loading ? 'Submitting...' : 'Submit KYC Verification'}
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
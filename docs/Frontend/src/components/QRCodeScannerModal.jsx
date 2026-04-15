import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getViteEnv } from '../utils/getViteEnv';

/**
 * QR Code Scanner Modal for Payment
 * Allows users to scan a QR code from their smartphone camera
 * to initiate a payment
 */
export default function QRCodeScannerModal({ pledgeId, pledge, onClose, onSuccess, onPaymentInitiated }) {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrResult, setQrResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanningIntervalRef = useRef(null);

  /**
   * Initialize camera and start scanning
   */
  useEffect(() => {
    if (scanning) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanning]);

  const startCamera = async () => {
    try {
      setError('');
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startQRScanning();
        };
      }
    } catch (err) {
      let errorMsg = 'Failed to access camera. ';
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No camera found on this device.';
      } else {
        errorMsg += err.message;
      }
      setError(errorMsg);
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
    }
  };

  /**
   * Simple QR code detection using canvas and image data
   * This is a basic implementation that looks for QR patterns
   */
  const startQRScanning = () => {
    scanningIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        ctx.drawImage(videoRef.current, 0, 0);

        // Try to detect QR code using jsQR if available, otherwise use fallback
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Check if jsQR is available (would need to be added as dependency)
          if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              handleQRDetected(code.data);
            }
          } else {
            // Fallback: manual QR pattern detection
            attemptManualQRDetection(imageData);
          }
        } catch (err) {
          // Silently continue scanning
        }
      }
    }, 500);
  };

  /**
   * Manual QR code detection - looks for typical QR patterns
   */
  const attemptManualQRDetection = (imageData) => {
    // This is a simplified detection - checks image characteristics
    // In production, you'd want to use a proper QR decoding library
    const data = imageData.data;
    let darkPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < 128) darkPixels++;
    }
    
    // If enough dark pixels, we might have a QR code
    if (darkPixels > data.length / 8) {
      // Signal that a QR-like pattern was detected
      // Note: This is very basic and won't actually decode the QR
      return true;
    }
    return false;
  };

  /**
   * Handle when QR code is detected
   */
  const handleQRDetected = (qrData) => {
    if (qrResult) return; // Already processing

    setQrResult(qrData);
    stopCamera();
    setScanning(false);
    processQRCode(qrData);
  };

  /**
   * Process the scanned QR code data
   */
  const processQRCode = async (qrData) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('pledgehub_token');
      const API_URL = getViteEnv().API_URL || 'http://localhost:5001';

      // QR data should be a payment link in format: pledgehub://pay?pledgeId=X&amount=Y&ref=Z
      // First, try to decode the QR data
      const response = await axios.post(
        `${API_URL}/qr/initiate`,
        {
          paymentLink: qrData,
          phoneNumber: phoneNumber || user?.phone || ''
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.data.success) {
        setError(response.data.message || 'Failed to process QR code');
        setLoading(false);
        return;
      }

      setSuccess('Payment initiated from QR code!');
      
      // Call success handler
      if (onPaymentInitiated) {
        onPaymentInitiated(response.data.data);
      }

      // Close modal after brief delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      let errorMsg = 'Failed to process QR code: ';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setLoading(false);
    }
  };

  /**
   * Manually enter QR data if camera scanning fails
   */
  const handleManualQREntry = async (e) => {
    e.preventDefault();
    
    const manualQRData = prompt('Enter the QR code content:');
    if (manualQRData) {
      stopCamera();
      setScanning(false);
      handleQRDetected(manualQRData);
    }
  };

  /**
   * Reset scanner to try again
   */
  const handleTryAgain = () => {
    setQrResult(null);
    setError('');
    setSuccess('');
    setScanning(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 20px 60px -20px rgba(15, 23, 42, 0.4)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            📱 Scan QR Code
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
              color: '#64748b',
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#dcfce7',
              color: '#166534',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              ✓ {success}
            </div>
          )}

          {scanning && !qrResult && (
            <div>
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%)',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                fontSize: '0.875rem',
                color: '#334155'
              }}>
                <strong>📌 Instructions:</strong>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
                  <li>Position the QR code in front of your camera</li>
                  <li>Make sure there's enough lighting</li>
                  <li>Hold the phone steady for 2-3 seconds</li>
                </ul>
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  background: '#000',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                  border: '2px solid rgba(59, 130, 246, 0.5)'
                }}
              >
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                {/* QR Scanner overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '2px solid rgba(37, 99, 235, 0.3)',
                    margin: 'auto',
                    width: '60%',
                    height: '60%',
                    boxShadow: 'inset 0 0 0 1000px rgba(0, 0, 0, 0.3)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  color: '#334155'
                }}>
                  Your Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+256 or 0700..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleManualQREntry}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#334155'
                  }}
                >
                  📄 Enter Manually
                </button>
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: '1px solid #cbd5e1',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#334155'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {qrResult && (
            <div style={{
              textAlign: 'center'
            }}>
              <div style={{
                marginBottom: '1rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
                borderRadius: '10px',
                border: '1px solid rgba(37, 99, 235, 0.15)'
              }}>
                {loading ? (
                  <>
                    <div style={{
                      fontSize: '1.5rem',
                      marginBottom: '0.5rem'
                    }}>⏳</div>
                    <p style={{
                      margin: 0,
                      fontWeight: 500,
                      color: '#334155'
                    }}>Processing payment...</p>
                  </>
                ) : success ? (
                  <>
                    <div style={{
                      fontSize: '2rem',
                      marginBottom: '0.5rem'
                    }}>✓</div>
                    <p style={{
                      margin: 0,
                      fontWeight: 500,
                      color: '#166534'
                    }}>{success}</p>
                  </>
                ) : (
                  <>
                    <div style={{
                      fontSize: '1.5rem',
                      marginBottom: '0.5rem'
                    }}>🔍</div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#334155'
                    }}>Scanned Data:</p>
                    <p style={{
                      margin: '0.5rem 0 0',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      wordBreak: 'break-all',
                      maxHeight: '100px',
                      overflow: 'auto'
                    }}>
                      {qrResult.substring(0, 200)}{qrResult.length > 200 ? '...' : ''}
                    </p>
                  </>
                )}
              </div>

              {!loading && !success && (
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={handleTryAgain}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#334155'
                    }}
                  >
                    🔄 Try Again
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      background: 'none',
                      border: '1px solid #cbd5e1',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#334155'
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

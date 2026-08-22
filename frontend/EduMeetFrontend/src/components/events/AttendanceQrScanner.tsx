import type { IScannerControls } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';

interface AttendanceQrScannerProps {
  disabled?: boolean;
  onCodeDetected: (attendanceToken: string) => Promise<void>;
}

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera permission was denied. Allow camera access in your browser settings or enter the code manually.';
    }

    if (error.name === 'NotFoundError') {
      return 'No camera was found on this device.';
    }

    if (error.name === 'NotReadableError') {
      return 'The camera is already being used by another application.';
    }
  }

  return 'The camera could not be started. You can still enter the attendance code manually.';
}

function AttendanceQrScanner({
  disabled = false,
  onCodeDetected,
}: AttendanceQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scanLockedRef = useRef(false);
  const mountedRef = useRef(true);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  };

  const startScanner = async () => {
    if (!videoRef.current || disabled) return;

    stopScanner();
    setCameraError('');
    setHasScanned(false);
    scanLockedRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Camera access requires HTTPS or localhost. You can enter the attendance code manually.',
      );
      return;
    }

    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader();

      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
          },
        },
        videoRef.current,
        (result, _error, activeControls) => {
          if (!result || scanLockedRef.current) return;

          const attendanceToken = result.getText().trim();
          if (!attendanceToken) return;

          scanLockedRef.current = true;
          activeControls.stop();
          controlsRef.current = null;

          if (mountedRef.current) {
            setIsScanning(false);
            setHasScanned(true);
          }

          void onCodeDetected(attendanceToken);
        },
      );

      if (!mountedRef.current) {
        controls.stop();
        return;
      }

      if (scanLockedRef.current) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;
      setIsScanning(true);
    } catch (error) {
      if (!mountedRef.current) return;

      setIsScanning(false);
      setCameraError(getCameraErrorMessage(error));
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!disabled || !controlsRef.current) return;

    controlsRef.current.stop();
    controlsRef.current = null;
    setIsScanning(false);
  }, [disabled]);

  return (
    <section className="attendance-scanner" aria-labelledby="scanner-title">
      <div className="attendance-section-heading">
        <div>
          <p className="eyebrow">Camera check-in</p>
          <h2 id="scanner-title">Scan an attendance QR code</h2>
        </div>
        <span className={isScanning ? 'is-live' : ''}>
          {isScanning ? 'Camera live' : 'Camera off'}
        </span>
      </div>

      <div className={`attendance-camera-frame ${isScanning ? 'is-live' : ''}`}>
        <video ref={videoRef} muted playsInline aria-label="Camera preview" />
        {!isScanning ? (
          <div className="attendance-camera-placeholder">
            <strong>Ready when you are</strong>
            <p>Place the attendee&apos;s QR code in front of the laptop camera.</p>
          </div>
        ) : (
          <div className="attendance-scan-guide" aria-hidden="true" />
        )}
      </div>

      {cameraError ? (
        <p className="publish-error attendance-camera-error" role="alert">
          {cameraError}
        </p>
      ) : null}

      <div className="attendance-scanner-actions">
        {isScanning ? (
          <button
            className="button button-secondary"
            type="button"
            onClick={stopScanner}
          >
            Stop camera
          </button>
        ) : (
          <button
            className="button button-primary"
            type="button"
            disabled={disabled}
            onClick={() => void startScanner()}
          >
            {hasScanned ? 'Scan next attendee' : 'Open camera'}
          </button>
        )}
      </div>
    </section>
  );
}

export default AttendanceQrScanner;

import React, { useEffect, useRef, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onScanError, ...props }) => {
  const uniqueId = useId();
  const readerId = `barcode-reader-${uniqueId.replace(/:/g, '')}`;
  const readerRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Ensure this runs only once
    if (!readerRef.current) {
      return;
    }

    // Create a new scanner instance if it doesn't exist
    if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerId);
    }
    const html5Qrcode = scannerRef.current;

    const config = {
      fps: 10,
      qrbox: { width: 300, height: 120 }, // Wider and shorter for barcode
      rememberLastUsedCamera: true,
      // Support both QR and barcode scanning
      supportedScanTypes: [0, 1] // 0 for QR, 1 for barcode
    };

    // Success and error callbacks
    const handleSuccess = (decodedText, decodedResult) => {
      if (onScanSuccess) {
        onScanSuccess(decodedText, decodedResult);
      }
    };

    const handleError = (error) => {
      if (onScanError) {
        onScanError(error);
      }
    };
    
    // Check camera permissions and start scanning
    Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
            html5Qrcode.start(
                { facingMode: "environment" }, // Use the rear camera
                config,
                handleSuccess,
                handleError
            ).catch(err => {
                console.error("Failed to start scanner", err);
                if (onScanError) {
                    onScanError(err);
                }
            });
        }
    }).catch(err => {
        console.error("Failed to get cameras", err);
        if (onScanError) {
            onScanError(err);
        }
    });


    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          console.log("Scanner stopped.");
          scannerRef.current = null;
        }).catch(err => {
          console.error("Failed to stop scanner", err);
        });
      }
    };
  }, [onScanSuccess, onScanError, readerId]);

  return (
    <div className="barcode-scanner-wrapper" style={{ position: 'relative', ...props.style }}>
      <div id={readerId} ref={readerRef} {...props} />
      {/* Custom scanning overlay */}
      <div className="scanner-overlay">
        <div className="scanner-frame">
          <div className="scanner-corner top-left"></div>
          <div className="scanner-corner top-right"></div>
          <div className="scanner-corner bottom-left"></div>
          <div className="scanner-corner bottom-right"></div>
          <div className="scanner-line"></div>
        </div>
        <p className="scanner-hint">Position barcode within the frame</p>
      </div>
    </div>
  );
};

export default BarcodeScanner;

import React, { useEffect, useRef, useState, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Flame, Flashlight } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onScanError, ...props }) => {
  const uniqueId = useId();
  const readerId = `barcode-reader-${uniqueId.replace(/:/g, '')}`;
  const readerRef = useRef(null);
  const scannerRef = useRef(null);
  const [torchOn, setTorchOn] = useState(false);
  
  // Track recent scans for stabilization
  const lastScans = useRef({});

  const toggleTorch = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        const newState = !torchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: newState }]
        });
        setTorchOn(newState);
      } catch (err) {
        console.error("Torch not supported:", err);
      }
    }
  };

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

    // IMPROVED CONFIGURATION FOR BETTER ACCURACY
    const config = {
      fps: 20, // Higher FPS for better detection
      qrbox: { width: 350, height: 150 }, // Wider and shorter for barcode
      rememberLastUsedCamera: true,
    };

    // SUCCESS CALLBACK WITH SCAN STABILIZATION
    // Requires same value detected 3 times within 1.5 seconds before confirming
    const handleSuccess = (decodedText, decodedResult) => {
      const now = Date.now();
      
      // Initialize or update scan record
      if (!lastScans.current[decodedText]) {
        lastScans.current[decodedText] = { count: 1, time: now };
      } else {
        lastScans.current[decodedText].count += 1;
      }

      // Require 3 confirmations within 1.5 seconds to confirm scan
      if (
        lastScans.current[decodedText].count >= 3 &&
        now - lastScans.current[decodedText].time < 1500
      ) {
        // Scan confirmed - trigger success callback
        if (onScanSuccess) {
          onScanSuccess(decodedText, decodedResult);
        }
        // Reset after successful scan
        lastScans.current = {};
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
      // Reset scan tracking
      lastScans.current = {};
      
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
      
      {/* Torch/Flash Toggle Button with Lucide Icons */}
      <button
        onClick={toggleTorch}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 100,
          background: torchOn ? '#fbbf24' : 'rgba(0,0,0,0.6)',
          border: 'none',
          borderRadius: '50%',
          width: 44,
          height: 44,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          transition: 'background-color 0.2s ease',
        }}
        title={torchOn ? 'Turn off flash' : 'Turn on flash'}
      >
        {torchOn ? (
          <Flame 
            size={24} 
            color={torchOn ? '#000000' : '#FFFFFF'}
            strokeWidth={2.5}
          />
        ) : (
          <Flashlight 
            size={24} 
            color="#FFFFFF"
            strokeWidth={2.5}
          />
        )}
      </button>
      
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

      {/* Add some basic styles for the scanner overlay */}
      <style jsx>{`
        .scanner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .scanner-frame {
          position: relative;
          width: 350px;
          height: 150px;
          border-radius: 8px;
        }
        
        .scanner-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border-color: #fbbf24;
          border-style: solid;
        }
        
        .top-left {
          top: 0;
          left: 0;
          border-width: 2px 0 0 2px;
          border-radius: 8px 0 0 0;
        }
        
        .top-right {
          top: 0;
          right: 0;
          border-width: 2px 2px 0 0;
          border-radius: 0 8px 0 0;
        }
        
        .bottom-left {
          bottom: 0;
          left: 0;
          border-width: 0 0 2px 2px;
          border-radius: 0 0 0 8px;
        }
        
        .bottom-right {
          bottom: 0;
          right: 0;
          border-width: 0 2px 2px 0;
          border-radius: 0 0 8px 0;
        }
        
        .scanner-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #fbbf24, transparent);
          animation: scan 2s linear infinite;
        }
        
        .scanner-hint {
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          margin-top: 16px;
          font-size: 14px;
          background: rgba(0,0,0,0.6);
          padding: 8px 16px;
          border-radius: 20px;
        }
        
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
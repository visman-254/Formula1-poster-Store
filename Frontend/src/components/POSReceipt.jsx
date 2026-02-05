import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import "./POSReceipt.css";
import elegantwaterBg from "../assets/elegantwater.jpg";
import logo from "../assets/pmc.png";

const POSReceipt = ({ receipt, onNewSale }) => {
  const [qrUrl, setQrUrl] = useState("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(true);
  const [securityCode] = useState(() => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [isMobile, setIsMobile] = useState(false);
  const [printMethod, setPrintMethod] = useState("auto");

  useEffect(() => {
    // Detect if user is on mobile
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    setIsMobile(checkMobile());
  }, []);

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      setIsGeneratingQR(true);
      try {
        const url = await QRCode.toDataURL(
          `https://pannamusic.co.ke/verify/${receipt.orderId}`
        );
        setQrUrl(url);
      } catch (error) {
        console.error("QR generation failed:", error);
      } finally {
        setIsGeneratingQR(false);
      }
    };
    generateQR();
  }, [receipt.orderId]);

  const formatTime = () =>
    new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });

  // Create the print content HTML using OLD DESIGN
  const createPrintContent = (qrUrl) => {
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt #${receipt.orderId}</title>

<style>
@page { margin: 0; size: 58mm auto; }

body {
  margin: 0;
  font-family: "Courier New", Consolas, monospace;
  font-size: 12px;
  background: white;
}

.thermal {
  width: 58mm;
  padding: 4mm;
  text-align: center;
}

.logo {
  width: 85px;
  margin: 0 auto 6px;
  display: block;
}

.divider {
  letter-spacing: 2px;
  margin: 6px 0;
}

.meta, .footer {
  text-align: left;
  margin: 6px 0;
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 3px 0;
}

.item {
  margin: 6px 0;
  border-bottom: 1px dotted #999;
  padding-bottom: 6px;
}

.total {
  border-top: 2px dashed #000;
  border-bottom: 2px dashed #000;
  margin: 8px 0;
  padding: 8px 0;
  font-size: 16px;
  font-weight: bold;
}

.qr {
  width: 100px;
  margin: 6px auto;
}

/* Mobile instructions */
.mobile-print-guide {
  display: none;
  background: #f8f9fa;
  border: 2px solid #007bff;
  border-radius: 12px;
  padding: 20px;
  margin: 25px auto;
  max-width: 500px;
  text-align: left;
}

.mobile-print-guide h3 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
  font-size: 18px;
}

.mobile-print-guide ol {
  margin: 0;
  padding-left: 20px;
}

.mobile-print-guide li {
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.4;
}

.print-button {
  display: none;
  width: 90%;
  max-width: 300px;
  margin: 25px auto;
  padding: 18px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  text-align: center;
}

@media screen {
  .mobile-print-guide {
    display: ${isMobile ? 'block' : 'none'};
  }
  
  .print-button {
    display: block;
  }
}

@media print {
  body * {
    visibility: hidden;
  }
  
  .thermal, .thermal * {
    visibility: visible;
  }
  
  .thermal {
    position: absolute;
    left: 0;
    top: 0;
  }
  
  .mobile-print-guide,
  .print-button {
    display: none !important;
  }
}
</style>
</head>
<body>
<div class="thermal">

<img src="${logo}" class="logo"/>

<div class="divider">* * * * * * * *</div>

<div class="meta">
  <div class="row"><span>Order:</span><span>#${receipt.orderId}</span></div>
  <div class="row"><span>Cashier:</span><span>${receipt.cashier}</span></div>
  <div class="row"><span>Date:</span><span>${formatTime()}</span></div>
</div>

<div class="divider">-------------------------</div>

${receipt.items
  .map(
    (item) => `
<div class="item">
  <div>${item.name}</div>
  <div class="row">
    <span>Qty: ${item.quantity}</span>
    <span>Ksh ${item.total.toLocaleString("en-KE")}</span>
  </div>
  ${item.imei ? `<div>IMEI: ${item.imei}</div>` : ""}
</div>`
  )
  .join("")}

<div class="total">
  TOTAL: Ksh ${receipt.total.toLocaleString("en-KE")}
</div>

<img src="${qrUrl}" class="qr"/>

<div>Verify Receipt</div>

<div class="divider">-------------------------</div>

<div>Security Code: ${securityCode}</div>

<div class="footer">
  <p>Thank you for shopping ❤️</p>
  <p>Panna Store</p>
  <p>0711 772 995</p>
</div>

</div>

${isMobile ? `
<div class="mobile-print-guide">
  <h3>📱 Mobile Printing Instructions</h3>
  <ol>
    <li>Tap the <strong>"Print Receipt"</strong> button below</li>
    <li>In the print preview screen:</li>
    <li>• Select your printer</li>
    <li>• Set paper size to <strong>58mm</strong></li>
    <li>• Disable headers and footers</li>
    <li>• If using thermal printer, select <strong>"Save as PDF"</strong> first</li>
  </ol>
  <p style="text-align: center; margin-top: 15px; font-size: 12px;">
    💡 <strong>Alternative:</strong> Use browser menu (⋮) → "Print"
  </p>
</div>
` : ''}

<button class="print-button" onclick="window.print()">
  ${isMobile ? '🖨️ TAP TO PRINT RECEIPT' : '📄 Print Receipt Now'}
</button>

<script>
  // Try auto-print on desktop (not mobile)
  if (!${isMobile}) {
    setTimeout(() => {
      try {
        window.print();
        setTimeout(() => {
          if (window.opener === null) {
            window.close();
          }
        }, 1000);
      } catch (error) {
        console.log("Auto-print failed, manual button available");
      }
    }, 800);
  }
  
  // Listen for print completion
  window.addEventListener('afterprint', function() {
    setTimeout(function() {
      if (window.opener === null && !window.closed) {
        window.close();
      }
    }, 500);
  });
</script>

</body>
</html>`;
  };

  // Method 1: Auto print (works best on desktop)
  const handleAutoPrint = async () => {
    try {
      const qrUrl = await QRCode.toDataURL(
        `https://pannamusic.co.ke/verify/${receipt.orderId}`
      );
      
      const printContent = createPrintContent(qrUrl);
      const printWindow = window.open('', '_blank', 
        isMobile ? 'width=380,height=700,scrollbars=yes' : 'width=500,height=700'
      );
      
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setPrintMethod("popup");
      } else {
        // Popup blocked, try iframe
        handleIframePrint(qrUrl);
      }
    } catch (error) {
      console.error("Auto print failed:", error);
      alert("Printing failed. Please try the alternative method.");
    }
  };

  // Method 2: Iframe print (works when popups are blocked)
  const handleIframePrint = async (qrUrl) => {
    try {
      const printContent = createPrintContent(qrUrl);
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        position: fixed;
        width: 0;
        height: 0;
        border: none;
        opacity: 0;
        pointer-events: none;
      `;
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      
      // Wait for content to load
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 500);
      
      setPrintMethod("iframe");
    } catch (error) {
      console.error("Iframe print failed:", error);
      handleDownloadPDF();
    }
  };

  // Method 3: Download as HTML for manual printing
  const handleDownloadPDF = async () => {
    try {
      const qrUrl = await QRCode.toDataURL(
        `https://pannamusic.co.ke/verify/${receipt.orderId}`
      );
      
      const printContent = createPrintContent(qrUrl);
      const blob = new Blob([printContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receipt.orderId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(
        "📄 Receipt downloaded!\n\n" +
        "1. Open the downloaded file\n" +
        "2. Use Ctrl+P (Cmd+P on Mac) to print\n" +
        "3. Set paper size to 58mm"
      );
      
      setPrintMethod("download");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download receipt. Please try a different browser.");
    }
  };

  // Main print handler with fallbacks
  const handlePrint = async () => {
    if (isMobile) {
      // On mobile, try auto print first, then fallback
      try {
        await handleAutoPrint();
      } catch (error) {
        // If auto fails, show mobile-specific modal
        showMobilePrintModal();
      }
    } else {
      // On desktop, use auto print
      await handleAutoPrint();
    }
  };

  // Mobile-specific print modal with instructions
  const showMobilePrintModal = () => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 20px;
        max-width: 400px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <h3 style="color: #007bff; margin-bottom: 20px; font-size: 22px;">
          📱 Mobile Printing
        </h3>
        
        <div style="text-align: left; margin-bottom: 25px;">
          <p style="margin-bottom: 15px; font-size: 16px;">
            <strong>Follow these steps:</strong>
          </p>
          <ol style="padding-left: 20px; margin-bottom: 25px;">
            <li style="margin-bottom: 10px;">Allow popups for this site</li>
            <li style="margin-bottom: 10px;">Tap "Try Auto Print" below</li>
            <li style="margin-bottom: 10px;">In print preview, select printer</li>
            <li style="margin-bottom: 10px;">Set paper size to <strong>58mm</strong></li>
          </ol>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              💡 <strong>Alternative:</strong> Use browser menu (⋮) → "Print"
            </p>
          </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button onclick="
            this.parentElement.parentElement.parentElement.remove();
            window.printReceiptAuto();
          " style="
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          ">
            🖨️ Try Auto Print
          </button>
          
          <button onclick="
            this.parentElement.parentElement.parentElement.remove();
            window.printReceiptDownload();
          " style="
            padding: 16px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          ">
            📥 Download & Print
          </button>
          
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            padding: 16px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            cursor: pointer;
          ">
            Cancel
          </button>
        </div>
        
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Using <strong>Chrome</strong> or <strong>Safari</strong> recommended
        </p>
      </div>
    `;
    
    // Add global functions for the modal buttons
    window.printReceiptAuto = handleAutoPrint;
    window.printReceiptDownload = handleDownloadPDF;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        delete window.printReceiptAuto;
        delete window.printReceiptDownload;
      }
    });
  };

  return (
    <div
      className="receipt-container"
      style={{ backgroundImage: `url(${elegantwaterBg})` }}
    >
      <div className="receipt-overlay" />

      <div className="receipt-wrap">
        <div className="receipt-paper">

          <img src={logo} alt="logo" className="receipt-logo-premium" />

          <div className="receipt-divider">✦ ✦ ✦ ✦ ✦ ✦</div>

          <div className="receipt-meta">
            <p><strong>Order:</strong> #{receipt.orderId}</p>
            <p><strong>Cashier:</strong> {receipt.cashier}</p>
            <p><strong>Date:</strong> {formatTime()}</p>
          </div>

          <div className="receipt-items">
            {receipt.items.map((item, index) => (
              <div key={index} className="receipt-row">
                <div>
                  <strong>{item.name}</strong>
                  {item.imei && <div className="imei">IMEI: {item.imei}</div>}
                </div>
                <span>Ksh {item.total.toLocaleString("en-KE")}</span>
              </div>
            ))}
          </div>

          <div className="receipt-total-premium">
            TOTAL: Ksh {receipt.total.toLocaleString("en-KE")}
          </div>

          {isGeneratingQR ? (
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              Generating QR code...
            </div>
          ) : qrUrl ? (
            <img 
              src={qrUrl} 
              alt="QR Code" 
              style={{ 
                width: "120px", 
                display: "block", 
                margin: "20px auto" 
              }} 
            />
          ) : null}

          <div className="receipt-footer">
            <p>Security Code: {securityCode}</p>
            <p>Thank you for shopping ❤️</p>
            <p>Panna Store • 0711 772 995</p>
          </div>

        </div>

        <div className="receipt-actions">
          <button className="btn-print" onClick={handlePrint}>
            {isMobile ? " Print Receipt" : " Print Receipt"}
          </button>
          
          <button className="btn-new-sale" onClick={onNewSale}>
             New Sale
          </button>
          
          {isMobile && (
            <div className="mobile-print-tips">
              <h4> Mobile Printing Tips</h4>
              <ul>
                <li>Use <strong>Chrome</strong> browser for best results</li>
                <li>Allow popups when prompted</li>
                <li>Set paper size to <strong>58mm</strong></li>
                <li>Disable headers & footers in print settings</li>
              </ul>
              <p className="tiny">
                💡 If print button doesn't work: Browser menu → "Print"
              </p>
            </div>
          )}
          
          <div className="print-method-info">
            <small>
              Method: <strong>{printMethod}</strong> • 
              {isMobile ? "  Mobile mode" : "  Desktop mode"}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSReceipt;
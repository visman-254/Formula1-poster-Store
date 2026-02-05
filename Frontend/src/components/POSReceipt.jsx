import React, { useRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import "./POSReceipt.css";
import elegantwaterBg from "../assets/elegantwater.jpg";
import logo from "../assets/pmc.png";

const POSReceipt = ({ receipt, onNewSale }) => {
  const componentRef = useRef();
  const [qrUrl, setQrUrl] = useState("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(true);
  const [securityCode] = useState(() => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

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

  // SIMPLE PRINT FUNCTION - Goes back to the old reliable method
  const handlePrint = async () => {
    const thermalWidth = 58;
    const qrUrl = await QRCode.toDataURL(
      `https://pannamusic.co.ke/verify/${receipt.orderId}`
    );

    const printWindow = window.open("", "_blank", "width=400,height=600");
    
    if (!printWindow) {
      // If popup is blocked, use iframe method
      alert("Popup was blocked. Please allow popups for this site or use Ctrl+P to print.");
      
      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt #${receipt.orderId}</title>
<style>
@page { margin: 0; size: ${thermalWidth}mm auto; }
body {
  margin: 0;
  font-family: "Courier New", Consolas, monospace;
  font-size: 12px;
  background: white;
}
.thermal {
  width: ${thermalWidth}mm;
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
.print-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  margin: 20px auto;
  display: block;
  cursor: pointer;
  font-size: 16px;
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
${receipt.items.map((item) => `
<div class="item">
  <div>${item.name}</div>
  <div class="row">
    <span>Qty: ${item.quantity}</span>
    <span>Ksh ${item.total.toLocaleString("en-KE")}</span>
  </div>
  ${item.imei ? `<div>IMEI: ${item.imei}</div>` : ""}
</div>`).join("")}
<div class="total">TOTAL: Ksh ${receipt.total.toLocaleString("en-KE")}</div>
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
<button class="print-btn" onclick="window.print()">📄 Print Receipt</button>
</body>
</html>
      `);
      iframeDoc.close();
      
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
      
      return;
    }

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt #${receipt.orderId}</title>

<style>
@page { margin: 0; size: ${thermalWidth}mm auto; }

body {
  margin: 0;
  font-family: "Courier New", Consolas, monospace;
  font-size: 12px;
  background: white;
}

.thermal {
  width: ${thermalWidth}mm;
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

<script>
  // Try to print automatically
  setTimeout(() => {
    try {
      window.print();
      setTimeout(() => window.close(), 600);
    } catch (e) {
      // If auto-print fails, show a print button
      const printBtn = document.createElement('button');
      printBtn.innerHTML = '📄 Print Receipt';
      printBtn.style.cssText = 'padding:10px 20px;background:#007bff;color:white;border:none;border-radius:5px;margin:20px auto;display:block;font-size:16px;cursor:pointer;';
      printBtn.onclick = function() {
        window.print();
        setTimeout(() => window.close(), 600);
      };
      document.body.appendChild(printBtn);
    }
  }, 300);
</script>

</body>
</html>
    `);

    printWindow.document.close();
    printWindow.focus();
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
            📄 Print Receipt
          </button>
          <button className="btn-new-sale" onClick={onNewSale}>
            🛒 New Sale
          </button>
          
          {/* Desktop instructions */}
          {!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
            <div className="desktop-print-hint">
              <small>
                💡 On PC: If print doesn't start automatically, check popup blocker<br/>
                💡 Use <kbd>Ctrl</kbd>+<kbd>P</kbd> if needed
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSReceipt;
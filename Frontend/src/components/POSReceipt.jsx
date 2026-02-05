import React, { useRef, useEffect, useState } from "react";
import { useReactToPrint } from "react-to-print";
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

  // Setup react-to-print
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Receipt_${receipt.orderId}`,
    onBeforeGetContent: () => {
      console.log("Preparing content for printing...");
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log("Print dialog closed");
    },
    onPrintError: (errorLocation, error) => {
      console.error("Print error:", errorLocation, error);
      // Fallback to manual print
      alert("Printing failed. Please use browser's print option (Ctrl+P or ⋮ → Print)");
    },
    removeAfterPrint: false,
    pageStyle: `
      @page { 
        margin: 0; 
        size: 58mm auto; 
      }
      @media print {
        body { 
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          color: black !important;
          font-family: "Courier New", Consolas, monospace !important;
          font-size: 12px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .print-content { 
          width: 58mm !important;
          padding: 4mm !important;
          margin: 0 auto !important;
          background: white !important;
        }
        .no-print { 
          display: none !important; 
        }
      }
    `,
    copyStyles: true,
  });

  const formatTime = () =>
    new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });

  // Fallback print function for mobile
  const handleFallbackPrint = () => {
    const printContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt #${receipt.orderId}</title>
<style>
@page { 
  margin: 0; 
  size: 58mm auto; 
}
body {
  margin: 0;
  font-family: "Courier New", Consolas, monospace;
  font-size: 12px;
  background: white;
  -webkit-print-color-adjust: exact !important;
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
@media print {
  body * { visibility: hidden; }
  .thermal, .thermal * { visibility: visible; }
  .thermal { position: absolute; left: 0; top: 0; }
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
${qrUrl ? `<img src="${qrUrl}" class="qr"/>` : ''}
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
  // Add manual print button for mobile
  setTimeout(() => {
    var btn = document.createElement('button');
    btn.innerHTML = '📄 Print Receipt';
    btn.style.cssText = 'padding:10px 20px;background:#007bff;color:white;border:none;border-radius:5px;margin:20px auto;display:block;font-size:16px;';
    btn.onclick = function() { window.print(); };
    document.body.appendChild(btn);
  }, 500);
</script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          // If automatic print fails, the manual button will be available
        }
      }, 1000);
    } else {
      alert('Popup blocked. Please allow popups for this site or use the main print button.');
    }
  };

  // Combined print handler with fallback
  const handlePrintWithFallback = () => {
    // Try react-to-print first
    try {
      handlePrint();
    } catch (error) {
      console.log("react-to-print failed, trying fallback:", error);
      handleFallbackPrint();
    }
  };

  return (
    <div
      className="receipt-container"
      style={{ backgroundImage: `url(${elegantwaterBg})` }}
    >
      <div className="receipt-overlay" />

      <div className="receipt-wrap">
        {/* Hidden content for printing */}
        <div style={{ display: "none" }}>
          <div ref={componentRef} className="print-content">
            <img src={logo} alt="logo" style={{ 
              width: "85px", 
              display: "block", 
              margin: "0 auto 10px" 
            }} />
            
            <div style={{ 
              textAlign: "center", 
              letterSpacing: "2px", 
              margin: "10px 0" 
            }}>
              * * * * * * * *
            </div>
            
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><strong>Order:</strong></span>
                <span>#{receipt.orderId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><strong>Cashier:</strong></span>
                <span>{receipt.cashier}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><strong>Date:</strong></span>
                <span>{formatTime()}</span>
              </div>
            </div>
            
            <div style={{ 
              borderTop: "1px dashed #000", 
              margin: "10px 0",
              letterSpacing: "2px",
              textAlign: "center"
            }}>
              -------------------------
            </div>
            
            {receipt.items.map((item, index) => (
              <div key={index} style={{ 
                margin: "8px 0", 
                paddingBottom: "8px", 
                borderBottom: "1px dotted #999" 
              }}>
                <div>{item.name}</div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginTop: "4px"
                }}>
                  <span>Qty: {item.quantity}</span>
                  <span>Ksh {item.total.toLocaleString("en-KE")}</span>
                </div>
                {item.imei && (
                  <div style={{ 
                    fontSize: "11px", 
                    marginTop: "4px",
                    fontFamily: "monospace"
                  }}>
                    IMEI: {item.imei}
                  </div>
                )}
              </div>
            ))}
            
            <div style={{ 
              borderTop: "2px dashed #000", 
              borderBottom: "2px dashed #000", 
              margin: "15px 0", 
              padding: "10px 0", 
              fontSize: "16px", 
              fontWeight: "bold",
              textAlign: "center" 
            }}>
              TOTAL: Ksh {receipt.total.toLocaleString("en-KE")}
            </div>
            
            {qrUrl && (
              <img 
                src={qrUrl} 
                alt="QR Code" 
                style={{ 
                  width: "100px", 
                  height: "100px", 
                  display: "block", 
                  margin: "10px auto" 
                }} 
              />
            )}
            
            <div style={{ textAlign: "center", margin: "10px 0" }}>
              Verify Receipt
            </div>
            
            <div style={{ 
              borderTop: "1px dashed #000", 
              margin: "10px 0",
              letterSpacing: "2px",
              textAlign: "center"
            }}>
              -------------------------
            </div>
            
            <div style={{ textAlign: "center", fontWeight: "bold", margin: "10px 0" }}>
              Security Code: {securityCode}
            </div>
            
            <div style={{ textAlign: "left", fontSize: "11px", marginTop: "15px" }}>
              <p>Thank you for shopping ❤️</p>
              <p>Panna Store</p>
              <p>0711 772 995</p>
            </div>
          </div>
        </div>

        {/* Visible receipt for screen */}
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
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  {item.imei && <span className="item-imei">IMEI: {item.imei}</span>}
                  <span className="item-qty">Qty: {item.quantity}</span>
                </div>
                <span className="item-total">Ksh {item.total.toLocaleString("en-KE")}</span>
              </div>
            ))}
          </div>
          
          <div className="receipt-total">
            <span>TOTAL AMOUNT</span>
            <span>Ksh {receipt.total.toLocaleString("en-KE")}</span>
          </div>
          
          {isGeneratingQR ? (
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              Generating QR code...
            </div>
          ) : qrUrl ? (
            <img src={qrUrl} alt="QR Code" style={{ 
              width: "120px", 
              display: "block", 
              margin: "20px auto" 
            }} />
          ) : null}
          
          <div className="receipt-footer">
            <p>Security Code: <strong>{securityCode}</strong></p>
            <p>Thank you for shopping ❤️</p>
            <p>Panna Store • 0711 772 995</p>
            <span className="tiny">
              Verify at: https://pannamusic.co.ke/verify/{receipt.orderId}
            </span>
          </div>
        </div>

        <div className="receipt-actions">
          <button className="btn-print" onClick={handlePrintWithFallback}>
            📄 Print Receipt
          </button>
          <button className="btn-new-sale" onClick={onNewSale}>
            🛒 New Sale
          </button>
          
          {/* Mobile instructions */}
          {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
            <div className="mobile-print-hint">
              <small>
                💡 If print doesn't start: Tap browser menu (⋮) → "Print"<br/>
                📱 Allow popups if prompted
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSReceipt;
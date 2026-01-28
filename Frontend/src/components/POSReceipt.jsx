import React, { useRef } from "react";
import "./POSReceipt.css";
import elegantwaterBg from "../assets/elegantwater.jpg";

const POSReceipt = ({ receipt, onNewSale }) => {
  const receiptRef = useRef();

  const handlePrint = () => {
    // Thermal printer friendly receipt (no barcode)
    const thermalWidth = 58; // mm
    
    const printWindow = window.open("", "_blank", "width=400,height=600");
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${receipt.orderId}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Thermal printer specific styles */
            @page {
              margin: 0;
              size: ${thermalWidth}mm auto;
            }
            
            @media print {
              * {
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              
              body {
                width: ${thermalWidth}mm !important;
                max-width: ${thermalWidth}mm !important;
                min-width: ${thermalWidth}mm !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 12px !important;
                line-height: 1.2 !important;
                background: white !important;
                color: black !important;
                font-family: "Courier New", monospace !important;
              }
              
              /* Hide everything except receipt */
              body *:not(.thermal-receipt):not(.thermal-receipt *) {
                display: none !important;
              }
            }
            
            /* Thermal receipt styling */
            .thermal-receipt {
              width: ${thermalWidth}mm;
              max-width: ${thermalWidth}mm;
              min-width: ${thermalWidth}mm;
              padding: 3mm;
              font-family: "Courier New", monospace;
              font-size: 12px;
              line-height: 1.2;
              background: white;
              color: black;
              margin: 0 auto;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            .receipt-header {
              text-align: center;
              margin-bottom: 8px;
              padding-bottom: 5px;
              border-bottom: 1px dashed #000;
            }
            
            .receipt-header h1 {
              font-size: 18px;
              font-weight: bold;
              margin: 5px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .receipt-header p {
              margin: 3px 0;
              font-size: 11px;
            }
            
            .receipt-meta {
              margin-bottom: 8px;
              padding-bottom: 5px;
              border-bottom: 1px dashed #000;
            }
            
            .meta-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 11px;
            }
            
            .receipt-items {
              margin-bottom: 8px;
            }
            
            .item-row {
              margin: 5px 0;
              padding-bottom: 3px;
              border-bottom: 1px dotted #ccc;
            }
            
            .item-name-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            
            .item-name {
              flex: 1;
              font-weight: bold;
              font-size: 11px;
              word-break: break-word;
            }
            
            .item-qty {
              margin-left: 5px;
              font-size: 11px;
            }
            
            .item-total {
              font-weight: bold;
              font-size: 11px;
            }
            
            .item-imei {
              font-size: 9px;
              color: #666;
              margin-left: 10px;
              display: block;
            }
            
            .receipt-total {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 10px 0;
              padding: 8px 0;
              border-top: 2px dashed #000;
              border-bottom: 2px dashed #000;
              font-weight: bold;
              font-size: 14px;
            }
            
            .receipt-footer {
              text-align: center;
              margin-top: 10px;
              padding-top: 5px;
              border-top: 1px dashed #000;
              font-size: 10px;
            }
            
            /* Print controls */
            .print-controls {
              text-align: center;
              margin-top: 20px;
              padding: 10px;
            }
            
            .print-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin: 5px;
            }
            
            .print-btn:hover {
              background: #0056b3;
            }
            
            /* Preview styling */
            @media screen {
              body {
                background: #f0f0f0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              
              .thermal-receipt {
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                border: 1px solid #ccc;
                margin-bottom: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="thermal-receipt">
            <!-- Store Header -->
            <div class="receipt-header">
              <h1>PANNA STORE</h1>
              <p>Order #${receipt.orderId}</p>
              <p>---</p>
            </div>
            
            <!-- Meta Information -->
            <div class="receipt-meta">
              <div class="meta-row">
                <span>Cashier:</span>
                <span>${receipt.cashier}</span>
              </div>
              <div class="meta-row">
                <span>Date:</span>
                <span>${new Date(receipt.timestamp).toLocaleString("en-KE")}</span>
              </div>
              <div class="meta-row">
                <span>Payment:</span>
                <span>${receipt.paymentMethod?.toUpperCase() || "CASH"}</span>
              </div>
            </div>
            
            <!-- Items -->
            <div class="receipt-items">
              ${receipt.items.map(item => `
                <div class="item-row">
                  <div class="item-name-row">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">x${item.quantity}</span>
                    <span class="item-total">Ksh ${item.total.toLocaleString("en-KE")}</span>
                  </div>
                  ${item.imei ? `<span class="item-imei">IMEI: ${item.imei}</span>` : ''}
                </div>
              `).join('')}
            </div>
            
            <!-- Total -->
            <div class="receipt-total">
              <span>TOTAL:</span>
              <span>Ksh ${receipt.total.toLocaleString("en-KE")}</span>
            </div>
            
            <!-- Footer -->
            <div class="receipt-footer">
              <p>Thank you for shopping with us!</p>
              <p>❤️</p>
              <p>Printed: ${new Date().toLocaleString("en-KE")}</p>
              <p>Tel: +254 700 000 000</p>
            </div>
          </div>
          
          <!-- Print Controls -->
          <div class="print-controls">
            <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>
            <button class="print-btn" onclick="window.close()">❌ Close</button>
          </div>
          
          <script>
            // Auto-print after a short delay
            setTimeout(() => {
              window.print();
              // Auto-close after printing (optional)
              setTimeout(() => {
                window.close();
              }, 500);
            }, 300);
            
            // ESC key to close
            document.addEventListener('keydown', (e) => {
              if (e.key === 'Escape') {
                window.close();
              }
            });
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
        <div className="receipt-paper" ref={receiptRef}>
          {/* On-screen display */}
          <div className="receipt-header">
            <h1>PANNA STORE</h1>
            <p>Order #{receipt.orderId}</p>
          </div>
          
          <div className="receipt-meta">
            <p><strong>Cashier:</strong> {receipt.cashier}</p>
            <p><strong>Date:</strong> {new Date(receipt.timestamp).toLocaleString("en-KE")}</p>
            <p><strong>Payment:</strong> {receipt.paymentMethod?.toUpperCase() || "CASH"}</p>
          </div>
          
          <div className="receipt-items">
            {receipt.items.map((item, index) => (
              <div key={index} className="receipt-row">
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  {item.imei && (
                    <span className="item-imei">IMEI: {item.imei}</span>
                  )}
                </div>
                <span className="item-qty">x{item.quantity}</span>
                <span className="item-total">
                  Ksh {item.total.toLocaleString("en-KE")}
                </span>
              </div>
            ))}
          </div>
          
          <div className="receipt-total">
            <span>TOTAL</span>
            <span>Ksh {receipt.total.toLocaleString("en-KE")}</span>
          </div>
          
          <div className="receipt-footer">
            <p>Thank you for shopping ❤️</p>
            <p className="tiny">Printed: {new Date().toLocaleString("en-KE")}</p>
          </div>
        </div>
        
        <div className="receipt-actions">
          <button className="btn-print" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
          <button className="btn-new-sale" onClick={onNewSale}>
            ➕ New Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSReceipt;
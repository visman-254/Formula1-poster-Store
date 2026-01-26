import React, { useRef } from "react";
import "./POSReceipt.css";
import elegantwaterBg from "../assets/elegantwater.jpg";

const POSReceipt = ({ receipt, onNewSale }) => {
  const receiptRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=600,height=900");

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${receipt.orderId}</title>
          <style>
            body {
              font-family: "Courier New", monospace;
              background: #fff;
              padding: 20px;
            }
            .receipt {
              max-width: 380px;
              margin: auto;
              border: 1px dashed #000;
              padding: 18px;
            }
            .center { text-align: center; }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 6px 0;
              font-size: 13px;
            }
            .bold { font-weight: bold; }
            .divider {
              border-top: 1px dashed #000;
              margin: 12px 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center bold">RECEIPT</div>
            <div class="center">Order #${receipt.orderId}</div>

            <div class="divider"></div>

            <div class="row"><span>Cashier:</span><span>${receipt.cashier}</span></div>
            <div class="row"><span>Date:</span><span>${new Date(receipt.timestamp).toLocaleString("en-KE")}</span></div>
            <div class="row"><span>Payment:</span><span>${receipt.paymentMethod?.toUpperCase() || "CASH"}</span></div>

            <div class="divider"></div>

            ${receipt.items.map(item => `
              <div class="row">
                <span>${item.name} x${item.quantity}</span>
                <span>Ksh ${item.total.toLocaleString("en-KE")}</span>
              </div>
            `).join("")}

            <div class="divider"></div>

            <div class="row bold">
              <span>TOTAL:</span>
              <span>Ksh ${receipt.total.toLocaleString("en-KE")}</span>
            </div>

            <div class="divider"></div>

            <div class="center">Thank you for shopping ❤️</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div
      className="receipt-container"
      style={{ backgroundImage: `url(${elegantwaterBg})` }}
    >
      <div className="receipt-overlay" />

      <div className="receipt-wrap">
        <div className="receipt-paper" ref={receiptRef}>
          <div className="receipt-header">
            <h1>PANNA</h1>
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
                <span className="item-name">{item.name}</span>
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
            <p>Thank you for shopping </p>
            <p className="tiny">Printed: {new Date().toLocaleString("en-KE")}</p>
          </div>
        </div>

        <div className="receipt-actions">
          <button className="btn-print" onClick={handlePrint}>
            🖨 Print
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

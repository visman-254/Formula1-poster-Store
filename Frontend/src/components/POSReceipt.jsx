import React, { useRef } from 'react';
import './POSReceipt.css';

const POSReceipt = ({ receipt, onNewSale }) => {
  const receiptRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Order #${receipt.orderId}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .receipt {
              max-width: 400px;
              margin: 0 auto;
              border: 1px dashed #333;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 1.5em;
            }
            .header p {
              margin: 0;
              font-size: 0.9em;
              color: #666;
            }
            .receipt-meta {
              font-size: 0.85em;
              margin-bottom: 15px;
              padding: 10px 0;
              border-bottom: 1px dashed #333;
            }
            .receipt-meta p {
              margin: 4px 0;
            }
            .items {
              margin: 15px 0;
              border-bottom: 1px dashed #333;
              padding-bottom: 10px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 0.9em;
            }
            .item-desc {
              flex: 1;
            }
            .item-qty {
              margin: 0 10px;
              text-align: center;
              min-width: 30px;
            }
            .item-total {
              text-align: right;
              min-width: 60px;
              font-weight: bold;
            }
            .totals {
              margin: 15px 0;
              padding: 10px 0;
              border-bottom: 2px solid #333;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 0.95em;
            }
            .total-row.final {
              font-weight: bold;
              font-size: 1.1em;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #333;
            }
            .footer {
              text-align: center;
              font-size: 0.85em;
              color: #666;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #333;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>🛒 RECEIPT</h1>
              <p>Order #${receipt.orderId}</p>
            </div>

            <div class="receipt-meta">
              <p><strong>Cashier:</strong> ${receipt.cashier}</p>
              <p><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString('en-KE')}</p>
              <p><strong>Payment:</strong> ${receipt.paymentMethod?.toUpperCase() || 'CASH'}</p>
            </div>

            <div class="items">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #999; padding-bottom: 5px; font-weight: bold; font-size: 0.9em;">
                <div style="flex: 1;">ITEM</div>
                <div style="margin: 0 10px; text-align: center; min-width: 30px;">QTY</div>
                <div style="text-align: right; min-width: 60px;">TOTAL</div>
              </div>
              ${receipt.items
                .map(
                  (item) => `
                <div class="item">
                  <div class="item-desc">${item.name}</div>
                  <div class="item-qty">${item.quantity}</div>
                  <div class="item-total">Ksh ${item.total.toLocaleString('en-KE', {
                    maximumFractionDigits: 2,
                  })}</div>
                </div>
              `
                )
                .join('')}
            </div>

            <div class="totals">
              <div class="total-row">
                <span>SUBTOTAL:</span>
                <span>Ksh ${receipt.subtotal.toLocaleString('en-KE', {
                  maximumFractionDigits: 2,
                })}</span>
              </div>
              <div class="total-row final">
                <span>TOTAL:</span>
                <span>Ksh ${receipt.total.toLocaleString('en-KE', {
                  maximumFractionDigits: 2,
                })}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>Printed: ${new Date().toLocaleString('en-KE')}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    // This would require a PDF library like jsPDF
    console.log('PDF download feature - requires jsPDF library');
  };

  return (
    <div className="receipt-container">
      <div className="receipt-page" ref={receiptRef}>
        <div className="receipt-header">
          <h1>🛒 RECEIPT</h1>
          <p>Order #{receipt.orderId}</p>
        </div>

        <div className="receipt-meta">
          <p>
            <strong>Cashier:</strong> {receipt.cashier}
          </p>
          <p>
            <strong>Date:</strong> {new Date(receipt.timestamp).toLocaleString('en-KE')}
          </p>
          <p>
            <strong>Payment Method:</strong> {receipt.paymentMethod?.toUpperCase() || 'CASH'}
          </p>
        </div>

        <div className="receipt-items">
          <div className="items-header">
            <span className="col-name">ITEM</span>
            <span className="col-qty">QTY</span>
            <span className="col-price">PRICE</span>
            <span className="col-total">TOTAL</span>
          </div>

          {receipt.items.map((item, index) => (
            <div key={index} className="receipt-item">
              <span className="col-name">{item.name}</span>
              <span className="col-qty">{item.quantity}</span>
              <span className="col-price">
                Ksh {item.price.toLocaleString('en-KE', { maximumFractionDigits: 2 })}
              </span>
              <span className="col-total">
                Ksh {item.total.toLocaleString('en-KE', { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>

        <div className="receipt-totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>Ksh {receipt.subtotal.toLocaleString('en-KE', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="total-row final">
            <span>TOTAL:</span>
            <span>Ksh {receipt.total.toLocaleString('en-KE', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="receipt-footer">
          <p>Thank you for your purchase!</p>
          <p className="small">Printed: {new Date().toLocaleString('en-KE')}</p>
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
  );
};

export default POSReceipt;

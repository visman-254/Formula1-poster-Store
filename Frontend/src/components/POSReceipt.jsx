import React, { useRef } from "react";
import QRCode from "qrcode";
import "./POSReceipt.css";
import elegantwaterBg from "../assets/elegantwater.jpg";
import logo from "../assets/pmc.png";

const POSReceipt = ({ receipt, onNewSale }) => {
  const receiptRef = useRef();

  const formatTime = () =>
    new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });

  const generateCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const securityCode = generateCode();

  const handlePrint = async () => {
    const thermalWidth = 58;
    const qrUrl = await QRCode.toDataURL(
      `https://pannamusic.co.ke/verify/${receipt.orderId}`
    );

    const printWindow = window.open("", "_blank", "width=400,height=600");

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
setTimeout(() => {
  window.print();
  setTimeout(() => window.close(), 600);
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

          <div className="receipt-footer">
            <p>Security Code: {securityCode}</p>
            <p>Thank you for shopping ❤️</p>
          </div>

        </div>

        <div className="receipt-actions">
          <button className="btn-print" onClick={handlePrint}>
             Print Receipt
          </button>
          <button className="btn-new-sale" onClick={onNewSale}>
             New Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSReceipt;

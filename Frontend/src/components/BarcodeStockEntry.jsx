import React, { useState, useEffect, useRef } from 'react';
import { Camera, Plus, X, Save, Barcode, Package, DollarSign } from 'lucide-react';
import { lookupByBarcode, generateBarcode, saveBatchStock } from '../api/importApi';
import BarcodeScanner from './BarcodeScanner';

const BarcodeStockEntry = ({ onStockAdded }) => {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [stockToAdd, setStockToAdd] = useState(1);
  const [buyingPrice, setBuyingPrice] = useState('');
  const [imeiNumbers, setImeiNumbers] = useState([]);
  const [currentImei, setCurrentImei] = useState('');
  const [scannedItems, setScannedItems] = useState([]);
  
  const token = localStorage.getItem('token');

  const handleScanSuccess = async (code) => {
    if (loading) return;
    setError(null);
    setLastScanned(code);
    
    try {
      setLoading(true);
      const result = await lookupByBarcode(code, token);
      
      if (result.found) {
        if (result.type === 'product_code') {
          setScannedProduct(result.variant);
          setBuyingPrice(result.variant.buying_price || '');
        } else if (result.type === 'imei') {
          // It's an IMEI - find the associated variant
          setScannedProduct({
            ...result.imei,
            product_name: result.imei.product_name,
            color: result.imei.color,
            variant_id: result.imei.variant_id
          });
          setBuyingPrice(result.imei.buying_price || '');
        }
      } else {
        setError(`Product not found: ${code}`);
        setScannedProduct(null);
      }
    } catch (err) {
      setError('Failed to lookup barcode: ' + err.message);
      setScannedProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async () => {
    if (!manualCode.trim()) return;
    await handleScanSuccess(manualCode.trim());
  };

  const handleAddItem = () => {
    if (!scannedProduct) return;
    
    const newItem = {
      variant_id: scannedProduct.variant_id,
      product_name: scannedProduct.product_name,
      color: scannedProduct.color,
      stock: parseInt(stockToAdd),
      buying_price: parseFloat(buyingPrice) || 0,
      imeis: imeiNumbers.filter(i => i.trim())
    };
    
    setScannedItems([...scannedItems, newItem]);
    setScannedProduct(null);
    setStockToAdd(1);
    setBuyingPrice('');
    setImeiNumbers([]);
    setManualCode('');
    setLastScanned(null);
  };

  const handleRemoveItem = (index) => {
    const updated = [...scannedItems];
    updated.splice(index, 1);
    setScannedItems(updated);
  };

  const handleSaveBatch = async () => {
    if (scannedItems.length === 0) return;
    
    try {
      setLoading(true);
      const result = await saveBatchStock(scannedItems, token);
      alert(result.message);
      setScannedItems([]);
      if (onStockAdded) {
        onStockAdded(scannedItems);
      }
    } catch (err) {
      alert('Failed to save stock: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImei = () => {
    if (currentImei.trim()) {
      setImeiNumbers([...imeiNumbers, currentImei.trim()]);
      setCurrentImei('');
    }
  };

  const handleRemoveImei = (index) => {
    const updated = [...imeiNumbers];
    updated.splice(index, 1);
    setImeiNumbers(updated);
  };

  const generateCode = async (variantId) => {
    try {
      const result = await generateBarcode(variantId, token);
      alert(`Generated code: ${result.product_code}`);
    } catch (err) {
      alert('Failed to generate code: ' + err.message);
    }
  };

  const totalItems = scannedItems.reduce((sum, item) => sum + item.stock, 0);
  const totalImeis = scannedItems.reduce((sum, item) => sum + item.imeis.length, 0);

  return (
    <div className="barcode-stock-entry bg-gray-900 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Barcode className="w-8 h-8" />
          Barcode Stock Entry
        </h1>

        {/* Scanner Section */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan Barcode
            </h2>
            <button
              onClick={() => setScanning(!scanning)}
              className={`px-4 py-2 rounded-lg font-medium ${
                scanning 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {scanning ? 'Stop Scanner' : 'Start Scanner'}
            </button>
          </div>

          {scanning && (
            <div className="mb-4">
              <BarcodeScanner 
                onScanSuccess={handleScanSuccess}
                style={{ maxWidth: '400px', margin: '0 auto' }}
              />
            </div>
          )}

          {/* Manual Entry */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter barcode manually..."
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
            />
            <button
              onClick={handleManualLookup}
              disabled={loading || !manualCode.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium"
            >
              Lookup
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {lastScanned && !scannedProduct && !error && (
            <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-500 rounded-lg text-yellow-200">
              Looking up: {lastScanned}...
            </div>
          )}
        </div>

        {/* Product Found Section */}
        {scannedProduct && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-green-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {scannedProduct.product_name}
                </h3>
                <p className="text-gray-400">
                  Variant: {scannedProduct.color || 'Default'}
                </p>
                <p className="text-gray-400">
                  Current Stock: {scannedProduct.stock || 0}
                </p>
                {scannedProduct.product_code && (
                  <p className="text-green-400 text-sm mt-1">
                    Code: {scannedProduct.product_code}
                  </p>
                )}
              </div>
              <button
                onClick={() => generateCode(scannedProduct.variant_id)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded"
              >
                Generate Code
              </button>
            </div>

            {/* Stock Entry Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Units to Add</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStockToAdd(Math.max(1, stockToAdd - 1))}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-l-lg text-white"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={stockToAdd}
                    onChange={(e) => setStockToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-r-lg text-white text-center"
                  />
                  <button
                    onClick={() => setStockToAdd(stockToAdd + 1)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Buying Price (Kshs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(e.target.value)}
                  placeholder={scannedProduct.buying_price || '0.00'}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>

            {/* IMEI Entry */}
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-1">
                IMEI Numbers (Optional - for individual unit tracking)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentImei}
                  onChange={(e) => setCurrentImei(e.target.value)}
                  placeholder="Enter IMEI number..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddImei()}
                />
                <button
                  onClick={handleAddImei}
                  disabled={!currentImei.trim()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {imeiNumbers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imeiNumbers.map((imei, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded flex items-center gap-1"
                    >
                      {imei}
                      <button
                        onClick={() => handleRemoveImei(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {imeiNumbers.length > 0 && imeiNumbers.length !== stockToAdd && (
                <p className="text-yellow-400 text-sm mt-2">
                  Warning: {imeiNumbers.length} IMEIs entered but {stockToAdd} units specified
                </p>
              )}
            </div>

            <button
              onClick={handleAddItem}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add to Batch
            </button>
          </div>
        )}

        {/* Scanned Items List */}
        {scannedItems.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Batch Entry ({scannedItems.length} items)
            </h2>
            
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {scannedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{item.product_name}</p>
                    <p className="text-gray-400 text-sm">
                      {item.color} • +{item.stock} units
                      {item.imeis.length > 0 && ` • ${item.imeis.length} IMEIs`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 font-medium">
                      Kshs {(item.buying_price * item.stock).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg mb-4">
              <div className="text-gray-400">
                <p>Total Units: <span className="text-white font-bold">{totalItems}</span></p>
                <p>Total IMEIs: <span className="text-white font-bold">{totalImeis}</span></p>
              </div>
              <button
                onClick={handleSaveBatch}
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save All to Inventory'}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">How to use:</h3>
          <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
            <li>Scan a product barcode or enter it manually</li>
            <li>Verify the product details that appear</li>
            <li>Enter the quantity and buying price</li>
            <li>Optionally add IMEI numbers for individual unit tracking</li>
            <li>Click "Add to Batch" to add to the current entry list</li>
            <li>When done, click "Save All to Inventory" to update stock</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default BarcodeStockEntry;

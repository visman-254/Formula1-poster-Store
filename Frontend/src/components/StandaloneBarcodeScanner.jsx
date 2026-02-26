import React, { useState, useEffect } from 'react';
import { ScanBarcode, X, Search, Package, ArrowRight } from 'lucide-react';
import { lookupByBarcode } from '../api/importApi';
import { Button } from './ui/button';
import { Input } from './ui/input';

const StandaloneBarcodeScanner = ({ onProductFound, onClose }) => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem('token');

  const handleSearch = async () => {
    if (!barcode.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await lookupByBarcode(barcode.trim(), token);
      
      if (res.found) {
        if (res.type === 'product_code') {
          setResult({
            type: 'product',
            product: res.variant,
            product_name: res.variant.product_name,
            variant_id: res.variant.variant_id,
            color: res.variant.color,
            stock: res.variant.stock,
            product_code: res.variant.product_code
          });
        } else if (res.type === 'imei') {
          setResult({
            type: 'imei',
            imei: res.imei,
            product_name: res.imei.product_name,
            variant_id: res.imei.variant_id,
            color: res.imei.color,
            imei_number: res.imei.imei_number,
            status: res.imei.status
          });
        }
      } else {
        setError('Product not found. Generate a SKU for this product first.');
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setError('Failed to lookup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = () => {
    if (onProductFound) {
      onProductFound(result);
    }
    // Reset
    setBarcode('');
    setResult(null);
    if (onClose) onClose();
  };

  const handleClear = () => {
    setBarcode('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <ScanBarcode className="w-6 h-6" />
            <h2 className="text-xl font-bold">Scan SKU / Barcode</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter or scan SKU code..."
              className="flex-1 text-lg"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={loading || !barcode.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Scan a product SKU to quickly find and manage it
          </p>
        </div>

        {/* Results */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {result.type === 'product' ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                    <Package className="w-5 h-5" />
                    <span className="font-bold">Product Found</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.product_name}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-gray-500">Variant:</span>
                      <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                        {result.color}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Stock:</span>
                      <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                        {result.stock || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">SKU Code:</span>
                      <span className="ml-2 font-mono text-amber-600 dark:text-amber-400">
                        {result.product_code || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={handleSelectProduct}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700"
                  >
                    Select This Product
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <Package className="w-5 h-5" />
                    <span className="font-bold">IMEI Found</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.product_name}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-gray-500">Variant:</span>
                      <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                        {result.color}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">IMEI:</span>
                      <span className="ml-2 font-mono text-sm text-gray-700 dark:text-gray-300">
                        {result.imei_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 font-medium ${
                        result.status === 'available' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={handleSelectProduct}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                  >
                    Select This Product
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {!result && !error && (
            <div className="text-center py-8 text-gray-500">
              <ScanBarcode className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Enter a SKU code to search for a product</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            SKU codes are optional. Generate them from product management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StandaloneBarcodeScanner;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Search, Package, X, CheckCircle, AlertCircle, Plus, Trash2, Layers, RefreshCw } from "lucide-react";
import BarcodeScanner from "./BarcodeScanner";
import API_BASE from "../config";

const StockReceivePage = () => {
  const { user, token } = useUser();
  
  const [mode, setMode] = useState("single"); // "single" or "bulk"
  const [searchCode, setSearchCode] = useState("");
  const [foundProduct, setFoundProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  
  // Bulk mode state
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Stock receive form
  const [stockData, setStockData] = useState({
    quantity: "",
    buyingPrice: "",
    imeis: ""
  });

  // Regenerate SKUs state
  const [regenerating, setRegenerating] = useState(false);
  const [regenMessage, setRegenMessage] = useState("");

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchCode.trim()) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    setFoundProduct(null);
    
    try {
      const searchTerm = searchCode.trim();
      console.log("[StockReceive] Searching for SKU:", searchTerm);
      
      const res = await axios.get(`${API_BASE}/api/products/barcode/${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("[StockReceive] API Response:", res.data);
      
      if (res.data.found) {
        console.log("[StockReceive] Product found:", res.data.variant);
        setFoundProduct(res.data.variant);
        setStockData({
          quantity: "",
          buyingPrice: res.data.variant.buying_price || "",
          imeis: ""
        });
        setSuccess(`Found: ${res.data.variant.color || 'Default'} variant`);
      } else {
        console.log("[StockReceive] Product not found for:", searchTerm);
        setError("Product not found with this barcode/SKU");
      }
    } catch (err) {
      console.error("[StockReceive] Error searching product:", err);
      console.error("[StockReceive] Error response:", err.response?.data);
      setError(err.response?.data?.error || "Failed to find product");
    } finally {
      setLoading(false);
    }
  };

  // Add item to bulk list
  const handleBulkAdd = async (code) => {
    if (!code.trim()) return;
    
    // Check if already in list
    if (bulkItems.find(item => item.product_code?.toLowerCase() === code.trim().toLowerCase())) {
      console.log("[StockReceive] SKU already in bulk list:", code);
      setError("This SKU is already in the list");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const searchTerm = code.trim();
      console.log("[StockReceive] Bulk search for SKU:", searchTerm);
      
      const res = await axios.get(`${API_BASE}/api/products/barcode/${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("[StockReceive] Bulk API Response:", res.data);
      
      if (res.data.found) {
        const variant = res.data.variant;
        console.log("[StockReceive] Bulk product found:", variant);
        setBulkItems([...bulkItems, {
          ...variant,
          quantity: 1,
          buyingPrice: variant.buying_price || "",
          imeis: ""
        }]);
        setSearchCode("");
      } else {
        console.log("[StockReceive] Bulk product not found:", searchTerm);
        setError(`Product not found: ${code}`);
      }
    } catch (err) {
      console.error("[StockReceive] Bulk error searching product:", err);
      console.error("[StockReceive] Bulk error response:", err.response?.data);
      setError(err.response?.data?.error || "Failed to find product");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkScan = (scannedText) => {
    if (!scannedText) return;
    const cleaned = scannedText.replace(/[\r\n\t\x00-\x1F]/g, '').trim();
    if (!cleaned) return;
    
    setSearchCode(cleaned);
    setShowScanner(false);
    // Add to bulk list
    setTimeout(() => handleBulkAdd(cleaned), 100);
  };

  const updateBulkItem = (index, field, value) => {
    const newItems = [...bulkItems];
    newItems[index][field] = value;
    setBulkItems(newItems);
  };

  const removeBulkItem = (index) => {
    setBulkItems(bulkItems.filter((_, i) => i !== index));
  };

  const handleBulkSubmit = async () => {
    if (bulkItems.length === 0) {
      setError("No items to process");
      return;
    }
    
    setBulkLoading(true);
    setError("");
    setSuccess("");
    
    let successCount = 0;
    let errorMessages = [];
    
    for (const item of bulkItems) {
      if (!item.quantity || item.quantity <= 0) {
        errorMessages.push(`${item.product_code}: Invalid quantity`);
        continue;
      }
      
      try {
        // Parse IMEIs if provided
        let imeiArray = [];
        if (item.imeis?.trim()) {
          imeiArray = item.imeis.split(/[,\n]+/).map(i => i.trim()).filter(i => i);
        }
        
        await axios.post(
          `${API_BASE}/api/products/variants/${item.variant_id}/receive-stock`,
          {
            quantityReceived: parseInt(item.quantity),
            buyingPrice: parseFloat(item.buyingPrice) || 0,
            imeis: imeiArray
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        successCount++;
      } catch (err) {
        console.error(`Error receiving stock for ${item.product_code}:`, err);
        errorMessages.push(`${item.product_code}: ${err.response?.data?.error || 'Failed'}`);
      }
    }
    
    setBulkLoading(false);
    
    if (successCount > 0) {
      setSuccess(`Successfully received stock for ${successCount} item(s)`);
      setBulkItems([]);
    }
    
    if (errorMessages.length > 0) {
      setError(errorMessages.join("; "));
    }
  };

  const handleBarcodeScan = (scannedText) => {
    if (!scannedText) return;
    const cleaned = scannedText.replace(/[\r\n\t\x00-\x1F]/g, '').trim();
    if (!cleaned) return;
    
    setSearchCode(cleaned);
    setShowScanner(false);
    
    if (mode === "bulk") {
      setTimeout(() => handleBulkAdd(cleaned), 100);
    } else {
      setTimeout(() => handleSearch(), 100);
    }
  };

  const handleReceiveStock = async (e) => {
    e.preventDefault();
    if (!foundProduct) return;
    
    if (!stockData.quantity || stockData.quantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Parse IMEIs if provided
      let imeiArray = [];
      if (stockData.imeis.trim()) {
        imeiArray = stockData.imeis.split(/[,\n]+/).map(i => i.trim()).filter(i => i);
      }
       
      const res = await axios.post(
        `${API_BASE}/api/products/variants/${foundProduct.variant_id}/receive-stock`,
        {
          quantityReceived: parseInt(stockData.quantity),
          buyingPrice: parseFloat(stockData.buyingPrice) || 0,
          imeis: imeiArray
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess(`Successfully received ${stockData.quantity} units of ${foundProduct.color || 'default'} variant!`);
      
      // Reset form for next scan
      setFoundProduct(null);
      setSearchCode("");
      setStockData({ quantity: "", buyingPrice: "", imeis: "" });
      
    } catch (err) {
      console.error("Error receiving stock:", err);
      setError(err.response?.data?.error || "Failed to receive stock");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFoundProduct(null);
    setSearchCode("");
    setStockData({ quantity: "", buyingPrice: "", imeis: "" });
    setError("");
    setSuccess("");
  };

  // Regenerate all product codes
  const handleRegenerateSKUs = async () => {
    if (!confirm("This will regenerate SKU codes for ALL products. Existing SKUs will be replaced. Continue?")) {
      return;
    }
    
    setRegenerating(true);
    setRegenMessage("");
    setError("");
    
    try {
      console.log("[StockReceive] Regenerating all SKUs...");
      const res = await axios.post(
        `${API_BASE}/api/products/barcode/regenerate-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("[StockReceive] Regenerate response:", res.data);
      setRegenMessage(res.data.message || `Successfully regenerated ${res.data.updated || 0} SKUs`);
    } catch (err) {
      console.error("[StockReceive] Regenerate error:", err);
      setError(err.response?.data?.error || "Failed to regenerate SKUs");
    } finally {
      setRegenerating(false);
    }
  };

  if (!user || !token) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">Please login to access stock receiving</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              Receive Stock by SKU/Barcode
            </CardTitle>
            
            {/* Mode Toggle */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => { setMode("single"); setError(""); setSuccess(""); }}
                className={`px-3 py-1.5 text-sm rounded-md transition ${mode === "single" ? "bg-white dark:bg-gray-700 shadow" : "text-gray-500"}`}
              >
                Single
              </button>
              <button
                onClick={() => { setMode("bulk"); setError(""); setSuccess(""); }}
                className={`px-3 py-1.5 text-sm rounded-md transition flex items-center gap-1 ${mode === "bulk" ? "bg-white dark:bg-gray-700 shadow" : "text-gray-500"}`}
              >
                <Layers className="h-4 w-4" />
                Bulk
              </button>
            </div>
          </div>
          
          {/* Regenerate SKUs Button (Admin only) */}
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleRegenerateSKUs}
              disabled={regenerating}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating..." : "Fix All SKUs"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            </div>
          )}
          
          {/* Regenerate SKUs Message */}
          {regenMessage && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-700 font-medium">{regenMessage}</p>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700">{error}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError("")}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Barcode Scanner Modal */}
          {showScanner && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Scan Barcode/SKU</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowScanner(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <BarcodeScanner onScan={mode === "bulk" ? handleBulkScan : handleBarcodeScan} />
              </div>
            </div>
          )}
          
          {/* ==================== SINGLE MODE ==================== */}
          {mode === "single" && (
            <>
              {/* Search Form */}
              {!foundProduct && (
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchCode">Scan or Enter SKU/Barcode</Label>
                    <div className="flex gap-2">
                      <Input
                        id="searchCode"
                        type="text"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        placeholder="e.g., SAMS22-BLK-256"
                        className="font-mono text-lg"
                        autoFocus
                      />
                      <Button type="button" variant="outline" onClick={() => setShowScanner(true)}>
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button type="submit" disabled={loading || !searchCode.trim()}>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Scan the product barcode or enter the SKU to find the product
                    </p>
                  </div>
                </form>
              )}
              
              {/* Product Found - Show Stock Receive Form */}
              {foundProduct && (
                <form onSubmit={handleReceiveStock} className="space-y-6">
                  {/* Product Info */}
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{foundProduct.title}</h3>
                        <p className="text-sm text-gray-500">
                          Variant: {foundProduct.color || 'Default'} | SKU: {foundProduct.product_code}
                        </p>
                        <p className="text-sm">
                          Current Stock: <span className="font-semibold">{foundProduct.stock || 0}</span>
                        </p>
                        <p className="text-sm">
                          Current Buying Price: <span className="font-semibold">KSh {foundProduct.buying_price || 0}</span>
                        </p>
                      </div>
                      {foundProduct.image && (
                        <img 
                          src={foundProduct.image} 
                          alt={foundProduct.title}
                          className="h-20 w-20 object-cover rounded"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Stock Receive Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity to Receive *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={stockData.quantity}
                        onChange={(e) => setStockData({...stockData, quantity: e.target.value})}
                        placeholder="e.g., 10"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyingPrice">Buying Price (per unit)</Label>
                      <Input
                        id="buyingPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={stockData.buyingPrice}
                        onChange={(e) => setStockData({...stockData, buyingPrice: e.target.value})}
                        placeholder="e.g., 15000"
                      />
                    </div>
                  </div>
                  
                  {/* IMEI Field (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="imeis">IMEI/Serial Numbers (Optional)</Label>
                    <p className="text-xs text-gray-500">
                      Enter serial numbers for tracked items, one per line or comma separated
                    </p>
                    <textarea
                      id="imeis"
                      className="w-full p-3 border rounded-md font-mono text-sm"
                      rows={3}
                      value={stockData.imeis}
                      onChange={(e) => setStockData({...stockData, imeis: e.target.value})}
                      placeholder="IMEI001, IMEI002, IMEI003&#10;or one per line"
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Processing..." : "Receive Stock"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Scan Another
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
          
          {/* ==================== BULK MODE ==================== */}
          {mode === "bulk" && (
            <div className="space-y-4">
              {/* Add SKU Input */}
              <div className="space-y-2">
                <Label>Add SKU to List</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBulkAdd(searchCode);
                      }
                    }}
                    placeholder="Enter or scan SKU, press Enter to add"
                    className="font-mono"
                    autoFocus
                  />
                  <Button type="button" variant="outline" onClick={() => setShowScanner(true)}>
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleBulkAdd(searchCode)}
                    disabled={loading || !searchCode.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Add multiple SKUs to process them all at once
                </p>
              </div>
              
              {/* Bulk Items List */}
              {bulkItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Items to Process ({bulkItems.length})</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setBulkItems([])}
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  {bulkItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-gray-500">
                            {item.color || 'Default'} | SKU: {item.product_code}
                          </p>
                          <p className="text-sm">
                            Current Stock: {item.stock || 0}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBulkItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateBulkItem(index, "quantity", e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Buying Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.buyingPrice}
                            onChange={(e) => updateBulkItem(index, "buyingPrice", e.target.value)}
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <Label className="text-xs">IMEIs (optional)</Label>
                        <Input
                          type="text"
                          value={item.imeis || ""}
                          onChange={(e) => updateBulkItem(index, "imeis", e.target.value)}
                          placeholder="Comma or line separated"
                          className="h-8 font-mono text-xs"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Bulk Submit */}
                  <Button 
                    onClick={handleBulkSubmit}
                    disabled={bulkLoading || bulkItems.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {bulkLoading ? "Processing..." : `Receive Stock for ${bulkItems.length} Item(s)`}
                  </Button>
                </div>
              )}
              
              {/* Empty State */}
              {bulkItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items added yet</p>
                  <p className="text-sm">Scan or enter SKU codes above to add items</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockReceivePage;

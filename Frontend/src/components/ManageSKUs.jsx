import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import API_BASE from "../config";

const ManageSKUs = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedSKUs, setEditedSKUs] = useState({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProductsWithoutSKUs();
  }, []);

  const fetchProductsWithoutSKUs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/products/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Filter products that have variants without SKUs
      const productsWithoutSKUs = res.data
        .map(product => ({
          ...product,
          variants: product.variants?.filter(v => !v.product_code || v.product_code.trim() === '')
        }))
        .filter(product => product.variants && product.variants.length > 0);
      
      setProducts(productsWithoutSKUs);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSKUChange = (variantId, value) => {
    setEditedSKUs(prev => ({
      ...prev,
      [variantId]: value
    }));
  };

  const generateSKU = (product, variant) => {
    // Auto-generate SKU based on product name, color, storage, and RAM
    const prefix = product.title ? product.title.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PRD';
    
    // Handle color - could be hex code or color name
    let colorCode = '';
    if (variant.color) {
      if (variant.color.startsWith('#')) {
        const hexColors = {
          '#000000': 'BLK', '#007bff': 'BLU', '#ff0000': 'RED', 
          '#00ff00': 'GRN', '#ffff00': 'YLW', '#ff00ff': 'MGN',
          '#00ffff': 'CYN', '#ffffff': 'WHT', '#808080': 'GRY',
          '#ffa500': 'ORN', '#800080': 'PUR', '#ffc0cb': 'PNK'
        };
        colorCode = hexColors[variant.color] || 'CL';
      } else {
        colorCode = variant.color.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      }
    }
    colorCode = colorCode || 'NO';
    
    const storageCode = variant.storage ? variant.storage.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    const ramCode = variant.ram ? variant.ram.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    
    let generatedCode = `${prefix}-${colorCode}`;
    if (storageCode) generatedCode += `-${storageCode}`;
    if (ramCode) generatedCode += `-${ramCode}`;
    
    return generatedCode;
  };

  const handleGenerateSKU = (product, variant) => {
    const generated = generateSKU(product, variant);
    handleSKUChange(variant.variant_id, generated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Save each edited SKU
      for (const [variantId, sku] of Object.entries(editedSKUs)) {
        if (sku && sku.trim()) {
          await axios.put(
            `${API_BASE}/api/products/variants/${variantId}`,
            { product_code: sku },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      
      alert('SKUs saved successfully!');
      setEditedSKUs({});
      fetchProductsWithoutSKUs();
    } catch (err) {
      console.error("Error saving SKUs:", err);
      alert('Failed to save SKUs: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVariants = filteredProducts.reduce((sum, p) => sum + p.variants.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="manage-skus">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">
            Manage SKUs - Assign to Products
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Products without SKUs: {totalVariants} variants
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            type="text"
            placeholder="Search product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 w-full md:w-64"
          />
          <Button
            onClick={handleSave}
            disabled={saving || Object.keys(editedSKUs).length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">All products have SKUs assigned!</p>
          <p className="text-sm mt-2">No products need SKU assignment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProducts.map((product) => (
            <div key={product.product_id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {product.title}
              </h3>
              <div className="space-y-3">
                {product.variants.map((variant) => (
                  <div key={variant.variant_id} className="flex flex-col md:flex-row gap-3 md:items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {variant.image && (
                          <img 
                            src={variant.image.startsWith('http') ? variant.image : `${API_BASE}/${variant.image}`} 
                            alt={variant.color}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {variant.color || 'Default'}
                            {variant.storage && ` / ${variant.storage}`}
                            {variant.ram && ` / ${variant.ram}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            Variant ID: {variant.variant_id}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={editedSKUs[variant.variant_id] !== undefined 
                          ? editedSKUs[variant.variant_id] 
                          : (variant.product_code || '')}
                        onChange={(e) => handleSKUChange(variant.variant_id, e.target.value)}
                        placeholder="Enter SKU..."
                        className="font-mono text-sm w-48"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSKU(product, variant)}
                        title="Auto-generate SKU"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageSKUs;

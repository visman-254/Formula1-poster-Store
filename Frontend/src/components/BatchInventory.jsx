import React, { useState, useEffect } from 'react';
import { fetchAllBatches, migrateProductsToBatches } from '../api/batchApi';

const BatchInventory = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const token = localStorage.getItem('token');

  const handleMigrate = async () => {
    if (!window.confirm('This will create batch records for all products that have stock but no batches. Continue?')) {
      return;
    }
    try {
      setMigrating(true);
      const result = await migrateProductsToBatches(token);
      alert(result.message);
      // Reload batches
      const data = await fetchAllBatches(token);
      setBatches(data);
    } catch (err) {
      alert('Migration failed: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoading(true);
        const data = await fetchAllBatches(token);
        setBatches(data);
        setError(null);
      } catch (err) {
        setError('Failed to load batch inventory');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadBatches();
  }, [token]);

  // Aggregate data by product
  const productSummary = batches.reduce((acc, batch) => {
    const key = `${batch.product_id}-${batch.color}`;
    if (!acc[key]) {
      acc[key] = {
        product_id: batch.product_id,
        product_title: batch.product_title,
        color: batch.color,
        variant_id: batch.variant_id,
        totalRemaining: 0,
        totalValue: 0,
        batches: []
      };
    }
    acc[key].totalRemaining += Number(batch.remaining_quantity) || 0;
    acc[key].totalValue += (Number(batch.remaining_quantity) || 0) * Number(batch.buying_price);
    acc[key].batches.push(batch);
    return acc;
  }, {});

  const productList = Object.values(productSummary).map(product => {
    const wac = product.totalRemaining > 0 
      ? product.totalValue / product.totalRemaining 
      : 0;
    return { ...product, wac };
  });

  const filteredProducts = productList.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (product.product_title || '').toLowerCase().includes(searchLower) ||
      (product.color || '').toLowerCase().includes(searchTerm)
    );
  });

  const totalRemaining = filteredProducts.reduce((sum, p) => sum + p.totalRemaining, 0);
  const totalValue = filteredProducts.reduce((sum, p) => sum + p.totalValue, 0);

  const toggleRow = (key) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="batch-inventory">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-100">
          Batch Inventory - Remaining Stock by Product
        </h2>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-amber-400"
          >
            {migrating ? 'Migrating...' : 'Migrate Existing Products'}
          </button>
          <input
            type="text"
            placeholder="Search product or variant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 w-full md:w-64"
          />
        </div>
      </div>

      {/* Summary Cards - Grey/White/Black */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-300 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gray-800">{filteredProducts.length}</p>
        </div>
        <div className="bg-white border border-gray-300 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Total Remaining Units</p>
          <p className="text-2xl font-bold text-gray-800">{totalRemaining.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-300 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Total Stock Value</p>
          <p className="text-2xl font-bold text-gray-800">Kshs {totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Products Table - Monochrome */}
      <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg shadow-sm max-h-[70vh] overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-300 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium text-right">Remaining</th>
              <th className="px-4 py-3 font-medium text-right">WAC</th>
              <th className="px-4 py-3 font-medium text-right">Stock Value</th>
              <th className="px-4 py-3 font-medium text-center">Batches</th>
              <th className="px-4 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, index) => {
                const rowKey = `${product.product_id}-${product.color}`;
                const isExpanded = expandedRows[rowKey];
                return (
                  <React.Fragment key={rowKey}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{product.product_title || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-700">
                          {product.color || 'Default'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{product.totalRemaining}</td>
                      <td className="px-4 py-3 text-right text-gray-700">Kshs {product.wac.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">Kshs {product.totalValue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          {product.batches.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleRow(rowKey)}
                          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          {isExpanded ? 'Hide' : 'View'} Batches
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="8" className="px-4 py-3 bg-gray-50">
                          <div className="ml-4 border-l-2 border-gray-300 pl-4">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Batch Details:</p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-500 border-b border-gray-200">
                                  <th className="px-2 py-1 text-left font-medium">Batch ID</th>
                                  <th className="px-2 py-1 text-right font-medium">Received</th>
                                  <th className="px-2 py-1 text-right font-medium">Remaining</th>
                                  <th className="px-2 py-1 text-right font-medium">Unit Cost</th>
                                  <th className="px-2 py-1 text-right font-medium">Value</th>
                                  <th className="px-2 py-1 text-left font-medium">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.batches.map((batch) => (
                                  <tr key={batch.batch_id} className="border-b border-gray-100">
                                    <td className="px-2 py-1 text-gray-700">#{batch.batch_id}</td>
                                    <td className="px-2 py-1 text-right text-gray-600">{batch.quantity_received}</td>
                                    <td className="px-2 py-1 text-right font-medium text-gray-800">{batch.remaining_quantity}</td>
                                    <td className="px-2 py-1 text-right text-gray-700">Kshs {Number(batch.buying_price).toLocaleString()}</td>
                                    <td className="px-2 py-1 text-right font-medium text-gray-800">Kshs {(batch.remaining_quantity * batch.buying_price).toLocaleString()}</td>
                                    <td className="px-2 py-1 text-gray-500">{new Date(batch.date_received).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatchInventory;

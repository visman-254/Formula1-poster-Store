import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { importProductsFromCSV, importInventoryFromCSV } from '../api/importApi';
import { uploadImages, listImages } from '../api/imageUploadApi';
import { Upload, FileText, Package, Database, X, Download, Image } from 'lucide-react';
import './ImportData.css';

const ImportData = () => {
  const { user, token } = useUser();
  const fileInputRef = useRef(null);
  
  const [importType, setImportType] = useState('products');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [selectedImages, setSelectedImages] = useState([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageUploadResult, setImageUploadResult] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const imageInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(0, 6);
        setPreview(lines);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvData = e.target.result;
        
        let response;
        if (importType === 'products') {
          response = await importProductsFromCSV(csvData, token);
        } else {
          response = await importInventoryFromCSV(csvData, token);
        }
        
        setResult(response);
        setLoading(false);
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      setResult({
        success: 0,
        failed: 1,
        errors: [error.message]
      });
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    let csvContent;
    if (importType === 'products') {
      csvContent = 'title,description,category,color,buying_price,selling_price,stock,discount,image\nCanyon Gaming Mouse,Description here,Gaming,Black,500,1500,10,0,mouse.jpg\nWireless Earbuds,Description here,Audio,White,800,2500,20,100,earbuds.png';
    } else {
      csvContent = 'variant_id,stock,buying_price\n52,10,357\n53,15,402';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setSelectedImages(files);
      setImageUploadResult(null);
    }
  };

  const handleImageUpload = async () => {
    if (selectedImages.length === 0) return;
    
    setImageUploadLoading(true);
    setImageUploadResult(null);
    
    try {
      const formData = new FormData();
      selectedImages.forEach(file => {
        formData.append('images', file);
      });
      
      const response = await uploadImages(formData, token);
      setImageUploadResult({ success: true, ...response });
      setSelectedImages([]);
      loadExistingImages();
    } catch (error) {
      setImageUploadResult({ success: false, message: error.message });
    }
    
    setImageUploadLoading(false);
  };

  const loadExistingImages = async () => {
    try {
      const response = await listImages(token);
      setExistingImages(response.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  useEffect(() => {
    loadExistingImages();
  }, [token]);

  if (!user || user.role !== 'admin') {
    return <div className="access-denied">Access Denied</div>;
  }

  return (
    <div className="import-data-container">
      <div className="import-header">
        <h2><Database className="icon" /> Import Data from CSV</h2>
        <p>Upload a CSV file to bulk import products or update inventory</p>
      </div>

      <div className="import-type-selector">
        <button 
          className={`type-btn ${importType === 'products' ? 'active' : ''}`}
          onClick={() => { setImportType('products'); clearFile(); }}
        >
          <Package /> Import Products
        </button>
        <button 
          className={`type-btn ${importType === 'inventory' ? 'active' : ''}`}
          onClick={() => { setImportType('inventory'); clearFile(); }}
        >
          <Database /> Update Inventory
        </button>
        <button 
          className={`type-btn ${importType === 'images' ? 'active' : ''}`}
          onClick={() => { setImportType('images'); }}
        >
          <Image /> Upload Images
        </button>
      </div>

      {importType === 'images' ? (
        <div className="image-upload-section">
          <div className="image-upload-info">
            <h4>Upload Product Images</h4>
            <p>Upload multiple images at once. After uploading, use the filename in your CSV import.</p>
            <ul>
              <li>Supported formats: JPG, PNG, WebP, GIF</li>
              <li>Max 50 images at once</li>
              <li>After upload, use the filename in CSV (e.g., mouse.jpg)</li>
            </ul>
          </div>

          <div className="image-select-area">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageSelect}
              ref={imageInputRef}
              id="image-file-input"
              style={{ display: 'none' }}
            />
            
            {!selectedImages.length ? (
              <label htmlFor="image-file-input" className="upload-label">
                <Upload className="upload-icon" />
                <span>Click to select images</span>
                <span className="file-hint">Select multiple files</span>
              </label>
            ) : (
              <div className="selected-images">
                <div className="images-list">
                  {selectedImages.map((file, i) => (
                    <div key={i} className="image-item">
                      <img src={URL.createObjectURL(file)} alt={file.name} />
                      <span>{file.name}</span>
                    </div>
                  ))}
                </div>
                <button className="clear-btn" onClick={() => setSelectedImages([])}>
                  <X /> Clear All
                </button>
              </div>
            )}
          </div>

          {selectedImages.length > 0 && (
            <button 
              className="import-btn" 
              onClick={handleImageUpload}
              disabled={imageUploadLoading}
            >
              {imageUploadLoading ? 'Uploading...' : `Upload ${selectedImages.length} Images`}
            </button>
          )}

          {imageUploadResult && (
            <div className={`import-result ${imageUploadResult.success ? 'success' : 'has-errors'}`}>
              {imageUploadResult.success ? (
                <p>✅ {imageUploadResult.message}</p>
              ) : (
                <p>❌ {imageUploadResult.message}</p>
              )}
            </div>
          )}

          {existingImages.length > 0 && (
            <div className="existing-images">
              <h4>Existing Images ({existingImages.length})</h4>
              <p className="image-hint">Use these filenames in your CSV import</p>
              <div className="images-grid">
                {existingImages.slice(0, 20).map((img, i) => (
                  <div key={i} className="existing-image-item">
                    <img src={`${window.location.origin}/${img.path}`} alt={img.filename} />
                    <span className="filename">{img.filename}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="import-instructions">
            <h4>CSV Format for {importType === 'products' ? 'Products' : 'Inventory'}:</h4>
            {importType === 'products' ? (
              <ul>
                <li><strong>title</strong> - Product name (required)</li>
                <li><strong>description</strong> - Product description</li>
                <li><strong>category</strong> - Category name (required)</li>
                <li><strong>color</strong> - Variant color (default: "Default")</li>
                <li><strong>buying_price</strong> - Your cost price</li>
                <li><strong>selling_price</strong> - Price to customers (required)</li>
                <li><strong>stock</strong> - Quantity in stock</li>
                <li><strong>discount</strong> - Discount amount</li>
                <li><strong>image</strong> - Image filename (e.g., mouse.jpg)</li>
              </ul>
            ) : (
              <ul>
                <li><strong>variant_id</strong> - Product variant ID (required)</li>
                <li><strong>stock</strong> - New stock quantity</li>
                <li><strong>buying_price</strong> - New buying price (optional)</li>
              </ul>
            )}
            
            <button className="download-template-btn" onClick={downloadTemplate}>
              <Download /> Download Template
            </button>
          </div>

          <div className="file-upload-area">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
              id="csv-file-input"
              style={{ display: 'none' }}
            />
            
            {!selectedFile ? (
              <label htmlFor="csv-file-input" className="upload-label">
                <Upload className="upload-icon" />
                <span>Click to select CSV file</span>
                <span className="file-hint">or drag and drop</span>
              </label>
            ) : (
              <div className="selected-file">
                <FileText className="file-icon" />
                <div className="file-info">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button className="clear-btn" onClick={clearFile}>
                  <X />
                </button>
              </div>
            )}
          </div>

          {preview && (
            <div className="csv-preview">
              <h4>Preview (first 5 rows):</h4>
              <pre>
                {preview.map((line, i) => (
                  <div key={i} className={i === 0 ? 'header-row' : ''}>{line}</div>
                ))}
              </pre>
            </div>
          )}

          {selectedFile && (
            <button 
              className="import-btn" 
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? 'Importing...' : 'Import Data'}
            </button>
          )}

          {result && (
            <div className={`import-result ${result.failed > 0 ? 'has-errors' : 'success'}`}>
              <h4>Import Results:</h4>
              <p>✅ Success: {result.success} items</p>
              {result.failed > 0 && (
                <>
                  <p>❌ Failed: {result.failed} items</p>
                  {result.errors && result.errors.length > 0 && (
                    <div className="error-list">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <p key={i} className="error-item">{err}</p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImportData;

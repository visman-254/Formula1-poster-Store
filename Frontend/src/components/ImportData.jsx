import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { importProductsFromCSV, importInventoryFromCSV } from '../api/importApi';
import { uploadImages, listImages } from '../api/imageUploadApi';
import { Upload, FileText, Package, Database, X, Download, Image, CheckCircle, AlertCircle } from 'lucide-react';
import './ImportData.css';

const ImportData = () => {
  const { user, token } = useUser();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // State for import type and file handling
  const [importType, setImportType] = useState('products');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // State for image handling
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageUploadResult, setImageUploadResult] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  
  // Track mapping of original filename to uploaded timestamp filename
  const [uploadedImageMapping, setUploadedImageMapping] = useState({});

  // Load existing images on component mount
  useEffect(() => {
    if (token) {
      loadExistingImages();
    }
  }, [token]);

  // Load existing images from server
  const loadExistingImages = async () => {
    try {
      const response = await listImages(token);
      setExistingImages(response.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  };

  // Extract image references from CSV
  const extractImageReferencesFromCSV = (csvData) => {
    const lines = csvData.trim().split('\n');
    const dataLines = lines.slice(1); // Skip header
    const referencedImages = [];
    
    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      // Use proper CSV parsing
      const values = parseCSVLine(line);
      if (values.length >= 10 && values[9] && values[9].trim()) {
        referencedImages.push(values[9].trim());
      }
    }
    
    return referencedImages;
  };

  // Handle CSV file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  // Process selected CSV file
  const processFile = (file) => {
    setSelectedFile(file);
    setResult(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').slice(0, 6);
      setPreview(lines);
    };
    reader.readAsText(file);
  };

  // Handle image file selection
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      setSelectedImages(prev => [...prev, ...imageFiles]);
      setImageUploadResult(null);
    }
  };

  // Drag and drop handlers for CSV
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    // Check for CSV file
    const csvFile = files.find(f => f.type === 'text/csv' || f.name.endsWith('.csv'));
    if (csvFile) {
      processFile(csvFile);
    }
    
    // Check for image files
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...imageFiles]);
    }
  };

  // Drag and drop handlers for images
  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImages(true);
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImages(false);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImages(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...imageFiles]);
      setImageUploadResult(null);
    }
  };

  // Upload images to server and return mapping
  const uploadImagesToServer = async (images) => {
    setImageUploadLoading(true);
    setImageUploadResult(null);
    
    try {
      const formData = new FormData();
      images.forEach(file => {
        formData.append('images', file);
      });
      
      console.log(`Uploading ${images.length} images...`);
      const response = await uploadImages(formData, token);
      
      console.log('Upload response:', response);
      
      // Build mapping from response
      const mapping = {};
      if (response.files) {
        response.files.forEach(file => {
          mapping[file.originalName] = file.filename;
        });
      }
      
      setImageUploadResult({
        success: true,
        message: `${images.length} image(s) uploaded successfully`,
        mapping
      });
      
      // Refresh existing images list
      await loadExistingImages();
      
      return { success: true, mapping };
      
    } catch (error) {
      console.error('Image upload error:', error);
      setImageUploadResult({
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to upload images'
      });
      return { success: false, mapping: {} };
    } finally {
      setImageUploadLoading(false);
    }
  };

  // Handle standalone image upload (when importType === 'images')
  const handleImageUpload = async () => {
    if (selectedImages.length === 0) return;
    
    const result = await uploadImagesToServer(selectedImages);
    
    if (result.success) {
      // Update the global mapping with newly uploaded images
      setUploadedImageMapping(prev => ({
        ...prev,
        ...result.mapping
      }));
      
      // Clear selected images after successful upload
      setSelectedImages([]);
    }
  };

  // Main import handler
  const handleImport = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      // Read the CSV file
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        const csvData = e.target.result;
        
        // Extract image references from CSV
        const referencedImages = extractImageReferencesFromCSV(csvData);
        console.log('CSV references these images:', referencedImages);
        
        // STEP 1: Upload any selected images and get fresh mapping
        let finalMapping = { ...uploadedImageMapping }; // Start with existing mapping
        
        if (selectedImages.length > 0) {
          console.log('Uploading selected images before import...');
          const uploadResult = await uploadImagesToServer(selectedImages);
          
          if (uploadResult.success) {
            // Merge new mapping with existing
            finalMapping = {
              ...finalMapping,
              ...uploadResult.mapping
            };
            
            // Update state for future imports
            setUploadedImageMapping(finalMapping);
            
            // Clear selected images
            setSelectedImages([]);
          }
        }
        
        console.log('Final image mapping for import:', finalMapping);
        
        // STEP 2: Check for missing image mappings
        const missingMappings = referencedImages.filter(ref => {
          // Check if it's already a full path
          if (ref.includes('/')) return false;
          
          // Check if it exists in mapping or in existing images
          return !finalMapping[ref] && !existingImages.some(img => img.filename === ref);
        });
        
        if (missingMappings.length > 0) {
          console.warn('Missing mappings for:', missingMappings);
          
          const proceed = window.confirm(
            `⚠️ Warning: The following image filenames in your CSV don't match any uploaded images:\n\n` +
            missingMappings.slice(0, 10).join(', ') + 
            (missingMappings.length > 10 ? `\n... and ${missingMappings.length - 10} more` : '') +
            `\n\nMake sure you've uploaded these images first, or that the filenames exactly match.\n\nDo you want to proceed anyway?`
          );
          
          if (!proceed) {
            setLoading(false);
            return;
          }
        }
        
        // STEP 3: Import the CSV with the final mapping
        let response;
        if (importType === 'products') {
          console.log('Importing products with mapping:', finalMapping);
          response = await importProductsFromCSV(csvData, token, finalMapping);
        } else {
          console.log('Importing inventory');
          response = await importInventoryFromCSV(csvData, token);
        }
        
        console.log('Import response:', response);
        setResult(response);
        
        // Refresh existing images after successful import
        await loadExistingImages();
        
        setLoading(false);
      };
      
      fileReader.onerror = () => {
        setResult({
          success: 0,
          failed: 1,
          errors: ['Error reading CSV file']
        });
        setLoading(false);
      };
      
      fileReader.readAsText(selectedFile);
      
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: 0,
        failed: 1,
        errors: [error.response?.data?.message || error.message || 'Failed to import data']
      });
      setLoading(false);
    }
  };

  // Download template CSV
  const downloadTemplate = () => {
    let csvContent;
    if (importType === 'products') {
      csvContent = 'title,description,category,subcategory,color,buying_price,selling_price,stock,discount,image\n' +
                   'Gaming Mouse,High precision gaming mouse,Gaming,Mouse,Black,500,1500,10,0,mouse.jpg\n' +
                   'Wireless Earbuds,Noise cancelling earbuds,Audio,Headphones,White,800,2500,20,100,earbuds.png\n' +
                   'Gaming Laptop,High performance laptop,Computers,Laptops,Black,50000,75000,5,5000,laptop.jpg';
    } else {
      csvContent = 'variant_id,stock,buying_price\n' +
                   '52,10,357\n' +
                   '53,15,402';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a single selected image
  const removeImage = (indexToRemove) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Clear all selected images
  const clearAllImages = () => {
    setSelectedImages([]);
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="access-denied">
        <AlertCircle size={48} />
        <h3>Access Denied</h3>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="import-data-container">
      <div className="import-header">
        <h2>
          <Database className="icon" /> Import Data
        </h2>
        <p>Upload a CSV file to bulk import products or update inventory</p>
      </div>

      {/* Import Type Selector */}
      <div className="import-type-selector">
        <button 
          className={`type-btn ${importType === 'products' ? 'active' : ''}`}
          onClick={() => { 
            setImportType('products'); 
            clearFile(); 
          }}
        >
          <Package /> Import Products
        </button>
        <button 
          className={`type-btn ${importType === 'inventory' ? 'active' : ''}`}
          onClick={() => { 
            setImportType('inventory'); 
            clearFile(); 
          }}
        >
          <Database /> Update Inventory
        </button>
        <button 
          className={`type-btn ${importType === 'images' ? 'active' : ''}`}
          onClick={() => { 
            setImportType('images'); 
            clearFile(); 
          }}
        >
          <Image /> Upload Images
        </button>
      </div>

      {/* Image Upload Only Mode */}
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

          {/* Image Upload Area */}
          <div 
            className={`image-select-area ${isDraggingImages ? 'dragging' : ''}`}
            onDragOver={handleImageDragOver}
            onDragLeave={handleImageDragLeave}
            onDrop={handleImageDrop}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageSelect}
              ref={imageInputRef}
              id="image-file-input"
              style={{ display: 'none' }}
            />
            
            {selectedImages.length === 0 ? (
              <label htmlFor="image-file-input" className="upload-label">
                <Upload className="upload-icon" />
                <span>Click to select images</span>
                <span className="file-hint">or drag and drop here</span>
                <span className="file-hint">Select multiple files</span>
              </label>
            ) : (
              <div className="selected-images">
                <div className="images-list">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="image-item">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name} 
                        onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                      />
                      <span className="image-name">{file.name}</span>
                      <button 
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="image-actions">
                  <button className="clear-btn" onClick={clearAllImages}>
                    <X /> Clear All
                  </button>
                  <label htmlFor="image-file-input" className="add-more-btn">
                    <Upload size={16} /> Add More
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {selectedImages.length > 0 && (
            <button 
              className="import-btn" 
              onClick={handleImageUpload}
              disabled={imageUploadLoading}
            >
              {imageUploadLoading ? (
                <><span className="spinner"></span> Uploading...</>
              ) : (
                <>Upload {selectedImages.length} Image{selectedImages.length > 1 ? 's' : ''}</>
              )}
            </button>
          )}

          {/* Upload Result */}
          {imageUploadResult && (
            <div className={`import-result ${imageUploadResult.success ? 'success' : 'has-errors'}`}>
              <h4>{imageUploadResult.success ? '✅ Success' : '❌ Error'}</h4>
              <p>{imageUploadResult.message}</p>
              {imageUploadResult.success && imageUploadResult.mapping && (
                <div className="mapping-preview">
                  <p>Image mapping created:</p>
                  <pre className="mapping-json">
                    {JSON.stringify(imageUploadResult.mapping, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Existing Images Gallery */}
          {existingImages.length > 0 && (
            <div className="existing-images">
              <h4>Available Images ({existingImages.length})</h4>
              <p className="image-hint">Use these filenames in your CSV import</p>
              <div className="images-grid">
                {existingImages.slice(0, 20).map((img, index) => (
                  <div key={index} className="existing-image-item">
                    <img 
                      src={`${window.location.origin}/${img.path}`} 
                      alt={img.filename}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100?text=Error';
                      }}
                    />
                    <span className="filename" title={img.filename}>
                      {img.filename.length > 20 
                        ? img.filename.substring(0, 17) + '...' 
                        : img.filename}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CSV Import Mode */
        <>
          {/* Instructions */}
          <div className="import-instructions">
            <h4>CSV Format for {importType === 'products' ? 'Products' : 'Inventory'}:</h4>
            {importType === 'products' ? (
              <ul>
                <li><strong>title</strong> - Product name (required)</li>
                <li><strong>description</strong> - Product description</li>
                <li><strong>category</strong> - Category name (required)</li>
                <li><strong>subcategory</strong> - Subcategory name (optional, e.g., "Mouse", "Headphones")</li>
                <li><strong>color</strong> - Variant color (default: "Default")</li>
                <li><strong>buying_price</strong> - Your cost price</li>
                <li><strong>selling_price</strong> - Price to customers (required)</li>
                <li><strong>stock</strong> - Quantity in stock</li>
                <li><strong>discount</strong> - Discount amount</li>
                <li><strong>image</strong> - Image filename (must match uploaded or existing image)</li>
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

          {/* Step 1: CSV Upload */}
          <div className="upload-section">
            <h3 className="section-title">
              <FileText size={20} /> Step 1: Upload CSV File
            </h3>
            <div 
              className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
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
                  <span className="file-hint">or drag and drop here</span>
                </label>
              ) : (
                <div className="selected-file">
                  <FileText className="file-icon" />
                  <div className="file-info">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button className="clear-btn" onClick={clearFile}>
                    <X />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Image Upload */}
          <div className="upload-section">
            <h3 className="section-title">
              <Image size={20} /> Step 2: Upload Product Images (Optional)
            </h3>
            <div 
              className={`image-upload-area ${isDraggingImages ? 'dragging' : ''}`}
              onDragOver={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              onDrop={handleImageDrop}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageSelect}
                ref={imageInputRef}
                id="image-file-input-2"
                style={{ display: 'none' }}
              />
              
              {selectedImages.length === 0 ? (
                <label htmlFor="image-file-input-2" className="upload-label">
                  <Upload className="upload-icon" />
                  <span>Click to select images</span>
                  <span className="file-hint">JPG, PNG, WebP, GIF</span>
                  <span className="file-hint">Select multiple files</span>
                </label>
              ) : (
                <div className="selected-images">
                  <div className="images-grid-preview">
                    {selectedImages.slice(0, 8).map((file, index) => (
                      <div key={index} className="image-preview-item">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                        />
                        <span className="image-name" title={file.name}>
                          {file.name.length > 15 
                            ? file.name.substring(0, 12) + '...' 
                            : file.name}
                        </span>
                        <button 
                          className="remove-image-btn small"
                          onClick={() => removeImage(index)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {selectedImages.length > 8 && (
                      <div className="more-images">
                        +{selectedImages.length - 8} more
                      </div>
                    )}
                  </div>
                  <div className="image-actions">
                    <button className="clear-btn small" onClick={clearAllImages}>
                      <X /> Clear All
                    </button>
                    <label htmlFor="image-file-input-2" className="add-more-btn small">
                      <Upload size={14} /> Add More
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CSV Preview */}
          {selectedFile && preview && preview.length > 0 && (
            <div className="csv-preview">
              <h4>📄 Preview of: {selectedFile.name}</h4>
              <pre>
                {preview.map((line, index) => (
                  <div key={index} className={index === 0 ? 'header-row' : ''}>
                    {line}
                  </div>
                ))}
              </pre>
            </div>
          )}

          {/* Import Button */}
          {selectedFile && (
            <button 
              className="import-btn" 
              onClick={handleImport}
              disabled={loading || imageUploadLoading}
            >
              {loading ? (
                <><span className="spinner"></span> Importing...</>
              ) : (
                <>
                  <CheckCircle size={18} /> 
                  Import {importType === 'products' ? 'Products' : 'Inventory'}
                  {selectedImages.length > 0 && ` + ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''}`}
                </>
              )}
            </button>
          )}

          {/* Import Result */}
          {result && (
            <div className={`import-result ${result.failed > 0 ? 'has-errors' : 'success'}`}>
              <h4>Import Results:</h4>
              <p>✅ Success: {result.success} item{result.success !== 1 ? 's' : ''}</p>
              {result.failed > 0 && (
                <>
                  <p>❌ Failed: {result.failed} item{result.failed !== 1 ? 's' : ''}</p>
                  {result.errors && result.errors.length > 0 && (
                    <div className="error-list">
                      <p className="error-title">Errors:</p>
                      {result.errors.slice(0, 10).map((err, index) => (
                        <p key={index} className="error-item">{err}</p>
                      ))}
                      {result.errors.length > 10 && (
                        <p className="error-more">
                          ... and {result.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Existing Images Gallery */}
          {existingImages.length > 0 && (
            <div className="existing-images">
              <h4>Available Images ({existingImages.length})</h4>
              <p className="image-hint">Use these filenames in your CSV import</p>
              <div className="images-grid">
                {existingImages.slice(0, 12).map((img, index) => (
                  <div key={index} className="existing-image-item">
                    <img 
                      src={`${window.location.origin}/${img.path}`} 
                      alt={img.filename}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100?text=Error';
                      }}
                    />
                    <span className="filename" title={img.filename}>
                      {img.filename.length > 20 
                        ? img.filename.substring(0, 17) + '...' 
                        : img.filename}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImportData;
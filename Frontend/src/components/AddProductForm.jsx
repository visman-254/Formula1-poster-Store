import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import API_BASE from "../config";
import BarcodeScanner from "./BarcodeScanner";
import { Camera, Palette, Upload, Check } from "lucide-react";
import ColorPicker from "./ColorPicker";
import ColorPickerModal from "./ColorPickerModal";
import ImageColorMapperModal from "./ImageColorMapperModal";

const CategoryInput = ({ label, placeholder, value, onChange, suggestions, onSelect }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter((s) =>
    s.category_name.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="space-y-2 relative">
      <Label>{label}</Label>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        autoComplete="off"
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border dark:bg-gray-800 dark:border-gray-700 w-full mt-1 max-h-40 overflow-y-auto rounded shadow">
          {filteredSuggestions.map((s) => (
            <li
              key={s.category_id}
              onMouseDown={() => onSelect(s.category_name)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
            >
              {s.category_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AddProductForm = () => {
  const { user, token } = useUser();

  const [productData, setProductData] = useState({
    title: "",
    description: "",
  });

  const [variants, setVariants] = useState([
    {
      color: "#000000", 
      storage: "", // Storage (e.g., 128GB, 256GB)
      ram: "", // RAM (e.g., 4GB, 8GB)
      buying_price: "",
      profit_margin: "",
      discount: "",
      stock: "",
      image: null,
      imagePreview: null,
      final_price: "0",
      imeis: "", // IMEI numbers for this variant (comma or newline separated)
      product_code: "", // SKU/Barcode for this variant
    },
  ]);
  
  const [isBundle, setIsBundle] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [bundleItems, setBundleItems] = useState([]);
  const [bundlePrice, setBundlePrice] = useState("");
  const [selectedVariantForBundle, setSelectedVariantForBundle] = useState("");
  
  // IMEI Management State
  const [showImeiModal, setShowImeiModal] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [imeiText, setImeiText] = useState("");
  const [imeiLoading, setImeiLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [imeiMessage, setImeiMessage] = useState("");

  // Quick Generate State
  const [useQuickGenerate, setUseQuickGenerate] = useState(false);
  const [quickColors, setQuickColors] = useState("");
  const [quickStorage, setQuickStorage] = useState("");
  const [quickRam, setQuickRam] = useState("");
  const [quickStock, setQuickStock] = useState("1");
  const [quickBuyingPrice, setQuickBuyingPrice] = useState(""); // comma-separated buying prices
  const [quickSellingPrice, setQuickSellingPrice] = useState(""); // comma-separated selling prices
  const [savedColors, setSavedColors] = useState([]); // colors from color picker
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [quickImages, setQuickImages] = useState([]); // uploaded images for quick generate
  const [showImageMapper, setShowImageMapper] = useState(false); // show image-to-color mapping
  const [colorImageMapping, setColorImageMapping] = useState({}); // color hex -> image object mapping

  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [message, setMessage] = useState("");
  const [allCategories, setAllCategories] = useState([]);

  useEffect(() => {
    const fetchAllProducts = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/products/admin`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllProducts(res.data);
        } catch (err) {
            console.error("Error fetching all products:", err);
        }
    };
    
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/products/categories/admin`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    if (token) {
      fetchAllProducts();
      fetchCategories();
    }
  }, [token]);

  const allVariants = useMemo(() => {
    return allProducts.flatMap(p => 
        p.variants?.map(v => ({
            ...v,
            product_id: p.product_id,
            product_title: p.title
        })) || []
    ).filter(v => v.variant_id);
  }, [allProducts]);

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, e) => {
    const { name, value, files } = e.target;
    const newVariants = [...variants];
    if (name === "image") {
      const file = files[0];
      newVariants[index].image = file;
      newVariants[index].imagePreview = file ? URL.createObjectURL(file) : null;
    } else {
      newVariants[index][name] = value;
    }
    if (name === "final_price") {
      const bp = Number(newVariants[index].buying_price) || 0;
      const disc = Number(newVariants[index].discount) || 0;
      newVariants[index].profit_margin = Number(value) - bp + disc;
    } else if (name === "buying_price" || name === "profit_margin" || name === "discount") {
      newVariants[index].final_price = calculateFinalPrice(newVariants[index]);
    }
    setVariants(newVariants);
  };
  
  const handleColorChange = (index, e) => {
    const newVariants = [...variants];
    newVariants[index].color = e.target.value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        color: "#000000", 
        storage: "",
        ram: "",
        buying_price: "",
        profit_margin: "",
        discount: "",
        stock: "",
        image: null,
        imagePreview: null,
        final_price: "0",
        imeis: "",
      },
    ]);
  };

  const removeVariant = (index) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  // Quick Generate Variants Handler
  const handleQuickGenerate = () => {
    // Parse comma-separated values
    const colorList = quickColors.split(',').map(c => c.trim()).filter(c => c);
    const storageList = quickStorage.split(',').map(s => s.trim()).filter(s => s);
    const ramList = quickRam.split(',').map(r => r.trim()).filter(r => r);
    // Parse comma-separated stock values
    const stockList = quickStock.split(',').map(s => s.trim()).filter(s => s);

    // Also include saved colors from color picker
    const pickerColors = savedColors.map(c => c.hex);
    const allColors = [...colorList, ...pickerColors].filter(c => c);

    if (allColors.length === 0 && storageList.length === 0 && ramList.length === 0) {
      setMessage("Please enter at least one option for colors, storage, or RAM");
      return;
    }

    // Parse comma-separated buying and selling prices
    const buyingPrices = quickBuyingPrice.split(',').map(p => Number(p.trim()) || 0).filter(p => p > 0);
    const sellingPrices = quickSellingPrice.split(',').map(p => Number(p.trim()) || 0).filter(p => p > 0);

    // Generate all combinations
    const generatedVariants = [];
    
    // If no lists provided, use single empty value
    const colors = allColors.length > 0 ? allColors : [''];
    const storages = storageList.length > 0 ? storageList : [''];
    const rams = ramList.length > 0 ? ramList : [''];
    const stocks = stockList.length > 0 ? stockList : ['1'];

    colors.forEach((color, colorIndex) => {
      storages.forEach((storage, storageIndex) => {
        rams.forEach((ram, ramIndex) => {
          const variantIndex = generatedVariants.length;
          
          // Get buying price - cycle through values or use first
          const buyingPrice = buyingPrices.length > 0 
            ? buyingPrices[variantIndex % buyingPrices.length] 
            : 0;
          
          // Get selling price - cycle through values or use first
          const sellingPrice = sellingPrices.length > 0 
            ? sellingPrices[variantIndex % sellingPrices.length] 
            : 0;
          
          // Get stock for this variant - cycle through stock values if not enough
          const stockIndex = variantIndex % stocks.length;
          const stock = stocks[stockIndex];
          
          // Get mapped image for this variant (color + storage + ram combo)
          let variantImage = null;
          let variantImagePreview = null;
          
          // Try to find mapped image by combo id
          const comboId = `${colorIndex}-${storageIndex}-${ramIndex}`;
          if (colorImageMapping[comboId]) {
            const mappedImage = colorImageMapping[comboId];
            variantImage = mappedImage.file;
            variantImagePreview = mappedImage.preview;
          }
          
          generatedVariants.push({
            color: color || '#000000',
            storage,
            ram,
            buying_price: buyingPrice.toString(),
            profit_margin: '',
            discount: '',
            stock: stock.toString(),
            image: variantImage,
            imagePreview: variantImagePreview,
            final_price: sellingPrice.toString(),
            imeis: '',
            product_code: ''
          });
        });
      });
    });

    setVariants(generatedVariants);
    setMessage(`${generatedVariants.length} variants generated! You can edit them below if needed.`);
    setUseQuickGenerate(false);
  };

  // Handle saved colors from ColorPicker
  const handleSavedColorsChange = (colors) => {
    setSavedColors(colors);
  };

  // Handle quick image upload
  const handleQuickImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setQuickImages([...quickImages, ...newImages]);
  };

  const removeQuickImage = (index) => {
    const newImages = [...quickImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setQuickImages(newImages);
  };

  // Update current color from color picker
  const [currentPickerColor, setCurrentPickerColor] = useState("#000000");
  
  const handleAddBundleItem = () => {
    if (!selectedVariantForBundle) return;
    const variant = allVariants.find(v => v.variant_id === parseInt(selectedVariantForBundle));
    if (variant && !bundleItems.find(item => item.variant_id === variant.variant_id)) {
        setBundleItems([...bundleItems, { ...variant, quantity: 1 }]);
    }
  };

  const handleBundleItemQuantityChange = (variant_id, quantity) => {
    setBundleItems(bundleItems.map(item => item.variant_id === variant_id ? { ...item, quantity: parseInt(quantity) || 1 } : item));
  };
  
  const removeBundleItem = (variant_id) => {
    setBundleItems(bundleItems.filter(item => item.variant_id !== variant_id));
  };

  // --- IMEI Management Functions ---
  const openImeiModal = (variantIndex) => {
    // Get the variant ID from the variants array
    const variant = variants[variantIndex];
    setSelectedVariantId(variant?.variant_id || variantIndex);
    setImeiText(variant?.imeis || "");
    setImeiMessage("");
    setShowImeiModal(true);
    setShowScanner(false);
  };

  const closeImeiModal = () => {
    setShowImeiModal(false);
    setSelectedVariantId(null);
    setImeiText("");
    setImeiMessage("");
    setShowScanner(false);
  };

  // Handle barcode scan from camera - adds comma after each scan
  const handleBarcodeScan = (scannedText) => {
    if (!scannedText) return;
    
    // Clean the scanned text
    const cleaned = scannedText.replace(/[\r\n\t\x00-\x1F]/g, '').trim();
    if (!cleaned) return;
    
    // Add comma separator if there's already text
    const currentText = imeiText.trim();
    const newText = currentText ? `${currentText}, ${cleaned}` : cleaned;
    
    setImeiText(newText);
    setShowScanner(false);
  };

  const saveImeis = async () => {
    if (!imeiText.trim()) {
      setImeiMessage("Please enter at least one IMEI number");
      return;
    }
    
    setImeiLoading(true);
    setImeiMessage("");
    
    try {
      console.log(`[AddProductForm] Saving IMEIs for variant ${selectedVariantId}, count: ${imeiText.split(/[,\n]+/).filter(i => i.trim()).length}`);
      
      const response = await axios.post(`${API_BASE}/api/imei/${selectedVariantId}/bulk`, {
        imeiText: imeiText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`[AddProductForm] IMEI save response:`, response.data);
      
      setImeiMessage(`✓ Successfully added ${response.data.added} IMEI(s)${response.data.duplicates?.length ? `, ${response.data.duplicates.length} duplicates skipped` : ''}`);
      setImeiText("");
      
      // Refresh products to update IMEI counts
      const res = await axios.get(`${API_BASE}/api/products/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllProducts(res.data);
      
    } catch (err) {
      console.error(`[AddProductForm] Error saving IMEIs:`, err);
      setImeiMessage(`❌ Error: ${err.response?.data?.error || 'Failed to save IMEIs'}`);
    } finally {
      setImeiLoading(false);
    }
  };

  const calculateFinalPrice = (variant) => {
    const bp = Number(variant.buying_price) || 0;
    const pm = Number(variant.profit_margin) || 0;
    const disc = Number(variant.discount) || 0;
    return bp + pm - disc;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!productData.title || !categoryName) {
      setMessage("Product Title and Category are required");
      return;
    }

    let fullCategoryPath = categoryName;
    if (subcategoryName) {
      fullCategoryPath = `${categoryName} > ${subcategoryName}`;
    }
    
    try {
        const fd = new FormData();
        fd.append("title", productData.title);
        fd.append("description", productData.description);
        fd.append("categoryName", fullCategoryPath);
        fd.append("is_bundle", isBundle);

        if (isBundle) {
            if (bundleItems.length < 1) {
                setMessage("A bundle must contain at least 1 product.");
                return;
            }
            if (!bundlePrice) {
                setMessage("Bundle price is required.");
                return;
            }

            const bundleOfData = bundleItems.map(item => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity
            }));
            fd.append("bundle_of", JSON.stringify(bundleOfData));

            const bundleVariant = {
                color: 'Bundle',
                price: bundlePrice,
                stock: 1, 
                buying_price: bundleItems.reduce((acc, item) => acc + (item.buying_price * item.quantity), 0),
                profit_margin: 0,
                discount: 0
            };
            fd.append("variants", JSON.stringify([bundleVariant]));

        } else {
            const variantsForUpload = variants.map(v => {
                const { image, imagePreview, ...rest } = v;
                return { ...rest, price: v.final_price, hasImage: !!image };
            });

            fd.append("variants", JSON.stringify(variantsForUpload));

            variants.forEach(variant => {
                if (variant.image) {
                    fd.append("images", variant.image);
                }
            });
        }
      
        const res = await axios.post(`${API_BASE}/api/products`, fd, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
        });

        setMessage(res.data.message || "Product added successfully");
        setProductData({ title: "", description: "" });
        setVariants([{
            color: "#000000", buying_price: "", profit_margin: "", discount: "", stock: "", image: null, imagePreview: null, final_price: "", imeis: ""
        }]);
        setCategoryName("");
        setSubcategoryName("");
        setIsBundle(false);
        setBundleItems([]);
        setBundlePrice("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "❌ Failed to add product");
    }
  };

  const topLevelCategories = useMemo(() => allCategories.filter(c => !c.parent_id), [allCategories]);
  
  const subcategorySuggestions = useMemo(() => {
    const parent = allCategories.find(c => c.category_name === categoryName);
    return parent?.subcategories || [];
  }, [categoryName, allCategories]);

  return (
    <Card className="min-h-screen bg-glass p-4">
      <CardHeader>
        <CardTitle>Add Product</CardTitle>
        <CardDescription>Add a new product with color variants to the store.</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <p className="mb-4 text-sm text-green-600 font-semibold">{message}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="is-bundle" checked={isBundle} onCheckedChange={setIsBundle} />
            <Label htmlFor="is-bundle">Create a Bundle</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Product Title</Label>
            <Input id="title" name="title" value={productData.title} onChange={handleProductChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CategoryInput
              label="Category"
              placeholder="Select or type a category"
              value={categoryName}
              onChange={setCategoryName}
              suggestions={topLevelCategories}
              onSelect={(name) => {
                setCategoryName(name);
                setSubcategoryName(""); 
              }}
            />
            <CategoryInput
              label="Subcategory (Optional)"
              placeholder="Select or type a subcategory"
              value={subcategoryName}
              onChange={setSubcategoryName}
              suggestions={subcategorySuggestions}
              onSelect={setSubcategoryName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={productData.description} 
              onChange={handleProductChange}
              placeholder="Enter product features (each line will become a bullet point)
Example:
Product features
13mm Speakers
Stereo sound
Bluetooth 5.3"
              rows={6}
              className="bg-transparent dark:bg-transparent border border-gray-300 dark:border-gray-700 text-black dark:text-white resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Each new line will be displayed as a bullet point on the product page</p>
          </div>

          <div className="border-t pt-4 mt-4">
            {isBundle ? (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Bundle Configuration</h3>
                    <div className="space-y-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-grow">
                                <Label>Add Product to Bundle</Label>
                                <Select onValueChange={setSelectedVariantForBundle} value={selectedVariantForBundle}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a product variant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allVariants.map(v => (
                                            <SelectItem key={v.variant_id} value={v.variant_id.toString()}>
                                                {v.product_title} - {v.color} (Stock: {v.stock})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" className="cursor-pointer" onClick={handleAddBundleItem}>Add</Button>
                        </div>

                        <div className="space-y-2">
                            <Label>Bundle Items</Label>
                            <div className="space-y-2">
                                {bundleItems.map(item => (
                                    <div key={item.variant_id} className="flex items-center gap-4 p-2 border rounded">
                                        <img src={item.image} alt={item.product_title} className="h-12 w-12 object-cover rounded" />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{item.product_title} - {item.color}</p>
                                            <p className="text-sm text-gray-500">Stock: {item.stock}</p>
                                        </div>
                                        <div className="w-24">
                                          <Label htmlFor={`qty-${item.variant_id}`}>Quantity</Label>
                                          <Input id={`qty-${item.variant_id}`} type="number" min="1" value={item.quantity} onChange={(e) => handleBundleItemQuantityChange(item.variant_id, e.target.value)} />
                                        </div>
                                        <Button type="button" variant="destructive" size="sm" className="cursor-pointer" onClick={() => removeBundleItem(item.variant_id)}>X</Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Bundle Price</Label>
                          <Input type="number" value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} placeholder="e.g. 199.99" required />
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                  {/* Quick Generate Section */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Quick Generate Variants</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Generate multiple variants at once from lists</p>
                      </div>
                      <Switch 
                        id="quick-generate" 
                        checked={useQuickGenerate} 
                        onCheckedChange={setUseQuickGenerate} 
                      />
                    </div>

                    {useQuickGenerate && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Colors (comma-separated)</Label>
                          <Input 
                            value={quickColors} 
                            onChange={(e) => setQuickColors(e.target.value)} 
                            placeholder="Black, White, Blue"
                          />
                          <p className="text-xs text-gray-500">e.g., #000000, #FFFFFF, #007bff</p>
                          
                          {/* Color Picker Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="mt-2 cursor-pointer"
                          >
                            <Palette className="w-4 h-4 mr-2" /> Pick Colors
                          </Button>
                          
                          {/* Color Picker Modal */}
                          {showColorPicker && (
                            <ColorPickerModal
                              isOpen={showColorPicker}
                              onClose={() => setShowColorPicker(false)}
                              onColorSelect={handleSavedColorsChange}
                              existingColors={savedColors}
                            />
                          )}
                          
                          {/* Image to Color Mapper Modal */}
                          {showImageMapper && (
                            <ImageColorMapperModal
                              isOpen={showImageMapper}
                              onClose={() => setShowImageMapper(false)}
                              images={quickImages}
                              colors={[...savedColors, ...quickColors.split(',').map(c => ({ hex: c.trim(), name: c.trim() })).filter(c => c.hex)]
                                .filter((c, i, arr) => arr.findIndex(x => x.hex === c.hex) === i) // remove duplicates
                              }
                              storages={quickStorage.split(',').map(s => s.trim()).filter(s => s)}
                              rams={quickRam.split(',').map(r => r.trim()).filter(r => r)}
                              onMappingSave={setColorImageMapping}
                            />
                          )}
                          
                          {/* Show saved colors */}
                          {savedColors.length > 0 && (
                            <div className="mt-2">
                              <Label className="text-xs">Selected Colors ({savedColors.length}):</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {savedColors.map((color, idx) => (
                                  <div
                                    key={idx}
                                    className="w-6 h-6 rounded-full border"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Storage (comma-separated)</Label>
                          <Input 
                            value={quickStorage} 
                            onChange={(e) => setQuickStorage(e.target.value)} 
                            placeholder="256GB, 512GB, 1TB"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>RAM (comma-separated)</Label>
                          <Input 
                            value={quickRam} 
                            onChange={(e) => setQuickRam(e.target.value)} 
                            placeholder="8GB, 12GB, 16GB"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Buying Price (comma-separated)</Label>
                          <Input 
                            value={quickBuyingPrice} 
                            onChange={(e) => setQuickBuyingPrice(e.target.value)} 
                            placeholder="50000, 55000, 60000"
                          />
                          <p className="text-xs text-gray-500">Cost per variant - cycles through list</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Selling Price (comma-separated)</Label>
                          <Input 
                            value={quickSellingPrice} 
                            onChange={(e) => setQuickSellingPrice(e.target.value)} 
                            placeholder="55000, 60000, 65000"
                          />
                          <p className="text-xs text-gray-500">Final price - cycles through list</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Stock per Variant (comma-separated)</Label>
                          <Input 
                            type="text"
                            value={quickStock} 
                            onChange={(e) => setQuickStock(e.target.value)} 
                            placeholder="1"
                          />
                          <p className="text-xs text-gray-500">e.g., 1,3,5 for different stock per variant</p>
                        </div>

                        {/* Image Upload Section */}
                        <div className="col-span-2 md:col-span-4 space-y-2">
                          <Label>Upload Images for Variants</Label>
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleQuickImageUpload}
                              className="hidden"
                              id="quick-image-upload"
                            />
                            <label
                              htmlFor="quick-image-upload"
                              className="flex flex-col items-center justify-center cursor-pointer"
                            >
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-sm text-gray-500">Click to upload images</span>
                              <span className="text-xs text-gray-400">One image per color variant</span>
                            </label>
                          </div>
                          
                          {/* Image Previews */}
                          {quickImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {quickImages.map((img, idx) => (
                                <div key={idx} className="relative group">
                                  <img
                                    src={img.preview}
                                    alt={`Upload ${idx + 1}`}
                                    className="w-16 h-16 object-cover rounded border"
                                  />
                                  <button
                                    onClick={() => removeQuickImage(idx)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Map Images to Variants Button */}
                          {(() => {
                            const colorCount = savedColors.length || quickColors.split(',').filter(c => c.trim()).length || 1;
                            const storageCount = quickStorage.split(',').filter(s => s.trim()).length || 1;
                            const ramCount = quickRam.split(',').filter(r => r.trim()).length || 1;
                            const variantCount = colorCount * storageCount * ramCount;
                            
                            return quickImages.length > 0 && variantCount > 0 ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowImageMapper(true)}
                                className="mt-2 cursor-pointer"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Map Images to {variantCount} Variants
                              </Button>
                            ) : null;
                          })()}
                          
                          {/* Show current mapping */}
                          {Object.keys(colorImageMapping).length > 0 && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              <p className="text-xs text-green-700 dark:text-green-300">
                                ✓ {Object.keys(colorImageMapping).length} variants mapped to images
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="col-span-2 md:col-span-4 flex gap-2 mt-2">
                          <Button 
                            type="button" 
                            onClick={handleQuickGenerate}
                            className="cursor-pointer bg-blue-600 hover:bg-blue-700"
                          >
                            Generate {((([...quickColors.split(',').filter(c => c.trim()), ...savedColors.map(c => c.hex)].filter(c => c).length) || 1) * (quickStorage.split(',').filter(s => s.trim()).length || 1) * (quickRam.split(',').filter(r => r.trim()).length || 1))} Variants
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setQuickColors('');
                              setQuickStorage('');
                              setQuickRam('');
                              setQuickBuyingPrice('');
                              setQuickSellingPrice('');
                              setQuickStock('1');
                              setSavedColors([]);
                              setQuickImages([]);
                              setColorImageMapping({});
                              setShowColorPicker(false);
                            }}
                            className="cursor-pointer"
                          >
                            Clear
                          </Button>
                          {variants.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setVariants([{
                                  color: '#000000',
                                  storage: '',
                                  ram: '',
                                  buying_price: '',
                                  profit_margin: '',
                                  discount: '',
                                  stock: '',
                                  image: null,
                                  imagePreview: null,
                                  final_price: '0',
                                  imeis: '',
                                  product_code: ''
                                }]);
                                setUseQuickGenerate(false);
                                setSavedColors([]);
                                setShowColorPicker(false);
                              }}
                              className="cursor-pointer text-orange-600 border-orange-600 hover:bg-orange-50"
                            >
                              Reset to Manual
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold mb-2">Product Variants</h3>
                    {variants.map((variant, index) => (
                      <div key={index} className="border p-4 rounded-md mb-4 relative">
                        <h4 className="text-md font-semibold mb-2">Variant {index + 1}</h4>
                        {variants.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" className="cursor-pointer absolute top-2 right-2" onClick={() => removeVariant(index)}>Remove</Button>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          
                          <div className="space-y-2 flex items-end gap-2">
                            <div className="flex-grow space-y-2">
                              <Label htmlFor={`color-${index}`}>Color (Hex)</Label>
                              <Input 
                                id={`color-hex-${index}`} 
                                name="color" 
                                type="text" 
                                value={variant.color} 
                                onChange={(e) => handleVariantChange(index, e)} 
                                placeholder="#RRGGBB"
                              />
                            </div>
                            <div className="flex-shrink-0">
                              <Label htmlFor={`color-${index}`}>Picker</Label>
                              <Input 
                                id={`color-${index}`} 
                                name="color-picker"
                                type="color" 
                                value={variant.color} 
                                onChange={(e) => handleColorChange(index, e)} 
                                className="h-10 w-10 p-0 border-none cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`storage-${index}`}>Storage</Label>
                            <Input 
                              id={`storage-${index}`} 
                              name="storage" 
                              type="text" 
                              value={variant.storage || ''} 
                              onChange={(e) => handleVariantChange(index, e)} 
                              placeholder="e.g., 256GB"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`ram-${index}`}>RAM</Label>
                            <Input 
                              id={`ram-${index}`} 
                              name="ram" 
                              type="text" 
                              value={variant.ram || ''} 
                              onChange={(e) => handleVariantChange(index, e)} 
                              placeholder="e.g., 8GB"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`stock-${index}`}>Stock</Label>
                            <Input id={`stock-${index}`} name="stock" type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, e)} required />
                          </div>
                          
                          {/* SKU/Barcode Input */}
                          <div className="space-y-2">
                            <Label htmlFor={`product_code-${index}`}>SKU / Barcode (Optional)</Label>
                            <div className="flex gap-2">
                              <Input 
                                id={`product_code-${index}`} 
                                name="product_code" 
                                type="text" 
                                value={variant.product_code || ''} 
                                onChange={(e) => handleVariantChange(index, e)} 
                                placeholder="e.g., S26-BLK-256-8GB"
                                className="font-mono text-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Auto-generate SKU based on product name, color, storage, and RAM
                                  const prefix = productData.title ? productData.title.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PRD';
                                  
                                  // Handle color - could be hex code like #000000 or color name
                                  let colorCode = '';
                                  if (variant.color) {
                                    if (variant.color.startsWith('#')) {
                                      // It's a hex code - convert to color name
                                      const hexColors = {
                                        '#000000': 'BLK', '#007bff': 'BLU', '#ff0000': 'RED', 
                                        '#00ff00': 'GRN', '#ffff00': 'YLW', '#ff00ff': 'MGN',
                                        '#00ffff': 'CYN', '#ffffff': 'WHT', '#808080': 'GRY',
                                        '#ffa500': 'ORN', '#800080': 'PUR', '#ffc0cb': 'PNK'
                                      };
                                      colorCode = hexColors[variant.color] || 'CL';
                                    } else {
                                      // It's a color name
                                      colorCode = variant.color.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
                                    }
                                  }
                                  colorCode = colorCode || 'NO';
                                  
                                  console.log('[SKU Generate] Color value:', variant.color, '-> Color code:', colorCode);
                                  
                                  const storageCode = variant.storage ? variant.storage.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
                                  const ramCode = variant.ram ? variant.ram.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
                                  
                                  // Build SKU: PREFIX-COLOR-STORAGE-RAM (e.g., S26-BLK-256-8GB)
                                  let generatedCode = `${prefix}-${colorCode}`;
                                  if (storageCode) generatedCode += `-${storageCode}`;
                                  if (ramCode) generatedCode += `-${ramCode}`;
                                  
                                  console.log('[SKU Generate] Final SKU:', generatedCode);
                                  
                                  const newVariants = [...variants];
                                  newVariants[index].product_code = generatedCode;
                                  setVariants(newVariants);
                                }}
                                title="Auto-generate SKU"
                              >
                                Generate
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`buying_price-${index}`}>Buying Price</Label>
                            <Input id={`buying_price-${index}`} name="buying_price" type="number" value={variant.buying_price} onChange={(e) => handleVariantChange(index, e)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`profit_margin-${index}`}>Profit Margin</Label>
                            <Input id={`profit_margin-${index}`} name="profit_margin" type="number" value={variant.profit_margin} onChange={(e) => handleVariantChange(index, e)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`discount-${index}`}>Discount</Label>
                            <Input id={`discount-${index}`} name="discount" type="number" value={variant.discount} onChange={(e) => handleVariantChange(index, e)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Final Selling Price</Label>
                            <Input type="number" name="final_price" value={variant.final_price} onChange={(e) => handleVariantChange(index, e)} className="font-bold" />
                          </div>
                          
                          {/* IMEI Input Field */}
                          <div className="col-span-2 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={'imeis-' + index}>IMEI Numbers (Optional)</Label>
                            </div>
                            <button
                              type="button"
                              className="w-full py-2 px-3 bg-transparent dark:bg-transparent hover:bg-black text-white text-sm font-medium rounded-md flex items-center justify-center gap-2 border border-grey-200 dark:border-gray-400"
                              onClick={() => openImeiModal(index)}
                            >
                              <Camera size={18} />
                               Scan Barcode/IMEI
                            </button>
                            <Input 
                              id={'imeis-' + index}
                              name="imeis" 
                              value={variant.imeis || ''} 
                              onChange={(e) => handleVariantChange(index, e)}
                              placeholder="Or type IMEIs here, comma separated"
                            />
                            <p className="text-xs text-gray-500">Enter each IMEI comma separated. Leave empty to add later.</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`image-${index}`}>Variant Image</Label>
                            <Input id={`image-${index}`} name="image" type="file" accept="image/*" onChange={(e) => handleVariantChange(index, e)} />
                            {variant.imagePreview && (
                              <div className="mt-2">
                                <img src={variant.imagePreview} alt="Preview" className="h-32 object-contain rounded border" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="cursor-pointer" onClick={addVariant}>Add Another Variant</Button>
                </div>
            )}
          </div>

          <Button type="submit" className="cursor-pointer text-black bg-stone-500 hover:bg-stone-600 focus:ring-4 focus:outline-none focus:ring-stone-300">Add Product</Button>
        </form>
      </CardContent>

      {/* IMEI Management Modal */}
      {showImeiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add IMEI Numbers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter IMEI numbers, one per line or comma-separated, or scan with camera:
            </p>
            
            {/* Scan with Camera Button */}
            <button
              className="btn btn-outline btn-md w-full mb-4"
              onClick={() => setShowScanner(!showScanner)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Camera size={18} />
              {showScanner ? 'Close Scanner' : 'Scan with Camera'}
            </button>
            
            {/* Camera Scanner Component */}
            {showScanner && (
              <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', border: '2px solid #10b981' }}>
                <BarcodeScanner
                  onScanSuccess={handleBarcodeScan}
                  onScanError={(err) => console.error('Scan error:', err)}
                />
              </div>
            )}
            
            <textarea
              value={imeiText}
              onChange={(e) => setImeiText(e.target.value)}
              placeholder="IMEI1&#10;IMEI2&#10;IMEI3&#10;..."
              className="w-full h-40 p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
            {imeiMessage && (
              <p className={`mt-2 text-sm ${imeiMessage.includes('❌') ? 'text-red-500' : 'text-green-500'}`}>
                {imeiMessage}
              </p>
            )}
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" className="cursor-pointer" onClick={closeImeiModal}>Close</Button>
              <Button className="cursor-pointer" onClick={saveImeis} disabled={imeiLoading}>
                {imeiLoading ? 'Saving...' : 'Save IMEIs'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AddProductForm;
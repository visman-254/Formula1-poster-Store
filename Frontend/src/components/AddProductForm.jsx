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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import API_BASE from "../config";

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
      buying_price: "",
      profit_margin: "",
      discount: "",
      stock: "",
      image: null,
      imagePreview: null,
      final_price: "0",
    },
  ]);
  
  const [isBundle, setIsBundle] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [bundleItems, setBundleItems] = useState([]);
  const [bundlePrice, setBundlePrice] = useState("");
  const [selectedVariantForBundle, setSelectedVariantForBundle] = useState("");

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
        buying_price: "",
        profit_margin: "",
        discount: "",
        stock: "",
        image: null,
        imagePreview: null,
        final_price: "0",
      },
    ]);
  };

  const removeVariant = (index) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };
  
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
            color: "#000000", buying_price: "", profit_margin: "", discount: "", stock: "", image: null, imagePreview: null, final_price: ""
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
            <Input id="description" name="description" value={productData.description} onChange={handleProductChange} />
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
                            <Button type="button" onClick={handleAddBundleItem}>Add</Button>
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
                                        <Button type="button" variant="destructive" size="sm" onClick={() => removeBundleItem(item.variant_id)}>X</Button>
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
                    <h3 className="text-lg font-semibold mb-2">Product Variants</h3>
                    {variants.map((variant, index) => (
                      <div key={index} className="border p-4 rounded-md mb-4 relative">
                        <h4 className="text-md font-semibold mb-2">Variant {index + 1}</h4>
                        {variants.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeVariant(index)} className="absolute top-2 right-2">Remove</Button>
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
                            <Label htmlFor={`stock-${index}`}>Stock</Label>
                            <Input id={`stock-${index}`} name="stock" type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, e)} required />
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
                    <Button type="button" variant="outline" onClick={addVariant}>Add Another Variant</Button>
                </div>
            )}
          </div>

          <Button type="submit" className="text-white">Add Product</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddProductForm;
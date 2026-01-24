import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MoreVertical, SquarePen, CookingPot, Delete } from "lucide-react";
import "./ProductCard.css";
import API_BASE from "../config";

const calculateSellingPrice = (buying_price, profit_margin, discount) => {
    const bp = Number(buying_price) || 0;
    const pm = Number(profit_margin) || 0;
    const disc = Number(discount) || 0;
    return bp + pm - disc;
};

const getVariantDisplay = (product, variant) => {
    if (variant.color && variant.color !== 'Default') {
        return `${product.title} (${variant.color})`;
    }
    return `${product.title} (Variant #${variant.variant_id})`;
};

const AdminImageGallery = ({ product }) => {
    const { user, token } = useUser();
    const [images, setImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImages = async () => {
            if (!product?.product_id) return;
            
            try {
                setLoading(true);
                const res = await axios.get(
                    `${API_BASE}/api/gallery/${product.product_id}/images`
                );
                setImages(res.data);
            } catch (err) {
                console.error("Error fetching product images:", err);
                if (product.variants) {
                    const variantImages = product.variants
                        .map(variant => variant.image)
                        .filter(Boolean)
                        .map((image, index) => ({
                            image_id: `variant-${index}`,
                            image_url: image,
                            created_at: new Date().toISOString(),
                            isVariantImage: true
                        }));
                    setImages(variantImages);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [product]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages(files);
        
        const previews = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setImagePreviews(previews);
    };

    const handleImageUpload = async () => {
        if (newImages.length === 0 || !user || user.role !== "admin") {
            return;
        }

        const formData = new FormData();
        newImages.forEach((image) => {
            formData.append("images", image);
        });

        try {
            setBusy(true);
            const res = await axios.post(
                `${API_BASE}/api/gallery/${product.product_id}/images`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            
            setImages(res.data.images);
            setNewImages([]);
            setImagePreviews([]);
            alert("Images uploaded successfully!");
        } catch (err) {
            console.error("Error uploading images:", err);
            alert(err.response?.data?.error || "Failed to upload images");
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!user || user.role !== "admin") return;
        
        if (!window.confirm("Are you sure you want to delete this image?")) return;

        try {
            await axios.delete(
                `${API_BASE}/api/gallery/images/${imageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            setImages(images.filter(img => img.image_id !== imageId));
            alert("Image deleted successfully!");
        } catch (err) {
            console.error("Error deleting image:", err);
            alert("Failed to delete image");
        }
    };

    const removePreview = (index) => {
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        const newFiles = newImages.filter((_, i) => i !== index);
        setImagePreviews(newPreviews);
        setNewImages(newFiles);
    };

    useEffect(() => {
        return () => {
            imagePreviews.forEach(preview => {
                URL.revokeObjectURL(preview.preview);
            });
        };
    }, [imagePreviews]);

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Image Gallery</h3>
                <p className="text-gray-500 dark:text-gray-400">Loading images...</p>
            </div>
        );
    }

    const allImages = images.length > 0 ? images : 
        (product.variants ? product.variants
            .map(variant => variant.image)
            .filter(Boolean)
            .map((image, index) => ({
                image_id: `variant-${index}`,
                image_url: image,
                created_at: new Date().toISOString(),
                isVariantImage: true
            })) : []);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Image Gallery</h3>
            
            {allImages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No images available for this product.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allImages.map((image) => (
                        <div key={image.image_id} className="relative group">
                            <img
                                src={image.image_url}
                                alt={`${product.title} - Gallery image`}
                                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            />
                            
                            {user?.role === "admin" && !image.isVariantImage && (
                                <button
                                    onClick={() => handleDeleteImage(image.image_id)}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete image"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            
                            {image.isVariantImage && (
                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                    Variant
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {user?.role === "admin" && (
                <div className="mt-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                        Manage Gallery Images
                    </h4>
                    
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="gallery-images" className="text-black dark:text-white">
                                Select Images to Upload
                            </Label>
                            <Input 
                                id="gallery-images"
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={handleImageChange}
                                className="bg-white dark:bg-gray-800 mt-1"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Select multiple images to add to the gallery
                            </p>
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-black dark:text-white font-medium">
                                    Preview ({imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected):
                                </Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview.preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border-2 border-blue-300 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePreview(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                                title="Remove this image"
                                            >
                                                ×
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                                {preview.file.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button 
                                onClick={handleImageUpload} 
                                disabled={busy || newImages.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {busy ? "Uploading..." : `Upload ${newImages.length} Image${newImages.length !== 1 ? 's' : ''}`}
                            </Button>
                            {newImages.length > 0 && (
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    onClick={() => {
                                        setNewImages([]);
                                        setImagePreviews([]);
                                    }}
                                    className="text-gray-600 dark:text-gray-400"
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>
                        
                        {newImages.length > 0 && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {newImages.length} image{newImages.length !== 1 ? 's' : ''} selected for upload. Click "Upload" to add them to the gallery.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const EditProductModal = ({ product, onUpdated, setIsEditing, user, token }) => {
    const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.variant_id || '');
    const [form, setForm] = useState({
        name: product?.title || "",
        description: product?.description || "",
        categoryName: "",
        image: null,
    });
    const [categories, setCategories] = useState([]);
    const [busy, setBusy] = useState(false);
    const [stockUpdateForm, setStockUpdateForm] = useState({
        newStockQuantity: ""
    });
    const [updatingStock, setUpdatingStock] = useState(false);
    const [bundleComponents, setBundleComponents] = useState(product.bundle_products || []);
    const [bundleTotalPrice, setBundleTotalPrice] = useState(0);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/api/products/categories`);
                setCategories(data);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    // Calculate bundle total price
    useEffect(() => {
        if (product.is_bundle && bundleComponents.length > 0) {
            const total = bundleComponents.reduce((sum, component) => {
                const price = Number(component.variants?.[0]?.price || 0);
                const quantity = component.quantity || 1;
                return sum + (price * quantity);
            }, 0);
            setBundleTotalPrice(total);
        }
    }, [bundleComponents, product.is_bundle]);

    const selectedVariant = product.variants?.find(v => v.variant_id.toString() === selectedVariantId.toString());

    const [variantForm, setVariantForm] = useState({
        variant_id: selectedVariant?.variant_id,
        buying_price: selectedVariant?.buying_price || "",
        profit_margin: selectedVariant?.profit_margin || "",
        discount: selectedVariant?.discount || "",
        variant_image: null,
        color: selectedVariant?.color || "",
    });

    useEffect(() => {
        if (selectedVariant) {
            const finalPrice = calculateSellingPrice(
                selectedVariant.buying_price,
                selectedVariant.profit_margin,
                selectedVariant.discount
            );
            setVariantForm({
                variant_id: selectedVariant.variant_id,
                buying_price: selectedVariant.buying_price || "",
                profit_margin: selectedVariant.profit_margin || "",
                discount: selectedVariant.discount || "",
                variant_image: null,
                color: selectedVariant.color || "",
                final_price: finalPrice
            });
            setStockUpdateForm({
                newStockQuantity: selectedVariant.stock || ""
            });
        }
    }, [selectedVariant]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (["buying_price", "profit_margin", "discount", "color", "final_price"].includes(name)) {
            setVariantForm(prev => {
                const newForm = {...prev, [name]: value};
                if (name === "final_price") {
                    const bp = Number(newForm.buying_price) || 0;
                    const disc = Number(newForm.discount) || 0;
                    newForm.profit_margin = Number(value) - bp + disc;
                } else if (["buying_price", "profit_margin", "discount"].includes(name)) {
                    newForm.final_price = calculateSellingPrice(
                        newForm.buying_price,
                        newForm.profit_margin,
                        newForm.discount
                    );
                }
                return newForm;
            });
        } else if (name === "image" || name === "variant_image") {
            const targetStateSetter = name === "image" ? setForm : setVariantForm;
            targetStateSetter(prev => ({
                ...prev,
                [name]: files[0],
            }));
        } else {
            setForm(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleStockUpdateChange = (e) => {
        const { name, value } = e.target;
        setStockUpdateForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateStock = async () => {
        if (!selectedVariant) return;

        const newStock = Number(stockUpdateForm.newStockQuantity);

        if (isNaN(newStock)) {
            alert("Stock quantity must be a valid number.");
            return;
        }

        try {
            setUpdatingStock(true);
            const res = await axios.post(
                `${API_BASE}/api/products/variants/${selectedVariant.variant_id}/update-stock`,
                {
                    newStockQuantity: newStock
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            onUpdated?.(res.data.product);
            alert(res.data.message || "Stock successfully updated.");

            if (selectedVariant) {
                selectedVariant.stock = newStock;
            }
        } catch (err) {
            console.error("Update Stock Error:", err.response?.data || err);
            alert(err.response?.data?.error || "Failed to update stock");
        } finally {
            setUpdatingStock(false);
        }
    };

    const handleBundleComponentUpdate = async (componentIndex, field, value, file = null) => {
        const updatedComponents = [...bundleComponents];
        const component = updatedComponents[componentIndex];

        if (field === 'image' && file) {
            // Upload image for bundle component
            const formData = new FormData();
            formData.append('image', file);

            try {
                const res = await axios.put(
                    `${API_BASE}/api/products/variants/${component.variants[0].variant_id}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
                // Update the component with new image
                component.variants[0].image = res.data.product.variants.find(v => v.variant_id === component.variants[0].variant_id).image;
                setBundleComponents([...updatedComponents]);
                // Update the bundle's total price after component change
                updateBundlePrice();
                onUpdated?.(res.data.product);
            } catch (err) {
                console.error("Error updating bundle component image:", err);
                alert("Failed to update component image");
            }
        } else if (field === 'price') {
            // Update price for bundle component
            try {
                const res = await axios.put(
                    `${API_BASE}/api/products/variants/${component.variants[0].variant_id}`,
                    { price: Number(value) },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                // Update the component with new price
                component.variants[0].price = Number(value);
                setBundleComponents([...updatedComponents]);
                setBundleComponents(updatedComponents);
                // Update the bundle's total price after component change
                updateBundlePrice();
                onUpdated?.(res.data.product);
            } catch (err) {
                console.error("Error updating bundle component price:", err);
                alert("Failed to update component price");
            }
        }
    };

    const updateBundlePrice = async () => {
        const total = bundleComponents.reduce((sum, component) => {
            const price = Number(component.variants?.[0]?.price || 0);
            const quantity = component.quantity || 1;
            return sum + (price * quantity);
        }, 0);

        if (total > 0 && product.variants?.[0]) {
            try {
                const res = await axios.put(
                    `${API_BASE}/api/products/variants/${product.variants[0].variant_id}`,
                    { price: total },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                onUpdated?.(res.data.product);
            } catch (err) {
                console.error("Error updating bundle price:", err);
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setBusy(true);
            const productFd = new FormData();
            let hasProductUpdates = false;

            if (form.name && form.name !== product.title) {
                productFd.append("title", form.name);
                hasProductUpdates = true;
            }
            if (form.description && form.description !== product.description) {
                productFd.append("description", form.description);
                hasProductUpdates = true;
            }
            if (form.categoryName) {
                productFd.append("categoryName", form.categoryName);
                hasProductUpdates = true;
            }
            if (form.image) {
                productFd.append("image", form.image);
                hasProductUpdates = true;
            }

            const variantFd = new FormData();
            let hasVariantUpdates = false;

            if (user?.role === "admin" && selectedVariant) {
                if (Number(variantForm.buying_price) !== Number(selectedVariant.buying_price)) {
                    variantFd.append("buying_price", variantForm.buying_price);
                    hasVariantUpdates = true;
                }
                if (Number(variantForm.profit_margin) !== Number(selectedVariant.profit_margin)) {
                    variantFd.append("profit_margin", variantForm.profit_margin);
                    hasVariantUpdates = true;
                }
                if (Number(variantForm.discount) !== Number(selectedVariant.discount) || hasVariantUpdates) {
                    variantFd.append("discount", variantForm.discount);
                    variantFd.append("price", variantForm.final_price);
                    hasVariantUpdates = true;
                }
                if (variantForm.variant_image) {
                    variantFd.append("image", variantForm.variant_image);
                    hasVariantUpdates = true;
                }
            }

            let updatedProduct = product;

            if (hasProductUpdates) {
                const res = await axios.put(
                    `${API_BASE}/api/products/${product.product_id}`,
                    productFd,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
                updatedProduct = res.data.product;
            }

            if (hasVariantUpdates && selectedVariant) {
                const res = await axios.put(
                    `${API_BASE}/api/products/variants/${selectedVariant.variant_id}`,
                    variantFd,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
                updatedProduct = res.data.product || updatedProduct;
            }

            if (variantForm.color && variantForm.color !== selectedVariant.color) {
                const res = await axios.put(
                    `${API_BASE}/api/products/variants/${selectedVariant.variant_id}/color`,
                    { color: variantForm.color },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                updatedProduct = res.data.product || updatedProduct;
            }

            // Update bundle price if it's a bundle
            if (product.is_bundle && bundleTotalPrice > 0) {
                const bundleVariant = updatedProduct.variants?.[0];
                if (bundleVariant) {
                    const res = await axios.put(
                        `${API_BASE}/api/products/variants/${bundleVariant.variant_id}`,
                        { price: bundleTotalPrice },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    updatedProduct = res.data.product || updatedProduct;
                }
            }

            onUpdated?.(updatedProduct);
            setIsEditing(false);
        } catch (err) {
            console.error("Update error:", err.response?.data || err);
            alert(err.response?.data?.error || "Failed to update product/variant");
        } finally {
            setBusy(false);
        }
    };

    const currentStock = Number(selectedVariant?.stock || 0);
    const isBackordered = currentStock < 0;

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content bg-white dark:bg-black dark:text-white border dark:border-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Edit Product</h2>
                <form onSubmit={handleUpdate} className="space-y-6">
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Product Information</h3>
                            <div className="space-y-2">
                                <Label className="text-black dark:text-white">Product Name</Label>
                                <Input 
                                    name="name" 
                                    value={form.name} 
                                    onChange={handleChange}
                                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-black dark:text-white">Description</Label>
                                <Input 
                                    name="description" 
                                    value={form.description} 
                                    onChange={handleChange}
                                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-black dark:text-white">Category</Label>
                                <Select onValueChange={(value) => setForm(prev => ({...prev, categoryName: value}))}>
                                    <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(category => (
                                            <SelectItem key={category.category_id} value={category.category_name}>
                                                {category.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-black dark:text-white">Replace Product Image (optional)</Label>
                                <Input 
                                    name="image" 
                                    type="file" 
                                    onChange={handleChange}
                                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white file:text-black dark:file:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Select Variant to Edit</h3>
                            <div className="space-y-2">
                                <Label className="text-black dark:text-white font-semibold">
                                    Available Variants:
                                </Label>
                                <div className="grid gap-2 max-h-60 overflow-y-auto p-1">
                                    {product.variants.map((variant) => {
                                        const variantStock = Number(variant.stock || 0);
                                        const isVariantBackordered = variantStock < 0;
                                        const isSelected = selectedVariantId === variant.variant_id;
                                        
                                        return (
                                            <div
                                                key={variant.variant_id}
                                                onClick={() => setSelectedVariantId(variant.variant_id)}
                                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                    isSelected 
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20' 
                                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full border-2 ${
                                                            isSelected 
                                                                ? 'bg-blue-500 border-blue-500' 
                                                                : 'bg-transparent border-gray-400'
                                                        }`} />
                                                        <div>
                                                            <div className="font-medium text-black dark:text-white">
                                                                {getVariantDisplay(product, variant)}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                Stock: <span className={`font-semibold ${
                                                                    isVariantBackordered ? 'text-red-500' : 'text-green-500'
                                                                }`}>
                                                                    {isVariantBackordered 
                                                                        ? `BACKORDERED: ${variantStock.toFixed(0)}` 
                                                                        : variantStock.toFixed(0)
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {variant.image && (
                                                        <img 
                                                            src={variant.image} 
                                                            alt={variant.color}
                                                            className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 object-cover"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {user?.role === "admin" && selectedVariant && (
                        <>
                            <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        Editing Variant: {getVariantDisplay(product, selectedVariant)}
                                    </h3>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Current Stock: <span className={`font-semibold ${
                                            currentStock < 0 ? 'text-red-500' : 'text-green-500'
                                        }`}>
                                            {currentStock}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <h4 className="text-lg font-bold text-yellow-700 dark:text-yellow-300 mb-3">
                                        Update Stock Level
                                    </h4>
                                    
                                    <div className="flex items-end gap-4">
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor="newStockQuantity" className="text-black dark:text-white font-semibold">
                                                New Stock Quantity
                                            </Label>
                                            <Input
                                                id="newStockQuantity"
                                                name="newStockQuantity"
                                                type="number"
                                                value={stockUpdateForm.newStockQuantity}
                                                onChange={handleStockUpdateChange}
                                                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                                                placeholder="Enter new stock quantity"
                                            />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Set exact stock level (positive, negative, or zero)
                                            </p>
                                        </div>

                                        <Button
                                            onClick={handleUpdateStock}
                                            disabled={updatingStock || stockUpdateForm.newStockQuantity === ""}
                                            className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 text-white mb-1"
                                        >
                                            {updatingStock ? "Updating..." : "Update Stock"}
                                        </Button>
                                    </div>

                                    {stockUpdateForm.newStockQuantity !== "" && !isNaN(Number(stockUpdateForm.newStockQuantity)) && (
                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                <strong>Change Summary:</strong> Stock will change from{" "}
                                                <span className={`font-bold ${isBackordered ? 'text-red-500' : 'text-green-500'}`}>
                                                    {currentStock.toFixed(0)}
                                                </span>{" "}
                                                to{" "}
                                                <span className={`font-bold ${
                                                    Number(stockUpdateForm.newStockQuantity) < 0 ? 'text-red-500' : 
                                                    Number(stockUpdateForm.newStockQuantity) === 0 ? 'text-yellow-500' : 'text-green-500'
                                                }`}>
                                                    {Number(stockUpdateForm.newStockQuantity).toFixed(0)}
                                                </span>
                                                {" "}({
                                                    Number(stockUpdateForm.newStockQuantity) - currentStock > 0 ? "+" : ""
                                                }{Number(stockUpdateForm.newStockQuantity) - currentStock} units)
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="buying_price" className="text-black dark:text-white">Buying Price</Label>
                                            <Input
                                                id="buying_price"
                                                name="buying_price"
                                                type="number"
                                                value={variantForm.buying_price}
                                                onChange={handleChange}
                                                required
                                                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="profit_margin" className="text-black dark:text-white">Profit Margin (Cash)</Label>
                                            <Input
                                                id="profit_margin"
                                                name="profit_margin"
                                                type="number"
                                                value={variantForm.profit_margin}
                                                onChange={handleChange}
                                                required
                                                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="discount" className="text-black dark:text-white">Discount (Cash)</Label>
                                            <Input
                                                id="discount"
                                                name="discount"
                                                type="number"
                                                value={variantForm.discount}
                                                onChange={handleChange}
                                                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-black dark:text-white">Final Selling Price</Label>
                                            <Input
                                                name="final_price"
                                                type="number"
                                                value={variantForm.final_price}
                                                onChange={handleChange}
                                                className="font-bold bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                                            />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Editing this will adjust the Profit Margin.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <Label className="text-black dark:text-white">Replace Variant Image (optional)</Label>
                                    <Input 
                                        name="variant_image" 
                                        type="file" 
                                        onChange={handleChange}
                                        className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white file:text-black dark:file:text-white"
                                    />
                                </div>

                                <div className="space-y-2 mt-4">
                                    <Label className="text-black dark:text-white">Variant Color</Label>
                                    <Input 
                                        name="color" 
                                        type="color" 
                                        value={variantForm.color}
                                        onChange={handleChange}
                                        className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    
                    <AdminImageGallery product={product} />

                    {/* Bundle Components Editing */}
                    {product.is_bundle && bundleComponents.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">
                                Bundle Components
                            </h3>
                            <div className="space-y-4">
                                {bundleComponents.map((component, index) => {
                                    const variant = component.variants?.[0];
                                    if (!variant) return null;

                                    return (
                                        <div key={component.product_id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-black dark:text-white">
                                                    {component.title} (x{component.quantity || 1})
                                                </h4>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    Kshs {Number(variant.price || 0).toFixed(2)} each
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-black dark:text-white text-sm">Update Image</Label>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                handleBundleComponentUpdate(index, 'image', null, file);
                                                            }
                                                        }}
                                                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-black dark:text-white file:text-black dark:file:text-white"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-black dark:text-white text-sm">Update Price</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={Number(variant.price || 0)}
                                                        onChange={(e) => {
                                                            const newPrice = e.target.value;
                                                            handleBundleComponentUpdate(index, 'price', newPrice);
                                                        }}
                                                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                                                        placeholder="Enter price"
                                                    />
                                                </div>
                                            </div>

                                            {variant.image && (
                                                <div className="mt-3">
                                                    <img
                                                        src={variant.image}
                                                        alt={component.title}
                                                        className="w-16 h-16 object-cover rounded border border-gray-200 dark:border-gray-700"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-green-700 dark:text-green-300">Bundle Total Price:</span>
                                    <span className="text-xl font-bold text-green-700 dark:text-green-300">
                                        Kshs {bundleTotalPrice.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                    This is the sum of all component prices. The bundle's selling price will be updated accordingly.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <Button type="submit" disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600">
                            {busy ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="text-gray-600 dark:text-gray-400 border-gray-600 dark:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900">
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

const ReceiveStockModal = ({ product, onUpdated, setIsReceivingStock, token }) => {
    const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.variant_id || '');
    const [receiveForm, setReceiveForm] = useState({ quantityReceived: "", buyingPrice: "" });
    const [busy, setBusy] = useState(false);

    const selectedVariant = product.variants?.find(v => v.variant_id.toString() === selectedVariantId.toString());
    
    const stockValue = Number(selectedVariant?.stock || 0);
    const isBackordered = stockValue < 0;

    const handleReceiveFormChange = (e) => {
        const { name, value } = e.target;
        setReceiveForm(prev => ({ ...prev, [name]: value }));
    };

    const handleReceiveStock = async (e) => {
        e.preventDefault();
        const quantity = Number(receiveForm.quantityReceived);
        const buyingPrice = Number(receiveForm.buyingPrice);
    
        if (!selectedVariantId) {
            alert("Please select a product variant.");
            return;
        }
        if (quantity <= 0 || isNaN(quantity)) {
            alert("Quantity received must be a positive number.");
            return;
        }
        if (buyingPrice <= 0 || isNaN(buyingPrice)) {
            alert("Buying price must be a positive number.");
            return;
        }
    
        try {
            setBusy(true);
            const res = await axios.post(
                `${API_BASE}/api/products/variants/${selectedVariantId}/receive-stock`,
                { quantityReceived: quantity, buyingPrice: buyingPrice },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            onUpdated?.(res.data.product);
            setReceiveForm({ quantityReceived: "", buyingPrice: "" });
            setIsReceivingStock(false);
            alert(res.data.message || "Stock successfully received.");
        } catch (err) {
            console.error("Receive Stock Error:", err.response?.data || err);
            alert(err.response?.data?.error || "Failed to receive stock");
        } finally {
            setBusy(false);
        }
    };

    if (!product.variants || product.variants.length === 0) {
        return ReactDOM.createPortal(
            <div className="modal-overlay">
                <div className="modal-content bg-white dark:bg-black dark:text-white border dark:border-gray-800">
                    <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
                    <p>This product has no variants and cannot receive stock.</p>
                    <Button type="button" onClick={() => setIsReceivingStock(false)} className="mt-4">Close</Button>
                </div>
            </div>,
            document.body
        );
    }

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content bg-white dark:bg-black dark:text-white border dark:border-gray-800">
                <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Receive Stock</h2>
                <form
                    onSubmit={handleReceiveStock}
                    className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                >
                    <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        Select Variant to Receive Stock
                    </h4>
                    
                    <div className="space-y-2">
                        <Label className="text-black dark:text-white font-semibold">
                            Available Variants:
                        </Label>
                        <div className="grid gap-2 max-h-60 overflow-y-auto p-1">
                            {product.variants.map((variant) => {
                                const variantStock = Number(variant.stock || 0);
                                const isVariantBackordered = variantStock < 0;
                                const isSelected = selectedVariantId === variant.variant_id;
                                
                                return (
                                    <div
                                        key={variant.variant_id}
                                        onClick={() => setSelectedVariantId(variant.variant_id)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                            isSelected 
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20' 
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full border-2 ${
                                                    isSelected 
                                                        ? 'bg-blue-500 border-blue-500' 
                                                        : 'bg-transparent border-gray-400'
                                                }`} />
                                                <div>
                                                    <div className="font-medium text-black dark:text-white">
                                                        {getVariantDisplay(product, variant)}
                                                    </div>
                                                    <div className={`text-sm font-semibold ${
                                                        isVariantBackordered 
                                                            ? 'text-red-500' 
                                                            : 'text-green-500'
                                                    }`}>
                                                        {isVariantBackordered 
                                                            ? `BACKORDERED: ${variantStock.toFixed(0)}` 
                                                            : `Stock: ${variantStock.toFixed(0)}`
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            {variant.image && (
                                                <img 
                                                    src={variant.image} 
                                                    alt={variant.color}
                                                    className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {selectedVariant && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <h5 className="font-bold text-blue-700 dark:text-blue-300 mb-2">
                                Selected Variant:
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Variant Name</p>
                                    <p className="font-semibold text-black dark:text-white">
                                        {getVariantDisplay(product, selectedVariant)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Stock</p>
                                    <p className={`font-semibold ${isBackordered ? 'text-red-500' : 'text-green-500'}`}>
                                        {isBackordered 
                                            ? `BACKORDERED: ${stockValue.toFixed(0)}` 
                                            : `${stockValue.toFixed(0)} units`
                                        }
                                    </p>
                                </div>
                            </div>
                            {isBackordered && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                    <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                                        ⚠️ You have {-stockValue.toFixed(0)} pending backorders to fulfill.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="quantityReceived" className="text-black dark:text-white font-semibold">
                            Quantity to Receive
                        </Label>
                        <Input
                            id="quantityReceived"
                            name="quantityReceived"
                            type="number"
                            value={receiveForm.quantityReceived}
                            onChange={handleReceiveFormChange}
                            required
                            min="1"
                            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white text-lg font-medium"
                            disabled={!selectedVariantId}
                            placeholder="Enter quantity to add to stock"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enter the number of units you're adding to inventory
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="buyingPrice" className="text-black dark:text-white font-semibold">
                            Buying Price per Unit
                        </Label>
                        <Input
                            id="buyingPrice"
                            name="buyingPrice"
                            type="number"
                            value={receiveForm.buyingPrice}
                            onChange={handleReceiveFormChange}
                            required
                            min="0.01"
                            step="0.01"
                            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white text-lg font-medium"
                            disabled={!selectedVariantId}
                            placeholder="Enter buying price per unit"
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Cost per unit for this batch
                        </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            type="submit"
                            disabled={busy || !selectedVariantId}
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white flex-1"
                        >
                            {busy ? "Receiving Stock..." : "Receive Stock"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsReceivingStock(false);
                                setReceiveForm({ quantityReceived: "", buyingPrice: "" });
                            }}
                            className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

const ProductCard = ({ product, onDeleted, onUpdated }) => {
    const { user, token } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [isReceivingStock, setIsReceivingStock] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [busy, setBusy] = useState(false);
    const [isVisible, setIsVisible] = useState(product.is_visible);

    const handleToggleVisibility = async () => {
        try {
            const newVisibility = !isVisible;
            setIsVisible(newVisibility);
            await axios.put(
                `${API_BASE}/api/products/${product.product_id}/toggle-visibility`,
                { is_visible: newVisibility },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            onUpdated?.({ ...product, is_visible: newVisibility });
        } catch (err) {
            console.error("Error toggling product visibility:", err);
            setIsVisible(!isVisible);
            alert("Failed to update product visibility");
        }
    };

    const displayVariant = product.variants?.[0];

    if (!displayVariant) {
        return (
            <tr className="bg-red-50 dark:bg-red-900/20">
                <td colSpan="4" className="p-4 text-sm text-red-600 dark:text-red-400">
                    Product has no variants and cannot be managed.
                </td>
            </tr>
        );
    }

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${product.title}"?`)) return;
        
        try {
            setBusy(true);
            await axios.delete(`${API_BASE}/api/products/${product.product_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onDeleted?.(product.product_id);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete product");
        } finally {
            setBusy(false);
        }
    };

    const originalPrice = calculateSellingPrice(
        displayVariant.buying_price, 
        displayVariant.profit_margin, 
        0
    );
    
    const discountedPrice = Number(displayVariant.price) || 0;
    const hasDiscount = Number(displayVariant.discount) > 0;
    
    const stockValue = Number(displayVariant.stock || 0);
    const stockColor = stockValue < 0 ? "bg-red-600" : stockValue <= 5 ? "bg-yellow-600" : "bg-green-600";
    const isBackordered = stockValue < 0;

    return (
        <>
            <tr className="lg:hidden product-card-mobile bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900">
                <td colSpan="4" className="p-0 border-none">
                    <div className="p-2"> 
                        <div className="flex gap-2">
                            <div className="flex-shrink-0">
                                <img 
                                    className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-800" 
                                    src={displayVariant.image || product.image}
                                    alt={product.title} 
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-black dark:text-white truncate">
                                            {product.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            #{product.product_id}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                                        className="ml-2 p-2 rounded-lg bg-white hover:bg-gray-100 dark:bg-black dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                                    >
                                        <MoreVertical className="h-4 w-4 text-black dark:text-white" />
                                    </button>
                                </div>

                                <div className="mt-2">
                                    {hasDiscount ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                                Kshs {Number(originalPrice).toFixed(2)}
                                            </span>
                                            <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                                Kshs {Number(discountedPrice).toFixed(2)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-lg font-bold text-black dark:text-white">
                                            Kshs {Number(discountedPrice).toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-2">
                                    <span
                                        className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${stockColor} text-white`}
                                    >
                                        {isBackordered
                                            ? `BACKORDERED: ${stockValue.toFixed(0)}`
                                            : `${stockValue.toFixed(0)} in stock`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {showMobileMenu && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                                <Button 
                                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white justify-start"
                                    onClick={() => {
                                        setIsEditing(true);
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    <SquarePen className="w-4 h-4 mr-2" />
                                    Update Details
                                </Button>
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white justify-start"
                                    onClick={() => {
                                        setIsReceivingStock(true);
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    <CookingPot className="w-4 h-4 mr-2" />
                                    Receive Stock
                                </Button>
                                <Button 
                                    className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white justify-start"
                                    onClick={handleDelete} 
                                    disabled={busy} 
                                >
                                    <Delete className="w-4 h-4 mr-2" />
                                    {busy ? "Deleting..." : "Delete"}
                                </Button>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`visibility-toggle-mobile-${product.product_id}`}
                                        checked={isVisible}
                                        onCheckedChange={handleToggleVisibility}
                                    />
                                    <Label htmlFor={`visibility-toggle-mobile-${product.product_id}`}>
                                        {isVisible ? "Visible" : "Hidden"}
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>

            <tr className="hidden lg:table-row product-card bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                            <img className="h-8 w-8 rounded-full object-cover" src={displayVariant.image || product.image} alt={product.title} />
                        </div>
                        <div className="ml-2">
                            <div className="text-xs font-medium text-black dark:text-white">{product.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">#{product.product_id}</div>
                        </div>
                    </div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-black dark:text-white text-xs">
                    {hasDiscount ? (
                        <div className="flex flex-col">
                            <span className="text-muted-foreground line-through text-gray-500 dark:text-gray-400">
                                Kshs {Number(originalPrice).toFixed(0)}
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-semibold">
                                Kshs {Number(discountedPrice).toFixed(0)}
                            </span>
                        </div>
                    ) : (
                        <span>Kshs {Number(discountedPrice).toFixed(0)}</span>
                    )}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                    <span
                        className={`px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${stockColor} text-white`}
                    >
                        {isBackordered
                            ? `BO: ${stockValue.toFixed(0)}`
                            : `${stockValue.toFixed(0)}`}
                    </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-right text-xs font-medium">
                    <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                            <Button 
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-2 py-1 h-7"
                                onClick={() => setIsEditing(true)}
                            >
                                <SquarePen className="w-3 h-3" />
                            </Button>
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-2 py-1 h-7"
                                onClick={() => setIsReceivingStock(true)}
                            >
                                <CookingPot className="w-3 h-3" />
                            </Button>
                            <Button 
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-2 py-1 h-7"
                                onClick={handleDelete} 
                                disabled={busy}
                            >
                                <Delete className="w-3 h-3" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                            <Switch
                                id={`visibility-toggle-${product.product_id}`}
                                checked={isVisible}
                                onCheckedChange={handleToggleVisibility}
                                className="scale-75"
                            />
                            <Label htmlFor={`visibility-toggle-${product.product_id}`} className="text-xs cursor-pointer">
                                {isVisible ? "Visible" : "Hidden"}
                            </Label>
                        </div>
                    </div>
                </td>
            </tr>

            {isEditing && <EditProductModal product={product} onUpdated={onUpdated} setIsEditing={setIsEditing} user={user} token={token} />}
            {isReceivingStock && <ReceiveStockModal product={product} onUpdated={onUpdated} setIsReceivingStock={setIsReceivingStock} token={token} />}
        </>
    );
};

export default ProductCard;
import React, { useState, useMemo } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import API_BASE from "../config";

const PREDEFINED_COLORS = [
  "Red", "Blue", "Green", "Black", "White", "Gray", "Silver", "Gold", "Yellow", "Purple", "Orange", "Pink"
];

const AddVariantModal = ({ product, onVariantAdded, setIsAddingVariant, token }) => {
  const [variant, setVariant] = useState({
    color: "",
    buying_price: "",
    profit_margin: "",
    discount: "",
    stock: "",
    image: null,
    imagePreview: null,
  });
  const [message, setMessage] = useState("");

  const handleVariantChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setVariant(prev => ({
        ...prev,
        image: file,
        imagePreview: file ? URL.createObjectURL(file) : null,
      }));
    } else {
      setVariant(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleColorChange = (color) => {
    setVariant(prev => ({ ...prev, color }));
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

    if (!variant.color || !variant.stock) {
      setMessage("Color and Stock are required");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("productId", product.product_id);
      const variantForUpload = { ...variant, price: calculateFinalPrice(variant) };
      delete variantForUpload.imagePreview;
      fd.append("variant", JSON.stringify(variantForUpload));

      if (variant.image) {
        fd.append("image", variant.image);
      }

      const res = await axios.post(`${API_BASE}/api/products/variants`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      onVariantAdded(res.data.product);
      setIsAddingVariant(false);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "❌ Failed to add variant");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content bg-white dark:bg-black dark:text-white border dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Add Variant</h2>
        {message && (
          <p className="mb-4 text-sm text-red-600 font-semibold">{message}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select onValueChange={handleColorChange} value={variant.color}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_COLORS.map(color => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" name="stock" type="number" value={variant.stock} onChange={handleVariantChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buying_price">Buying Price</Label>
              <Input id="buying_price" name="buying_price" type="number" value={variant.buying_price} onChange={handleVariantChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profit_margin">Profit Margin</Label>
              <Input id="profit_margin" name="profit_margin" type="number" value={variant.profit_margin} onChange={handleVariantChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <Input id="discount" name="discount" type="number" value={variant.discount} onChange={handleVariantChange} />
            </div>
            <div className="space-y-2">
              <Label>Final Selling Price</Label>
              <Input type="number" value={calculateFinalPrice(variant)} readOnly className="font-bold" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Variant Image</Label>
              <Input id="image" name="image" type="file" accept="image/*" onChange={handleVariantChange} />
              {variant.imagePreview && (
                <div className="mt-2">
                  <img src={variant.imagePreview} alt="Preview" className="h-32 object-contain rounded border" />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit">Add Variant</Button>
            <Button type="button" variant="outline" onClick={() => setIsAddingVariant(false)}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVariantModal;
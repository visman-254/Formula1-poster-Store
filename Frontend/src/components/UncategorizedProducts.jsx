import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../config";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "./Uncategorizedproducts.css";

const UncategorizedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUncategorized = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/products/category/admin/name/Uncategorized`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProducts(data);
      } catch (err) {
        console.error("Failed to load uncategorized products:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    fetchUncategorized();
    fetchCategories();
  }, [token]);

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to permanently delete this product?")) {
      try {
        await axios.delete(`${API_BASE}/api/products/${productId}/permanent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(products.filter((p) => p.product_id !== productId));
      } catch (err) {
        console.error("Failed to delete product:", err);
      }
    }
  };

  const openRestoreModal = (product) => {
    setSelectedProduct(product);
    setShowRestoreModal(true);
  };

  const handleRestore = async () => {
    if (!selectedCategory) {
      alert("Please select a category.");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/api/products/${selectedProduct.product_id}/restore`,
        { newCategoryId: selectedCategory },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProducts(products.filter((p) => p.product_id !== selectedProduct.product_id));
      setShowRestoreModal(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error("Failed to restore product:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Uncategorized Products</h1>

      {loading ? (
        <p>Loading...</p>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card
              key={product.product_id}
              className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
            >
              <CardHeader>
                <CardTitle className="truncate">{product.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {product.description || "No description available"}
                  {product.previous_category_name && (
                    <span className="ml-2 text-xs text-gray-500">
                      (from {product.previous_category_name})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <img
                  src={product.image}
                  alt={product.title}
                  className="className=rounded-md"
                />
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="Delete-button ">
                    Uncategorised
                  </Badge>
                  <span className="text-sm font-semibold text-gray-700">
                    Kshs {product.price}
                  </span>
                </div>
                <div className="flex justify-around mt-4">
                  <button onClick={() => openRestoreModal(product)} className="text-sm text-blue-500 hover:underline">Restore</button>
                  <button onClick={() => handleDelete(product.product_id)} className="text-sm text-red-500 hover:underline">Delete</button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          No uncategorized products found.
        </p>
      )}

      {showRestoreModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Restore {selectedProduct.title}</h2>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
            <div className="flex justify-end">
              <button onClick={() => setShowRestoreModal(false)} className="mr-2 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleRestore} className="px-4 py-2 bg-blue-500 text-white rounded">Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UncategorizedProducts;
import React, { useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import API_BASE from "../config";
import "./ProductCard.css"; // For modal styling

const PreorderModal = ({ product, onClose }) => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    email: user ? user.email : "",
    phone_number: "",
    quantity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const preorderData = {
        ...formData,
        user_id: user ? user.id : null,
        variant_id: product.selectedVariant.variant_id,
      };

      await axios.post(`${API_BASE}/api/preorders`, preorderData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
      console.error("Preorder submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return ReactDOM.createPortal(
      <div className="modal-overlay">
        <div className="modal-content bg-white dark:bg-black dark:text-white border dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">Preorder Submitted!</h2>
          <p>Thank you for your preorder. We will notify you when the product is available.</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content bg-white dark:bg-black dark:text-white border dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Preorder: {product.title}</h2>
        <div className="flex gap-4 mb-6">
            <img src={product.selectedVariant.image} alt={product.title} className="w-24 h-24 rounded-lg object-cover" />
            <div>
                <p className="font-semibold">{product.title} ({product.selectedVariant.color})</p>
                <p className="text-lg font-bold">Kshs {Number(product.selectedVariant.price).toFixed(2)}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-black dark:text-white">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="phone_number" className="text-black dark:text-white">Phone Number (Optional)</Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
            />
          </div>
          <div>
            <Label htmlFor="quantity" className="text-black dark:text-white">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
              className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white"
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? "Submitting..." : "Submit Preorder"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="text-gray-600 dark:text-gray-400">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default PreorderModal;

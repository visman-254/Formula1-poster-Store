import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import API_BASE from "../config";
import { UserContext } from "../context/UserContext";

const ManageIMEIs = () => {
  const { token } = useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [imeiText, setImeiText] = useState("");
  const [imeiLoading, setImeiLoading] = useState(false);
  const [imeiMessage, setImeiMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [existingIMEIs, setExistingIMEIs] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/products/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products. Please login again.");
    }
  };

  const openImeiModal = async (variant) => {
    setSelectedVariant(variant);
    setImeiText("");
    setImeiMessage("");
    setShowModal(true);

    // Fetch existing IMEIs for this variant
    try {
      const res = await axios.get(`${API_BASE}/api/imei/${variant.variant_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingIMEIs(res.data.imeis || []);
    } catch (err) {
      console.error("Error fetching existing IMEIs:", err);
      setExistingIMEIs([]);
    }
  };

  const saveImeis = async () => {
    if (!imeiText.trim()) {
      setImeiMessage("Please enter at least one IMEI number");
      return;
    }

    setImeiLoading(true);
    setImeiMessage("");

    try {
      const response = await axios.post(
        `${API_BASE}/api/imei/${selectedVariant.variant_id}/bulk`,
        { imeiText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setImeiMessage(
        `✓ Successfully added ${response.data.added} IMEI(s)${response.data.duplicates?.length ? `, ${response.data.duplicates.length} duplicates skipped` : ""}`
      );
      setImeiText("");

      // Refresh existing IMEIs
      const res = await axios.get(`${API_BASE}/api/imei/${selectedVariant.variant_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingIMEIs(res.data.imeis || []);
    } catch (err) {
      setImeiMessage(`❌ Error: ${err.response?.data?.error || "Failed to save IMEIs"}`);
    } finally {
      setImeiLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage IMEIs</h2>
      <p className="text-gray-600 mb-4">
        Select a product variant to add IMEI numbers from stock
      </p>

      {/* Product/Variant List */}
      <div className="grid gap-4">
        {products.map((product) =>
          product.variants?.map((variant) => (
            <div
              key={variant.variant_id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{product.title}</h3>
                <p className="text-sm text-gray-500">
                  Variant: {variant.color} - {variant.storage} | Stock: {variant.stock}
                </p>
              </div>
              <Button onClick={() => openImeiModal(variant)}>
                📱 Add IMEI Numbers
              </Button>
            </div>
          ))
        )}
      </div>

      {/* IMEI Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add IMEIs - {selectedVariant?.product_title}
              <br />
              <span className="text-sm text-gray-500">
                {selectedVariant?.color} - {selectedVariant?.storage}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Existing IMEIs */}
          {existingIMEIs.length > 0 && (
            <div className="mb-4 max-h-32 overflow-y-auto border rounded p-2">
              <h4 className="text-sm font-semibold mb-2">
                Already Added ({existingIMEIs.length}):
              </h4>
              <div className="text-xs text-gray-600">
                {existingIMEIs.slice(0, 10).map((imei) => (
                  <div key={imei.imei_id}>
                    {imei.imei_number} -{" "}
                    <span
                      className={
                        imei.status === "available"
                          ? "text-green-600"
                          : imei.status === "used"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }
                    >
                      {imei.status}
                    </span>
                  </div>
                ))}
                {existingIMEIs.length > 10 && (
                  <div className="text-gray-400">
                    ...and {existingIMEIs.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add New IMEIs */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="imeiText">
                Enter IMEI Numbers (one per line or comma-separated)
              </Label>
              <textarea
                id="imeiText"
                value={imeiText}
                onChange={(e) => setImeiText(e.target.value)}
                placeholder="123456789012345&#10;123456789012346&#10;123456789012347"
                className="w-full h-32 p-2 border rounded mt-1"
              />
            </div>

            {imeiMessage && (
              <p
                className={`text-sm ${
                  imeiMessage.includes("❌") ? "text-red-500" : "text-green-500"
                }`}
              >
                {imeiMessage}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button onClick={saveImeis} disabled={imeiLoading}>
                {imeiLoading ? "Saving..." : "Save IMEIs"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageIMEIs;

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  createPromotion,
  getFullPromotions,
  deletePromotion,
  togglePromotionStatus
} from "../api/productPromotion.js";

import { Upload, X, CheckCircle, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const CreatePromotion = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [promotions, setPromotions] = useState([]);

  const fileRef = useRef(null);

  /* ============================
     FETCH PROMOTIONS
  ============================ */
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const data = await getFullPromotions();
      setPromotions(data);
    } catch (err) {
      console.error("Failed to load promotions", err);
    }
  };

  /* ============================
     DROPZONE
  ============================ */
  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setMessage(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"]
    },
    multiple: false
  });

  /* ============================
     SUBMIT PROMOTION
  ============================ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage({ type: "error", text: "Please upload a promotion image." });
      return;
    }

    setLoading(true);

    try {
      const res = await createPromotion({ image: file });

      setMessage({
        type: "success",
        text: `Promotion created successfully (ID: ${res.promotion.id})`
      });

      setFile(null);
      setPreviewUrl("");
      fetchPromotions();

    } catch (err) {
      console.error("Promotion creation error:", err);
      const errMsg = err.response?.data?.error || "Upload failed.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     IMAGE REMOVE
  ============================ */
  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
  };

  /* ============================
     DELETE PROMOTION
  ============================ */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this promotion?")) return;
    try {
      await deletePromotion(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  /* ============================
     TOGGLE STATUS
  ============================ */
  const handleToggle = async (id, status) => {
    try {
      await togglePromotionStatus(id, !status);
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_active: !status } : p
        )
      );
    } catch (err) {
      console.error("Toggle status error:", err);
    }
  };

  /* ============================
     STATUS MESSAGE
  ============================ */
  const StatusMessage = ({ type, text }) => (
    <div
      className={`status-message flex items-center gap-2 ${
        type === "success" ? "text-green-500" : "text-red-500"
      }`}
    >
      {type === "success" ? <CheckCircle size={20} /> : <X size={20} />}
      {text}
    </div>
  );

  return (
    <Card className="font-sans bg-glass min-h-screen p-4 ">
      <CardHeader>
        <CardTitle>Create Product Promotion</CardTitle>
        <CardDescription>
          Upload promotional banners for products or homepage campaigns.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {message && <StatusMessage {...message} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Image */}
          <div className="space-y-2">
            <Label>Promotion Image</Label>

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="rounded-md w-full"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2"
                >
                  <X size={20} />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-md p-12 text-center cursor-pointer ${
                  isDragActive ? "border-primary" : "border-border"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag & drop an image here, or click to select
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPG / PNG only — landscape recommended
                </p>
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading || !file} className="text-white">
            {loading ? "Uploading..." : "Save Promotion"}
          </Button>
        </form>
      </CardContent>

      {/* PROMOTIONS LIST */}
      <CardFooter className="flex-col items-start w-full space-y-4">
        <h3 className="font-bold text-lg">Existing Promotions</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="border rounded-md p-4 relative"
            >
              <img
                src={promo.image_url}
                alt="Promotion"
                className="w-full h-32 object-cover rounded-md mb-2"
              />

              <p className="text-xs mt-1">
                Status:
                <span
                  className={
                    promo.is_active
                      ? "text-green-600"
                      : "text-gray-500"
                  }
                >
                  {" "}
                  {promo.is_active ? "active" : "inactive"}
                </span>
              </p>

              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleToggle(promo.id, promo.is_active)
                  }
                >
                  {promo.is_active ? (
                    <ToggleRight size={18} />
                  ) : (
                    <ToggleLeft size={18} />
                  )}{" "}
                  Toggle
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(promo.id)}
                >
                  <Trash2 size={18} /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CreatePromotion;

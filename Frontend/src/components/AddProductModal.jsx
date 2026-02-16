import React, { useState, useEffect } from "react";
import { X, Plus, FileSpreadsheet } from "lucide-react";
import AddProductForm from "./AddProductForm";
import ImportData from "./ImportData";
import GlassmorphicContainer from "./GlassmorphicContainer";
import "./AddProductModal.css";

const AddProductModal = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("form"); // "form" or "import"

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setActiveTab("form"); // Reset to form tab when modal opens
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  return (
    <div
      className={`add-product-modal-overlay ${isOpen && isVisible ? "active" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`add-product-modal-content ${isOpen && isVisible ? "active" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassmorphicContainer className="add-product-modal-container">
          <button className="add-product-modal-close" onClick={handleClose}>
            <X size={24} />
          </button>

          <div className="add-product-modal-header">
            <h2>Add New Product</h2>
            <p>Fill in the details below or import from CSV to add products to your store</p>
          </div>

          {/* Toggle Buttons */}
          <div className="add-product-modal-tabs">
            <button
              className={`tab-button ${activeTab === "form" ? "active" : ""}`}
              onClick={() => setActiveTab("form")}
            >
              <Plus size={18} />
              <span>Add Single Product</span>
            </button>
            <button
              className={`tab-button ${activeTab === "import" ? "active" : ""}`}
              onClick={() => setActiveTab("import")}
            >
              <FileSpreadsheet size={18} />
              <span>Import from CSV</span>
            </button>
          </div>

          <div className="add-product-modal-body">
            {activeTab === "form" ? (
              <AddProductForm onSuccess={handleClose} />
            ) : (
              <ImportData />
            )}
          </div>
        </GlassmorphicContainer>
      </div>
    </div>
  );
};

export default AddProductModal;
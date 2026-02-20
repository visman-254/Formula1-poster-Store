import React, { useState, useEffect, useRef } from "react";
import { X, Plus, FileSpreadsheet } from "lucide-react";
import AddProductForm from "./AddProductForm";
import ImportData from "./ImportData";
import GlassmorphicContainer from "./GlassmorphicContainer";
import "./AddProductModal.css";

const AddProductModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("form");
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("form");
      document.body.style.overflow = "hidden";

      // Force scroll to top BEFORE the active class triggers the transition.
      // Using both immediate set and rAF to cover all browsers.
      if (overlayRef.current) {
        overlayRef.current.scrollTop = 0;
      }
      requestAnimationFrame(() => {
        if (overlayRef.current) {
          overlayRef.current.scrollTop = 0;
        }
      });
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  // Click on the dark backdrop (overlay itself) closes modal
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={`add-product-modal-overlay active`}
      onClick={handleOverlayClick}
    >
      <div className="add-product-modal-content">
        <GlassmorphicContainer className="add-product-modal-container">
          <button className="add-product-modal-close" onClick={handleClose}>
            <X size={22} />
          </button>

          <div className="add-product-modal-header">
            <h2>Add New Product</h2>
            <p>Fill in the details below or import from CSV to add products to your store</p>
          </div>

          <div className="add-product-modal-tabs">
            <button
              className={`tab-button ${activeTab === "form" ? "active" : ""}`}
              onClick={() => setActiveTab("form")}
            >
              <Plus size={17} />
              <span>Add Single Product</span>
            </button>
            <button
              className={`tab-button ${activeTab === "import" ? "active" : ""}`}
              onClick={() => setActiveTab("import")}
            >
              <FileSpreadsheet size={17} />
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
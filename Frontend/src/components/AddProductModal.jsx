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
      // Lock body using position:fixed trick — this preserves mobile overlay scroll
      // unlike overflow:hidden which kills touch events on the overlay
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      requestAnimationFrame(() => {
        if (overlayRef.current) {
          overlayRef.current.scrollTop = 0;
        }
      });
    } else {
      // Restore body scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY) * -1);
    }

    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY) * -1);
    };
  }, [isOpen]);

  const handleClose = () => onClose();

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="add-product-modal-overlay active"
      onClick={handleOverlayClick}
    >
      <div className="add-product-modal-content">
        {/*
          Using a plain div instead of GlassmorphicContainer here.
          GlassmorphicContainer may not forward className to its root element,
          which would strip all our modal styles and make the form invisible.
          The glassmorphic styling is applied directly via .add-product-modal-container CSS.
        */}
        <div className="add-product-modal-container">
          <button className="add-product-modal-close" onClick={handleClose}>
            <X size={22} />
          </button>

          <div className="add-product-modal-header">
            <h2>Add New Product</h2>
            <p>
              Fill in the details below or import from CSV to add products to
              your store
            </p>
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
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
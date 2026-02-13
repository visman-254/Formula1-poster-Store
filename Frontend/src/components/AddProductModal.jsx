import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import AddProductForm from "./AddProductForm";
import GlassmorphicContainer from "./GlassmorphicContainer";
import "./AddProductModal.css";

const AddProductModal = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
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
      className={`add-product-modal-overlay ${isOpen && isVisible ? 'active' : ''}`}
      onClick={handleClose}
    >
      <div 
        className={`add-product-modal-content ${isOpen && isVisible ? 'active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassmorphicContainer className="add-product-modal-container">
          <button 
            className="add-product-modal-close"
            onClick={handleClose}
          >
            <X size={24} />
          </button>
          
          <div className="add-product-modal-header">
            <h2>Add New Product</h2>
            <p>Fill in the details below to add a new product to your store</p>
          </div>
          
          <div className="add-product-modal-body">
            <AddProductForm onSuccess={handleClose} />
          </div>
        </GlassmorphicContainer>
      </div>
    </div>
  );
};

export default AddProductModal;

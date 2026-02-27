import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./SideMenu.css";

/* ===================== DEBOUNCE ===================== */
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

/* ===================== COMPONENT ===================== */
const SideMenu = ({ onCategorySelect, selectedCategory }) => {
  const [categories, setCategories] = useState([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  const navigate = useNavigate();

  /* ===================== FETCH CATEGORIES ===================== */
  useEffect(() => {
    api
      .get("/api/products/categories")
      .then((res) => {
        const filtered = res.data.filter(
          (c) => {
            const name = c.category_name.toLowerCase();
            return name !== "preorders" && name !== "uncategorized";
          }
        );
        setCategories(filtered);
      })
      .catch((err) =>
        console.error("Error fetching categories:", err)
      );
  }, []);

  /* ===================== AUTO EXPAND FROM URL ===================== */
  useEffect(() => {
    if (!selectedCategory || categories.length === 0) return;

    const parent = categories.find((cat) =>
      cat.subcategories?.some(
        (sub) => sub.category_name === selectedCategory
      )
    );

    if (parent) {
      setExpandedCategoryId(parent.category_id);
    }
  }, [selectedCategory, categories]);

  /* ===================== HANDLERS ===================== */
  const debouncedCategorySelect = useCallback(
    debounce(onCategorySelect, 200),
    [onCategorySelect]
  );

  const handleCategoryClick = (categoryName) => {
    debouncedCategorySelect(categoryName, true);
  };

  const handleParentClick = (e, categoryId, categoryName) => {
    e.preventDefault();
    e.stopPropagation();
    // Toggle expansion
    setExpandedCategoryId(prev => prev === categoryId ? null : categoryId);
    // Load products for this category immediately (not waiting for subcategory)
    onCategorySelect(categoryName, false);
  };

  const handlePreorderClick = (e) => {
    e.preventDefault();
    navigate("/preorder");
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="side-menu">
      <h1
        className="menu-title"
        onClick={() => {
          setExpandedCategoryId(null);
          onCategorySelect(null, false);
        }}
      >
        All Categories
      </h1>

      <ul className="category-list">
        {/* PREORDER */}
        <li className="preorder-menu-item">
          <div className="category-item">
            <a
              href="/preorder"
              onClick={handlePreorderClick}
              className="preorder-link"
            >
              Pre-order a Device
            </a>
          </div>
        </li>

        {/* CATEGORIES */}
        {categories.map((category) => {
          const isExpanded = expandedCategoryId === category.category_id;

          return (
            <li
              key={category.category_id}
            >
              <div className="category-item">
                <a
                  href="#"
                  onClick={(e) => handleParentClick(e, category.category_id, category.category_name)}
                  className={
                    selectedCategory === category.category_name
                      ? "active"
                      : ""
                  }
                >
                  {category.category_name}
                  {/* Show dropdown arrow if category has subcategories */}
                  {category.subcategories?.length > 0 && (
                    <span 
                      className="dropdown-arrow"
                      style={{
                        marginLeft: '8px',
                        fontWeight: 'bold',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      {isExpanded ? '−' : '+'}
                    </span>
                  )}
                </a>
              </div>

              {category.subcategories?.length > 0 && (
                <ul className="subcategory-list">
                  {/* Only show subcategories when this category is expanded (clicked) */}
                  {isExpanded && category.subcategories.map((subcategory) => (
                    <li key={subcategory.category_id}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExpandedCategoryId(
                            category.category_id
                          );
                          onCategorySelect(
                            subcategory.category_name,
                            false
                          );
                        }}
                        onMouseEnter={() =>
                          handleCategoryClick(
                            subcategory.category_name
                          )
                        }
                        className={
                          selectedCategory ===
                          subcategory.category_name
                            ? "active"
                            : ""
                        }
                      >
                        {subcategory.category_name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SideMenu;

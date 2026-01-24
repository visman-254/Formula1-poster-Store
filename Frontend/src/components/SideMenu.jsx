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
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);

  const navigate = useNavigate();

  /* ===================== FETCH CATEGORIES ===================== */
  useEffect(() => {
    api
      .get("/api/products/categories")
      .then((res) => {
        const filtered = res.data.filter(
          (c) => c.category_name.toLowerCase() !== "preorders"
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

  const handleCategoryHover = (categoryName) => {
    debouncedCategorySelect(categoryName, true);
  };

  const handleParentMouseEnter = (categoryId) => {
    setHoveredCategoryId(categoryId);
  };

  const handleParentMouseLeave = () => {
    if (!expandedCategoryId) {
      setHoveredCategoryId(null);
    }
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
          const isExpanded =
            hoveredCategoryId === category.category_id ||
            expandedCategoryId === category.category_id;

          return (
            <li
              key={category.category_id}
              onMouseEnter={() =>
                handleParentMouseEnter(category.category_id)
              }
              onMouseLeave={handleParentMouseLeave}
            >
              <div className="category-item">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setExpandedCategoryId(category.category_id);
                    onCategorySelect(category.category_name, false);
                  }}
                  className={
                    selectedCategory === category.category_name
                      ? "active"
                      : ""
                  }
                >
                  {category.category_name}
                </a>
              </div>

              {category.subcategories?.length > 0 && (
                <ul className="subcategory-list">
                  {(isExpanded
                    ? category.subcategories
                    : category.subcategories.slice(0, 3)
                  ).map((subcategory) => (
                    <li key={subcategory.category_id}>
                      <a
                        href="#"
                        onMouseEnter={() =>
                          handleCategoryHover(
                            subcategory.category_name
                          )
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          setExpandedCategoryId(
                            category.category_id
                          );
                          onCategorySelect(
                            subcategory.category_name,
                            false
                          );
                        }}
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

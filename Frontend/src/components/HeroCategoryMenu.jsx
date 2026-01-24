import React, { useEffect, useState } from "react";
import api from "../api";
import {
  ChevronRight,
  Smartphone,
  Headphones,
  Tv,
  Gamepad2,
  ShoppingBag
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./HeroCategoryMenu.css";

/* ICON MAP (can later come from backend) */
const categoryIcons = {
  phones: <Smartphone size={16} />,
  audio: <Headphones size={16} />,
  tvs: <Tv size={16} />,
  gaming: <Gamepad2 size={16} />,
  default: <ShoppingBag size={16} />
};

const HeroCategoryMenu = () => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/products/categories").then((res) => {
      setCategories(res.data);
    });
  }, []);

  const goToProducts = (category, subcategory) => {
    // Special handling for preorders
    if (category.toLowerCase() === 'preorders') {
      navigate('/preorder');
      setMobileOpen(false);
      return;
    }
    
    navigate(
      `/products?category=${encodeURIComponent(category)}${
        subcategory ? `&subcategory=${encodeURIComponent(subcategory)}` : ""
      }`
    );
    setMobileOpen(false);
  };

  // Handle clicking on the main category text/icon area
  const handleCategoryClick = (e, cat) => {
    e.stopPropagation();
    const key = cat.category_name.toLowerCase();
    const isPreorder = key.includes("preorder") || key === "preorders";
    
    if (isPreorder) {
      navigate('/preorder');
      setMobileOpen(false);
    } else {
      goToProducts(cat.category_name, null);
    }
  };

  // Handle clicking on a subcategory
  const handleSubcategoryClick = (e, cat, sub) => {
    e.stopPropagation();
    goToProducts(cat.category_name, sub.category_name);
  };

  return (
    <>
      {/* MOBILE TOGGLE */}
      <button className="jumia-mobile-toggle" onClick={() => setMobileOpen(true)}>
        ☰ Categories
      </button>

      {/* MENU */}
      <aside className={`jumia-menu ${mobileOpen ? "open" : ""}`}>
        <ul className="jumia-menu-list">
          {categories.map((cat) => {
            const key = cat.category_name.toLowerCase();
            const icon = categoryIcons[key] || categoryIcons.default;
            const isPreorder = key.includes("preorder") || key === "preorders";

            return (
              <li
                key={cat.category_id}
                className="jumia-menu-item"
                onMouseEnter={() => setActiveCategory(cat)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                {/* Clickable category area */}
                <div 
                  className="jumia-item-left"
                  onClick={(e) => handleCategoryClick(e, cat)}
                  style={{ cursor: 'pointer' }}
                >
                  {icon}
                  <span>{cat.category_name}</span>
                  
                  {/* PREORDER BADGE */}
                  {isPreorder && (
                    <span className="jumia-badge">PREORDER</span>
                  )}
                </div>

                {cat.subcategories?.length > 0 && !isPreorder && (
                  <>
                    <ChevronRight size={16} />

                    {/* MEGA PANEL */}
                    {activeCategory?.category_id === cat.category_id && (
                      <div className="jumia-mega">
                        {cat.subcategories.map((sub) => (
                          <div
                            key={sub.category_id}
                            className="jumia-mega-item"
                            onClick={(e) => handleSubcategoryClick(e, cat, sub)}
                          >
                            {sub.category_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <div className="jumia-backdrop" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
};

export default HeroCategoryMenu;
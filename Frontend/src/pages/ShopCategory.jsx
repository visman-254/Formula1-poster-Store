import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Tag } from "lucide-react";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";
import "./Products.css";
import SideMenu from "../components/SideMenu";
import PromotionalBanner from "../components/PromotionalBanner";
import "../components/SideMenu.css";
import CompressedImage from "../components/CompressedImage";

const ShopCategory = () => {
  const { category } = useParams();
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedMap, setAddedMap] = useState({});

  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        let res;
        if (!selectedCategory) {
          res = await axios.get(`${API_BASE}/api/products`);
        } else {
          res = await axios.get(`${API_BASE}/api/products/category/name/${selectedCategory}`);
        }

        setAllProducts(res.data);
        setFilteredProducts(res.data);

        const initialVariants = {};
        res.data.forEach((product) => {
          if (product.variants?.length > 0) {
            initialVariants[product.product_id] = product.variants[0];
          }
        });
        setSelectedVariants(initialVariants);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();

    axios
      .get(`${API_BASE}/api/products/categories`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, [selectedCategory]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(allProducts);
    } else {
      setFilteredProducts(
        allProducts.filter((product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, allProducts]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleVariantChange = (productId, variant) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
  };

  const handleAddToCart = (product) => {
    const selectedVariant = selectedVariants[product.product_id];
    if (selectedVariant) {
      addToCart({ ...product, ...selectedVariant });
      setAddedMap((prev) => ({ ...prev, [product.product_id]: true }));
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [product.product_id]: false })), 1800);
    }
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  return (
    <div className="samsung-products-page">
      {/* Search Bar */}
      <div className="samsung-search-bar">
        <div className="search-input-wrap">
          <Search className="search-icon-inner" />
          <input
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={handleSearchChange}
            className="samsung-search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>
          )}
        </div>
        <span className="results-count">
          <span className="results-num">{filteredProducts.length}</span>
          {filteredProducts.length === 1 ? " item" : " items"}
          {searchQuery && <span className="results-query"> for &ldquo;{searchQuery}&rdquo;</span>}
          {!searchQuery && <span> in {selectedCategory || "All Categories"}</span>}
        </span>
      </div>

      <div className="samsung-layout">
        <SideMenu onCategorySelect={handleCategorySelect} selectedCategory={selectedCategory} />

        <div className="samsung-grid-wrap">
          {/* Promotional Banner */}
          <div className="samsung-banner-inner">
            <PromotionalBanner displayLocation="shop_category_top" />
          </div>

          <div className="samsung-product-grid">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="samsung-card-skeleton">
                  <Skeleton className="skel-img" />
                  <div className="skel-body">
                    <Skeleton className="skel-title" />
                    <Skeleton className="skel-price" />
                    <Skeleton className="skel-btn" />
                  </div>
                </div>
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                if (!product.variants?.length) return null;

                const selectedVariant = selectedVariants[product.product_id];
                if (!selectedVariant) return null;

                const originalPrice = (Number(selectedVariant.price) || 0) + (Number(selectedVariant.discount) || 0);
                const hasDiscount = Number(selectedVariant.discount) > 0;
                const isAdded = addedMap[product.product_id];

                return (
                  <div key={product.product_id} className="samsung-card">
                    {/* Color Picker - only show if variants have colors */}
                    {product.variants.some(v => v.color) && (
                      <div className="samsung-color-picker">
                        {product.variants.filter(v => v.color).map((variant) => {
                          const isSelected = selectedVariant.variant_id === variant.variant_id;
                        return (
                          <button
                            key={variant.variant_id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleVariantChange(product.product_id, variant);
                            }}
                            className={`swatch-dot ${isSelected ? "swatch-active" : ""}`}
                            style={{ background: variant.color?.toLowerCase() || "#ccc" }}
                            title={variant.color}
                          >
                            {isSelected && (
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        );
                        })}
                      </div>
                    )}

                    {!!hasDiscount && (
                      <div className="samsung-sale-badge">
                        <Tag className="badge-icon" />
                        SALE
                      </div>
                    )}

                    <Link to={`/products/${product.product_id}`} className="samsung-card-link">
                      <div className="samsung-card-img">
                        <CompressedImage
                          src={selectedVariant.image}
                          alt={product.title}
                          className="product-image"
                          maxWidth={300}
                          maxHeight={300}
                          quality={0.8}
                        />
                      </div>

                      <div className="samsung-card-body">
                        <h3 className="samsung-card-title">{product.title}</h3>
                        <p className="samsung-card-desc">
                          <DescriptionText description={product.description} />
                        </p>
                        <div className="samsung-card-price">
                          {hasDiscount ? (
                            <>
                              <span className="price-original">Kshs {Number(originalPrice).toFixed(2)}</span>
                              <span className="price-current">Kshs {Number(selectedVariant.price).toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="price-current">Kshs {Number(selectedVariant.price).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="samsung-card-footer">
                      <button
                        className={`samsung-atc-btn ${isAdded ? "atc-success" : ""}`}
                        onClick={() => handleAddToCart(product)}
                      >
                        {isAdded ? (
                          <>
                            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Added
                          </>
                        ) : (
                          "Add to Cart"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="samsung-empty">
                <Search className="empty-icon" />
                <p className="empty-title">No products found</p>
                <p className="empty-sub">
                  {searchQuery
                    ? `No results matching "${searchQuery}"`
                    : `No products available in ${selectedCategory}.`}
                </p>
                {searchQuery && (
                  <button className="empty-clear-btn" onClick={() => setSearchQuery("")}>
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DescriptionText = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  const words = description.split(" ");
  const shortDesc = words.slice(0, 3).join(" ");
  const isShort = words.length <= 3;

  return (
    <span>
      {expanded ? description : shortDesc}
      {!isShort && (
        <button type="button" onClick={() => setExpanded(!expanded)} className="see-more-btn">
          {expanded ? " See less" : " ...See more"}
        </button>
      )}
    </span>
  );
};

export default ShopCategory;
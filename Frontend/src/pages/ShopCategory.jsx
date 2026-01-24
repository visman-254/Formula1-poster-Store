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
import { Search, Tag } from "lucide-react";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";
import "./Products.css";

import SideMenu from "../components/SideMenu";
import PromotionalBanner from "../components/PromotionalBanner";
import "../components/SideMenu.css";

const ShopCategory = () => {
  const { category } = useParams();
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [categories, setCategories] = useState([]);

  // Update selected category when URL param changes
  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  // Fetch products and categories
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        let res;
        if (!selectedCategory) {
          res = await axios.get(`${API_BASE}/api/products`);
        } else {
          res = await axios.get(
            `${API_BASE}/api/products/category/name/${selectedCategory}`
          );
        }

        setAllProducts(res.data);
        setFilteredProducts(res.data);

        // Initialize default selected variants
        const initialVariants = {};
        res.data.forEach((product) => {
          if (product.variants?.length > 0) {
            initialVariants[product.product_id] = product.variants[0];
          }
        });
        setSelectedVariants(initialVariants);
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };

    fetchCategoryProducts();

    // Fetch all categories for the sidebar
    axios
      .get(`${API_BASE}/api/products/categories`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, [selectedCategory]);

  // Search filter
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

  // Handlers
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleVariantChange = (productId, variant) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variant,
    }));
  };

  const handleAddToCart = (product) => {
    const selectedVariant = selectedVariants[product.product_id];
    if (selectedVariant) {
      addToCart({ ...product, ...selectedVariant });
    }
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  return (
    <div className="products-container">
      {/* Search Section */}
      <div className="search-section mb-4 px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8 pr-3 py-1 h-8 text-sm border border-gray-300 rounded-md focus:border-transparent dark:border-gray-600 dark:text-white w-48"
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
            {searchQuery && ` for "${searchQuery}"`}
            {!searchQuery && ` in ${selectedCategory || "All Categories"}`}
          </div>
        </div>
      </div>

      {/* Layout: Sidebar + Products */}
      <div className="flex">
        <SideMenu
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
        />

        <div className="flex-grow px-4 md:px-8">
          {/* Promotional Banner */}
          <PromotionalBanner displayLocation="shop_category_top" />

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                if (!product.variants?.length) return null;

                const selectedVariant = selectedVariants[product.product_id];
                if (!selectedVariant) return null;

                const originalPrice =
                  (Number(selectedVariant.price) || 0) +
                  (Number(selectedVariant.discount) || 0);
                const hasDiscount = Number(selectedVariant.discount) > 0;

                return (
                  <Card
                    key={product.product_id}
                    className="modern-card relative transition-all duration-300 ease-in-out hover:scale-105 border-none bg-white dark:bg-black group"
                  >
                    {/* Shimmer Effect */}
                    <div className="shimmer-effect absolute inset-0 overflow-hidden rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="shimmer-corner top-0 left-0"></div>
                      <div className="shimmer-corner bottom-0 right-0"></div>
                    </div>

                    {/* Color Picker */}
                    <div className="absolute top-3 right-3 z-10">
                      <div className="square-color-picker">
                        {product.variants.map((variant) => {
                          const isSelected =
                            selectedVariant.variant_id === variant.variant_id;
                          return (
                            <button
                              key={variant.variant_id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleVariantChange(product.product_id, variant);
                              }}
                              className={`color-square ${isSelected ? "is-selected" : ""}`}
                              style={{ backgroundColor: variant.color.toLowerCase() }}
                              title={variant.color}
                            >
                              <div className="color-filter"></div>
                              {isSelected && <span className="selection-check">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {hasDiscount && (
                      <div className="absolute top-3 left-3 z-10 bg-yellow-500 text-black dark:bg-yellow-600 dark:text-black px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        SALE
                      </div>
                    )}

                    <Link to={`/products/${product.product_id}`}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium line-clamp-2 h-10 overflow-hidden">
                          {product.title}
                        </CardTitle>
                        <div className="product-image-container">
                          <img
                            src={selectedVariant.image}
                            alt={product.title}
                            className="product-image"
                            loading="lazy"
                          />
                        </div>
                        <CardDescription className="product-description">
                          <DescriptionText description={product.description} />
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="card-price font-semibold p-0 px-3 pb-2">
                        {hasDiscount ? (
                          <>
                            <span className="text-muted-foreground text-sm line-through">
                              Kshs {Number(originalPrice).toFixed(2)}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 ml-2">
                              Kshs {Number(selectedVariant.price).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span>Kshs {Number(selectedVariant.price).toFixed(2)}</span>
                        )}
                      </CardContent>
                    </Link>

                    <CardFooter className="card-foter p-3 pt-1">
                      <Button
                        className="modern-cart-btn w-30 md:w-30"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to cart
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="max-w-md mx-auto">
                  <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {searchQuery
                      ? `No products found matching "${searchQuery}". Try a different search term.`
                      : `No products available in ${selectedCategory}.`}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Description component
const DescriptionText = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  const words = description.split(" ");
  const shortDesc = words.slice(0, 3).join(" ");
  const isShort = words.length <= 3;

  return (
    <span>
      {expanded ? description : shortDesc}
      {!isShort && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="see-more-btn"
        >
          {expanded ? " See less" : " ...See more"}
        </button>
      )}
    </span>
  );
};

export default ShopCategory;

import React, { useEffect, useState } from "react";
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
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";
import "./Products.css";

import SideMenu from "../components/SideMenu";
import "../components/SideMenu.css";

const Products = () => {
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  /* ===================== FETCH PRODUCTS ===================== */
  useEffect(() => {
    const endpoint = selectedCategory
      ? `${API_BASE}/api/products/category/name/${selectedCategory}`
      : `${API_BASE}/api/products`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setFilteredProducts(data);

        // Default variant for NON-bundles
        const defaults = {};
        data.forEach((p) => {
          if (!p.is_bundle && p.variants?.length > 0) {
            defaults[p.product_id] = p.variants[0];
          }
        });

        setSelectedVariants(defaults);
      })
      .catch((err) => console.error("Fetch products error:", err));
  }, [selectedCategory]);

  /* ===================== SEARCH ===================== */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    setFilteredProducts(
      products.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, products]);

  /* ===================== HANDLERS ===================== */
  const handleVariantChange = (productId, variant) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variant,
    }));
  };

  const handleAddToCart = (product) => {
    if (product.is_bundle) {
      addToCart({ ...product, type: "bundle" });
      return;
    }

    const variant = selectedVariants[product.product_id];
    if (!variant) return;

    addToCart({ ...product, ...variant, type: "single" });
  };

  /* ===================== IMAGE RENDER (SAME AS ProductDetail) ===================== */
  const renderProductImage = (product) => {
  /* ================= BUNDLED PRODUCTS ================= */
  if (
    product.is_bundle &&
    Array.isArray(product.bundle_products) &&
    product.bundle_products.length >= 2
  ) {
    // Extract images exactly like ProductDetail fallback logic
    const leftImage =
      product.bundle_products[0]?.variants?.[0]?.image ||
      product.bundle_products[0]?.primaryImage;

    const rightImage =
      product.bundle_products[1]?.variants?.[0]?.image ||
      product.bundle_products[1]?.primaryImage;

    if (leftImage && rightImage) {
      return (
        <div className="bundle-image-splice">
          <img
            src={leftImage}
            className="bundle-splice-image-left"
            alt="Bundle item 1"
            onError={(e) => (e.target.src = "/fallback.jpg")}
          />
          <img
            src={rightImage}
            className="bundle-splice-image-right"
            alt="Bundle item 2"
            onError={(e) => (e.target.src = "/fallback.jpg")}
          />
        </div>
      );
    }
  }

  /* ================= SINGLE PRODUCTS ================= */
  const selectedVariant = selectedVariants[product.product_id];

  const image =
    selectedVariant?.image ||
    product.primaryImage ||
    "/fallback.jpg";

  return (
    <img
      src={image}
      alt={product.title}
      className="product-image"
      onError={(e) => (e.target.src = "/fallback.jpg")}
    />
  );
};



  /* ===================== RENDER ===================== */
  return (
    <div className="products-container">
      {/* SEARCH */}
      <div className="search-section mb-4 px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 h-8 text-sm w-48"
            />
          </div>
          <span className="text-xs text-gray-500">
            {filteredProducts.length} item
            {filteredProducts.length !== 1 && "s"}
          </span>
        </div>
      </div>

      <div className="flex">
        <SideMenu
          onCategorySelect={setSelectedCategory}
          selectedCategory={selectedCategory}
        />

        <div className="grid flex-grow grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4 md:p-8">
          {filteredProducts.length === 0 && <EmptyState />}

          {filteredProducts.map((product) => {
            const isBundle = product.is_bundle === true;

            if (!isBundle && !product.variants?.length) return null;

            const selectedVariant = !isBundle
              ? selectedVariants[product.product_id]
              : null;

            if (!isBundle && !selectedVariant) return null;

            const hasDiscount =
              !isBundle && Number(selectedVariant.discount) > 0;

            const originalPrice =
              !isBundle
                ? Number(selectedVariant.price) +
                  Number(selectedVariant.discount || 0)
                : 0;

            return (
              <Card
                key={product.product_id}
                className="modern-card relative hover:scale-105 transition-all group"
              >
                {/* BADGES */}
                {isBundle && (
                  <span className="absolute top-3 left-3 z-10 bg-purple-500 text-white px-2 py-1 text-xs rounded-full">
                    BUNDLE
                  </span>
                )}

                {hasDiscount && (
                  <span className="absolute top-3 left-3 z-10 bg-yellow-500 px-2 py-1 text-xs rounded-full flex items-center gap-1">
                    <Tag className="w-3 h-3" /> SALE
                  </span>
                )}

                {/* COLOR PICKER */}
                {!isBundle && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="square-color-picker">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.variant_id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleVariantChange(product.product_id, variant);
                          }}
                          className={`color-square ${
                            selectedVariant.variant_id === variant.variant_id
                              ? "is-selected"
                              : ""
                          }`}
                          style={{
                            backgroundColor: variant.color?.toLowerCase(),
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Link to={`/products/${product.product_id}`}>
                  <CardHeader>
                    <CardTitle className="text-sm line-clamp-2 h-10">
                      {product.title}
                    </CardTitle>

                    <div className="product-image-container">
                      {renderProductImage(product)}
                    </div>

                    <CardDescription>
                      <DescriptionText description={product.description} />
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="font-semibold px-3 pb-2">
                    {isBundle ? (
                      <>Kshs {Number(product.price || 0).toFixed(2)}</>
                    ) : hasDiscount ? (
                      <>
                        <span className="line-through text-sm mr-2">
                          Kshs {originalPrice.toFixed(2)}
                        </span>
                        <span>
                          Kshs {Number(selectedVariant.price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <>Kshs {Number(selectedVariant.price).toFixed(2)}</>
                    )}
                  </CardContent>
                </Link>

                <CardFooter className="p-3 pt-1">
                  <Button
                    className="modern-cart-btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to cart
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ===================== HELPERS ===================== */

const DescriptionText = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  if (!description) return null;

  const words = description.split(" ");
  const short = words.slice(0, 3).join(" ");

  return (
    <span>
      {expanded ? description : short}
      {words.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="see-more-btn"
        >
          {expanded ? " See less" : " ...See more"}
        </button>
      )}
    </span>
  );
};

const EmptyState = () => (
  <div className="col-span-full text-center py-12">
    <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold">No products found</h3>
  </div>
);

export default Products;

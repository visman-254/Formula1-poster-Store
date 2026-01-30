import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PromotionalBanner from "../components/PromotionalBanner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Tag } from "lucide-react";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";
import "./Products.css";
import SideMenu from "../components/SideMenu";
import "../components/SideMenu.css";

const ProductList = ({ searchQuery, setSearchQuery }) => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [categories, setCategories] = useState([]);

  /* ================= FETCH PRODUCTS ================= */
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        let res;

        if (!category) {
          res = await axios.get(`${API_BASE}/api/products`);
        } else {
          res = await axios.get(
            `${API_BASE}/api/products/category/name/${category}`
          );
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
      }
    };

    fetchProductsData();

    axios
      .get(`${API_BASE}/api/products/categories`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
  }, [category]);

  /* ================= SEARCH FILTER ================= */
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

  /* ================= HANDLERS ================= */
  const handleVariantChange = (productId, variant) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variant,
    }));
  };

  const handleAddToCart = (product) => {
    const variant = selectedVariants[product.product_id];
    if (variant) {
      addToCart({ ...product, ...variant });
    }
  };

  const handleCategorySelect = (categoryName, isHover = false) => {
    const options = isHover ? { state: { fromSideMenuHover: true } } : {};
    if (!categoryName) {
      navigate("/products", options);
    } else {
      navigate(`/products/category/${categoryName}`, options);
    }
  };

  /* ================= IMAGE RENDER ================= */
  const renderProductImage = (product) => {
    if (
      product.is_bundle &&
      Array.isArray(product.bundle_products) &&
      product.bundle_products.length >= 2
    ) {
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
            />
            <img
              src={rightImage}
              className="bundle-splice-image-right"
              alt="Bundle item 2"
            />
          </div>
        );
      }
    }

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
      />
    );
  };

  return (
    <div className="products-container">
      {/* 🔥 PROMOTIONAL BANNER */}
      <div className="px-4 md:px-8 pt-4">
        <PromotionalBanner className="promotional-banner"/>
      </div>

      {/* Search Info */}
      <div className="search-section mb-4 px-4 md:px-8">
        <div className="text-xs text-gray-500 whitespace-nowrap">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "item" : "items"}
          {searchQuery && ` for "${searchQuery}"`}
          {!searchQuery && category && ` in ${category}`}
          {!searchQuery && !category && " in All Products"}
        </div>
      </div>

      <div className="flex">
        <SideMenu
          onCategorySelect={handleCategorySelect}
          selectedCategory={category}
        />

        {/* Updated grid to use pos-products-grid */}
        <div className="pos-products-grid flex-grow">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              if (!product.is_bundle && !product.variants?.length) return null;

              const selectedVariant =
                selectedVariants[product.product_id];

              const priceSource = selectedVariant || {};
              const originalPrice =
                (Number(priceSource.price) || 0) +
                (Number(priceSource.discount) || 0);
              const hasDiscount = Number(priceSource.discount) > 0;

              return (
                <Card
                  key={product.product_id}
                  className="modern-card relative transition-all hover:scale-105 border-none group"
                >
                  {hasDiscount && (
                    <div className="absolute top-3 left-3 z-10 bg-yellow-500 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3" /> SALE
                    </div>
                  )}

                  <Link to={`/products/${product.product_id}`}>
                    <div className="pos-product-image-wrapper">
                      {renderProductImage(product)}
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-sm line-clamp-2 h-10">
                        {product.title}
                      </CardTitle>
                      <CardDescription className="product-description">
                        <DescriptionText
                          description={product.description}
                        />
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="font-semibold px-3 pb-2">
                      {hasDiscount ? (
                        <>
                          <span className="line-through text-sm">
                            Kshs {originalPrice.toFixed(2)}
                          </span>
                          <span className="ml-2">
                            Kshs {Number(priceSource.price).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span>
                          Kshs {Number(priceSource.price).toFixed(2)}
                        </span>
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
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Search className="mx-auto h-12 w-12 mb-4 opacity-40" />
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="opacity-70">
                {searchQuery
                  ? `No products match "${searchQuery}"`
                  : `No products in ${category || "All Products"}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DescriptionText = ({ description }) => {
  const [expanded, setExpanded] = useState(false);

  const words = description.split(" ");
  const shortDesc = words.slice(0, 3).join(" ");

  return (
    <span>
      {expanded ? description : shortDesc}
      {words.length > 3 && (
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

export default ProductList;
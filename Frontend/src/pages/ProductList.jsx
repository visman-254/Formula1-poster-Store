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
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Tag } from "lucide-react";
import { useCart } from "../context/CartContext";
import API_BASE from "../config";
import "./Products.css";
import SideMenu from "../components/SideMenu";
import "../components/SideMenu.css";
import CompressedImage from "../components/CompressedImage";

const ProductList = ({ searchQuery, setSearchQuery }) => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedMap, setAddedMap] = useState({});

  /* ================= FETCH PRODUCTS ================= */
  useEffect(() => {
    const fetchProductsData = async () => {
      setLoading(true);
      try {
        let res;
        if (!category) {
          res = await axios.get(`${API_BASE}/api/products`);
        } else {
          res = await axios.get(`${API_BASE}/api/products/category/name/${category}`);
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
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
  };

  const handleAddToCart = (product) => {
    const variant = selectedVariants[product.product_id];
    if (variant) {
      addToCart({ ...product, ...variant });
      setAddedMap((prev) => ({ ...prev, [product.product_id]: true }));
      setTimeout(() => setAddedMap((prev) => ({ ...prev, [product.product_id]: false })), 1800);
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
      !!product.is_bundle &&
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
            <CompressedImage src={leftImage} alt="Bundle item 1" className="bundle-splice-image-left" maxWidth={300} maxHeight={300} quality={0.8} />
            <CompressedImage src={rightImage} alt="Bundle item 2" className="bundle-splice-image-right" maxWidth={300} maxHeight={300} quality={0.8} />
          </div>
        );
      }
    }

    const selectedVariant = selectedVariants[product.product_id];
    const image = selectedVariant?.image || product.primaryImage || "/fallback.jpg";

    return (
      <CompressedImage src={image} alt={product.title} className="product-image" maxWidth={300} maxHeight={300} quality={0.8} />
    );
  };

  return (
    <div className="samsung-products-page">
      {/* Promotional Banner */}
      <div className="samsung-banner-wrap">
        <PromotionalBanner className="promotional-banner" />
      </div>

      {/* Results Count */}
      <div className="samsung-results-bar">
        <span className="results-count">
          <span className="results-num">{filteredProducts.length}</span>
          {filteredProducts.length === 1 ? " item" : " items"}
          {searchQuery && <span className="results-query"> for &ldquo;{searchQuery}&rdquo;</span>}
          {!searchQuery && category && <span className="results-query"> in {category}</span>}
          {!searchQuery && !category && <span> in All Products</span>}
        </span>
      </div>

      <div className="samsung-layout">
        <SideMenu onCategorySelect={handleCategorySelect} selectedCategory={category} />

        <div className="samsung-grid-wrap">
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
                if (!product.is_bundle && !product.variants?.length) return null;

                const selectedVariant = selectedVariants[product.product_id];
                const priceSource = selectedVariant || {};
                const originalPrice = (Number(priceSource.price) || 0) + (Number(priceSource.discount) || 0);
                const hasDiscount = Number(priceSource.discount) > 0;
                const isBundle = product.is_bundle;

                return (
                  <div key={product.product_id} className="samsung-card">
                    {/* Discount badge */}
                    {!!hasDiscount && (
                      <div className="samsung-sale-badge">
                        <Tag className="badge-icon" />
                        SALE
                      </div>
                    )}

                    {/* Bundle badge */}
                    {!!product.is_bundle && (
                      <div className="samsung-bundle-badge">Bundle</div>
                    )}

                    <Link to={`/products/${product.product_id}`} className="samsung-card-link">
                      <div className="samsung-card-img">
                        {renderProductImage(product)}
                      </div>

                      <div className="samsung-card-body">
                        <h3 className="samsung-card-title">{product.title}</h3>
                        <p className="samsung-card-desc">
                          <DescriptionText description={product.description} />
                        </p>
                        <div className="samsung-card-price">
                          {hasDiscount ? (
                            <>
                              <span className="price-original">Kshs {originalPrice.toFixed(2)}</span>
                              <span className="price-current">Kshs {Number(priceSource.price).toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="price-current">Kshs {Number(priceSource.price).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                    
                    {/* View Details Button */}
                    <div className="samsung-card-actions">
                      <Link to={`/products/${product.product_id}`}>
                        <Button className="w-full" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="samsung-empty">
                <Search className="empty-icon" />
                <p className="empty-title">No products found</p>
                <p className="empty-sub">
                  {searchQuery ? `No results for "${searchQuery}"` : `No products in ${category || "All Products"}`}
                </p>
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

  return (
    <span>
      {expanded ? description : shortDesc}
      {words.length > 3 && (
        <button type="button" onClick={() => setExpanded(!expanded)} className="see-more-btn">
          {expanded ? " See less" : " ...See more"}
        </button>
      )}
    </span>
  );
};

export default ProductList;
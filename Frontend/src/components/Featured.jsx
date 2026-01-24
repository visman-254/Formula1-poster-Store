import React, { useEffect, useState, useRef } from "react";
import API_BASE from "../config";
import axios from "axios";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import './Featured.css';

const Featured = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const scrollContainerRef = useRef(null);
  const autoPlayRef = useRef(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/featured/featured?limit=8`);
        setProducts(data);
      } catch (err) {
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Get dynamic gap based on screen width
  const getGap = () => {
    if (typeof window === 'undefined') return 16;
    const width = window.innerWidth;
    if (width >= 1280) return 20; // 1.25rem
    if (width >= 1024) return 16; // 1rem
    if (width >= 768) return 16; // 1rem
    return 16; // 1rem for mobile
  };

  useEffect(() => {
    if (scrollContainerRef.current && products.length > 0) {
      const container = scrollContainerRef.current;
      const card = container.querySelector(".featured-card-wrapper");
      if (!card) return;
      
      const cardWidth = card.offsetWidth;
      const gap = getGap();
      
      container.scrollTo({
        left: currentIndex * (cardWidth + gap),
        behavior: 'smooth'
      });
    }
  }, [currentIndex, products.length]);

  const handleScroll = () => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }

    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 5000);

    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const card = container.querySelector(".featured-card-wrapper");
      if (!card) return;
      
      const cardWidth = card.offsetWidth;
      const gap = getGap();
      const scrollPosition = container.scrollLeft;
      const newIndex = Math.round(scrollPosition / (cardWidth + gap));
      setCurrentIndex(Math.min(newIndex, products.length - 1));
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const nextSlide = () => {
    console.log("Next clicked");
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  if (loading) {
    return (
      <div className="featured-loading">
        <p>Loading featured products...</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="featured-section">
      <h2 className="featured-title">Featured Products</h2>
      <p className="featured-subtitle">
        Discover our handpicked selection of premium electronics
      </p>

      <div className="featured-carousel-wrapper">
        
        {/* Navigation buttons - hidden on mobile, visible on desktop */}
        {products.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="featured-nav-button featured-nav-left"
              aria-label="Previous product"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={nextSlide}
              className="featured-nav-button featured-nav-right"
              aria-label="Next product"
            >
              <ChevronRight />
            </button>
          </>
        )}

        <div
          ref={scrollContainerRef}
          className="featured-scroll-container"
          onScroll={handleScroll}
        >
          {products.map((p, index) => {
            
            const offset = (index - currentIndex) * 20;
            const isActive = index === currentIndex;
            const isNext = index === (currentIndex + 1) % products.length;
            const isPrev = index === (currentIndex - 1 + products.length) % products.length;

            return (
              <div
                key={p.product_id}
                className={`featured-card-wrapper ${isActive ? 'active' : ''}`}
              >
                <Card className="featured-card">
                  <CardHeader>
                    <CardTitle className="featured-card-title">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/products/${p.product_id}`}>
                      <div className="featured-image-container">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="featured-image"
                          style={{
                            transform: isNext || isPrev ? `translateX(${offset}px)` : 'translateX(0)',
                            transition: 'transform 0.6s ease-out'
                          }}
                        />
                      </div>
                    </Link>
                    <p className="featured-price">KSh {p.price?.toLocaleString()}</p>
                    <p className="featured-category">{p.category_name}</p>
                    <Link to={`/products/${p.product_id}`}>
                      <Button className="featured-button">View Details →</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        
        {products.length > 1 && (
          <div className="featured-dots">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`featured-dot ${index === currentIndex ? 'active' : ''}`}
                aria-label={`Go to product ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Featured;
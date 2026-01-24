import React, { useEffect, useState } from "react";
import { getPromotions } from "../api/productPromotion";
import { Pause, Play } from "lucide-react";
import "./PromotionalBanner.css";

const getRandomIndex = (length) =>
  Math.floor(Math.random() * length);

const PromotionalBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const getNextRandomIndex = (current, length) => {
    let newIndex;
    do {
      newIndex = getRandomIndex(length);
    } while (newIndex === current && length > 1);
    return newIndex;
  };

  /* Fetch banners */
  useEffect(() => {
    const fetchBanners = async () => {
      const data = await getPromotions();
      if (data?.length) {
        const start = getRandomIndex(data.length);
        setBanners(data);
        setCurrentIndex(start);
        setNextIndex(getNextRandomIndex(start, data.length));
      }
    };
    fetchBanners();
  }, []);

  /* Slideshow */
  useEffect(() => {
    if (!banners.length || isPaused) return;

    const interval = setInterval(() => {
      setIsFading(true);

      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setNextIndex(
          getNextRandomIndex(nextIndex, banners.length)
        );
        setIsFading(false);
      }, 600);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners, nextIndex, isPaused]);

  const current = banners[currentIndex];
  const next = banners[nextIndex];

  if (!current || !next) return null;

  return (
    <section className="promo-container">
      <div className="promo-img-wrapper">
        {isPaused ? (
          <Play className="pause-icon" onClick={() => setIsPaused(false)} />
        ) : (
          <Pause className="pause-icon" onClick={() => setIsPaused(true)} />
        )}

        <img
          src={next.image_url}
          alt="Promotion"
          className={`promo-img next-slide ${isFading ? "active" : ""}`}
        />

        <img
          src={current.image_url}
          alt="Promotion"
          className={`promo-img current-slide ${
            isFading ? "fading-out" : "active"
          }`}
        />
      </div>
    </section>
  );
};

export default PromotionalBanner;

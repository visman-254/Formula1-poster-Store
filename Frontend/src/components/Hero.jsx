// src/components/Hero.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BlurText from "../components/BlurText";
import DecryptedText from "./DecryptedText";
import { getHeroSlides } from "../api/heroslide";
import { Pause, Play, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import "./Hero.css";
import Featured from "../components/Featured";
import HeroCategoryMenu from "../components/HeroCategoryMenu";

/* assets */
import iphone from "../assets/ufo.png";
import phone from "../assets/blackheadset.png";
import pod from "../assets/canyonrgborange.png";
import jbl from "../assets/canyonrgbpurple.png";
import jug from "../assets/carthingy.png";
import two from "../assets/gamingchair.png";
import ty from "../assets/kids.png";
import apps from "../assets/melonmouse.png";
import cafe from "../assets/myear.png";
import greencap from "../assets/rope.png";
import green from "../assets/myearsilver.png";
import marsal from "../assets/stringpod.png";
import pot from "../assets/whiteheadset.png";
import redcap from "../assets/wireless.png";

const allImages = [
  iphone, phone, pod, jbl, jug, two, ty, apps,
  cafe, greencap, green, marsal, pot, redcap,
];

const numAllImages = allImages.length;
const getRandomIndex = (length) => Math.floor(Math.random() * length);

const Hero = () => {
  const [heroSlides, setHeroSlides]       = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [prevHeroIndex, setPrevHeroIndex] = useState(null);
  const [isFading, setIsFading]           = useState(false);
  const [isPaused, setIsPaused]           = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const getNextRandomIndex = (current, length) => {
    let next;
    do { next = getRandomIndex(length); } while (next === current && length > 1);
    return next;
  };

  useEffect(() => {
    const fetchSlides = async () => {
      const data = await getHeroSlides();
      if (data?.length) {
        setHeroSlides(data);
        setCurrentHeroIndex(getRandomIndex(data.length));
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (!heroSlides.length || isPaused) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setPrevHeroIndex(currentHeroIndex);
        setCurrentHeroIndex((prev) => getNextRandomIndex(prev, heroSlides.length));
        setIsFading(false);
      }, 800);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides, isPaused, currentHeroIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % numAllImages);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentSlide = heroSlides[currentHeroIndex];
  const prevSlide    = prevHeroIndex !== null ? heroSlides[prevHeroIndex] : null;
  const slideLink    = currentSlide?.category_name
    ? `/products/category/${currentSlide.category_name}`
    : "/products";

  return (
    <>
      <section className="hero-container">

          {/* Desktop-only floating buttons — hidden on mobile via CSS */}
          <div className="floating-contact-buttons">
            <a href="tel:+254712133135" className="contact-float-button call-button">
              <Phone className="contact-icon" size={32} />
              <div className="contact-text">
                <span className="contact-title">Call to</span>
                <span className="contact-subtitle">Order</span>
              </div>
            </a>
            <a
              href="https://wa.me/254712133135"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-float-button whatsapp-button"
            >
              <MessageCircle className="contact-icon" size={32} />
              <div className="contact-text">
                <span className="contact-title">Order from</span>
                <span className="contact-subtitle">WhatsApp</span>
              </div>
            </a>
          </div>

        <div className="hero-img-wrapper">

          {currentSlide && (
            <>
              {/* Pause / Play */}
              {isPaused
                ? <Play  className="pause-icon" onClick={() => setIsPaused(false)} />
                : <Pause className="pause-icon" onClick={() => setIsPaused(true)}  />
              }

              {/* Outgoing image (crossfade layer) */}
              {prevSlide && isFading && (
                <img
                  key={`prev-${prevHeroIndex}`}
                  src={prevSlide.image_url}
                  alt=""
                  className="hero-img hero-img-behind"
                />
              )}

              {/* Current image */}
              <img
                key={`current-${currentHeroIndex}`}
                src={currentSlide.image_url}
                alt={currentSlide.title}
                className={`hero-img ${isFading ? "fading-out" : "active"}`}
              />

              {/* ── DESKTOP: centred glass overlay ── */}
              <div className="hero-overlay">
                <h1 className="hero-title">{currentSlide.title}</h1>
                <DecryptedText
                  text={currentSlide.description}
                  animateOn="view"
                  revealDirection="center"
                  speed={100}
                  maxIterations={15}
                  className="hero-subtitle"
                  encryptedClassName="hero-subtitle-encrypted"
                  parentClassName="hero-subtitle-wrapper"
                />
                <Link to={slideLink}>
                  <Button className="shop shop-now-button mt-6">
                    <ShoppingBag className="shop-icon" size={20} />
                    Visit Shop
                  </Button>
                </Link>
              </div>

              {/* ── MOBILE: frosted strip pinned to bottom of image ──
                  CSS hides this on desktop, shows only on mobile.     */}
              <div className="hero-mobile-strip">
                <p className="strip-title">{currentSlide.title}</p>
                <Link to={slideLink} className="strip-link">
                  Visit Shop →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Mobile-only compact contact row — sits below the image, no overlap */}
        <div className="mobile-contact-row">
          <a href="tel:+254712133135" className="mobile-contact-btn mobile-call-btn">
            <Phone size={16} />
            <span>Call to Order</span>
          </a>
          <a
            href="https://wa.me/254712133135"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-contact-btn mobile-whatsapp-btn"
          >
            <MessageCircle size={16} />
            <span>WhatsApp</span>
          </a>
        </div>

      </section>

      <Featured />

      {/* About + Carousel */}
      <div className="hero-container-2">
        <BlurText
          text="About"
          delay={200}
          animateBy="letters"
          direction="top"
          className="hero-title-2"
        />

        <p className="hero-subtitle text-sm">
          At Panna Music, we believe in more than just products — we deliver
          experiences. Since 1988, our goal has been to bring authentic
          electronics, trusted repairs, and unmatched customer care to every
          home.
        </p>

        <div className="carousel-container">
          <div className="carousel-track">
            {allImages.map((img, index) => (
              <div
                key={index}
                className={`carousel-item ${index === carouselIndex ? "active" : "hidden"}`}
              >
                <img src={img} alt="" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
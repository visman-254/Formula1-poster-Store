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
  cafe, greencap, green, marsal, pot, redcap
];

const numAllImages = allImages.length;
const getRandomIndex = (length) => Math.floor(Math.random() * length);

const Hero = () => {
  const [heroSlides, setHeroSlides] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [nextHeroIndex, setNextHeroIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const getNextRandomIndex = (current, length) => {
    let newIndex;
    do {
      newIndex = getRandomIndex(length);
    } while (newIndex === current && length > 1);
    return newIndex;
  };

  /* fetch hero slides */
  useEffect(() => {
    const fetchSlides = async () => {
      const data = await getHeroSlides();
      if (data?.length) {
        const start = getRandomIndex(data.length);
        setHeroSlides(data);
        setCurrentHeroIndex(start);
        setNextHeroIndex(getNextRandomIndex(start, data.length));
      }
    };
    fetchSlides();
  }, []);

  /* hero slideshow */
  useEffect(() => {
    if (!heroSlides.length || isPaused) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentHeroIndex(nextHeroIndex);
        setNextHeroIndex(
          getNextRandomIndex(nextHeroIndex, heroSlides.length)
        );
        setIsFading(false);
      }, 800);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroSlides, nextHeroIndex, isPaused]);

  /* carousel */
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % numAllImages);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentSlide = heroSlides[currentHeroIndex];
  const nextSlide = heroSlides[nextHeroIndex];

  return (
    <>
      <section className="hero-container">
        <div className="hero-img-wrapper">


          {/* ✅ FLOATING CONTACT BUTTONS */}
          <div className="floating-contact-buttons">
            <a 
              href="tel:+254712133135" 
              className="contact-float-button call-button"
            >
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

          {currentSlide && nextSlide && (
            <>
              {isPaused ? (
                <Play className="pause-icon" onClick={() => setIsPaused(false)} />
              ) : (
                <Pause className="pause-icon" onClick={() => setIsPaused(true)} />
              )}

              <img
                src={nextSlide.image_url}
                alt={nextSlide.title}
                className={`hero-img next-slide ${isFading ? "active" : ""}`}
              />

              <img
                src={currentSlide.image_url}
                alt={currentSlide.title}
                className={`hero-img current-slide ${
                  isFading ? "fading-out" : "active"
                }`}
              />

              {/* HERO TEXT OVERLAY */}
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

                <Link to="/products">
                  <Button className="shop shop-now-button mt-6">
                    <ShoppingBag className="shop-icon" size={20} />
                    Visit Shop
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Featured />

      {/* ABOUT + CAROUSEL (UNCHANGED) */}
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
            {allImages.map((img, index) => {
              let cls = "carousel-item";
              if (index === carouselIndex) cls += " active";
              else if (
                index === (carouselIndex + 1) % numAllImages ||
                index === (carouselIndex - 1 + numAllImages) % numAllImages
              )
                cls += " side";
              else cls += " hidden";

              return (
                <div className={cls} key={index}>
                  <img src={img} alt="" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
import React, { useState, useEffect } from "react";
import "./Carousel.css";

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

const Carousel = () => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const carouselInterval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % numAllImages);
    }, 3000);
    return () => clearInterval(carouselInterval);
  }, []);

  return (
    <div className="carousel-container">
      <div className="carousel-track">
        {allImages.map((img, index) => {
          let className = "carousel-item";
          if (index === carouselIndex) className += " active";
          else if (
            index === (carouselIndex + 1) % numAllImages ||
            index === (carouselIndex - 1 + numAllImages) % numAllImages
          ) {
            className += " side";
          } else {
            className += " hidden";
          }
          return (
            <div className={className} key={index}>
              <img src={img} alt={`carousel-${index}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Carousel;

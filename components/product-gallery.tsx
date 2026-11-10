
"use client";

import { useState } from "react";

type Props = {
  name: string;
  image: string;
  gallery?: string[];
};

export function ProductGallery({
  name,
  image,
  gallery = []
}: Props) {
  const images = [
    image,
    ...gallery.filter(url => url !== image)
  ];

  const [current, setCurrent] = useState(0);

  return (
    <div className="product-gallery-wrap">
      <div className="product-gallery">
        <img
          src={images[current] || image}
          alt={`${name} — marketing photo ${current + 1}`}
        />
      </div>

      <div className="product-gallery-caption">
        <span>CAMPAIGN PHOTOGRAPHY</span>

        <span>
          {String(current + 1).padStart(2, "0")}
          {" / "}
          {String(images.length).padStart(2, "0")}
        </span>
      </div>

      {images.length > 1 && (
        <div className="product-thumbnails">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              className={
                index === current ? "active" : ""
              }
              aria-label={`View photo ${index + 1}`}
              aria-pressed={index === current}
              onClick={() => setCurrent(index)}
            >
              <img
                src={url}
                alt=""
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";

export type TestimonialItem = {
  id: string;
  name: string;
  quote: string;
};

export default function Testimonials({ items }: { items: TestimonialItem[] }) {
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    swiperRef.current?.update();
  }, [items]);

  if (!items.length) {
    return <p className="text-center text-[var(--text-muted)]">Testimonials coming soon.</p>;
  }

  return (
    <Swiper
      className="swiper testimonials-slider fade-up"
      modules={[Autoplay]}
      slidesPerView={1}
      spaceBetween={30}
      grabCursor
      loop={items.length > 1}
      speed={800}
      autoplay={{
        delay: 4000,
        disableOnInteraction: true,
      }}
      breakpoints={{
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
      onSwiper={(s) => {
        swiperRef.current = s;
      }}
    >
      {items.map((t) => (
        <SwiperSlide key={t.id}>
          <div className="testimonial-card">
            <div className="quote-icon">
              <i className="fas fa-quote-left" />
            </div>
            <p className="testimonial-text">&quot;{t.quote}&quot;</p>
            <h4 className="testimonial-name">{t.name}</h4>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

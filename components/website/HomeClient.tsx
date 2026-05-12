"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import VanillaTilt from "vanilla-tilt";
import Gallery, { type GalleryItem } from "@/components/website/Gallery";
import Testimonials, { type TestimonialItem } from "@/components/website/Testimonials";
import ContactForm from "@/components/website/ContactForm";

const HeroWebGL = dynamic(() => import("@/components/website/HeroWebGL"), { ssr: false });

const LOGO_URL =
  "https://arnav-sharma437.github.io/Katoch-Organic-Farm/images/logo.jpg";

const JOURNEY_STEPS = [
  {
    year: "2017",
    text: "Farm founded in Kangra with a mission for organic excellence.",
    image:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
  },
  {
    year: "2019",
    text: "Expanded to 10+ acres. Introduced regenerative farming techniques.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  },
  {
    year: "2021",
    text: "Launched school tours and farmer collaboration workshops.",
    image: "https://images.unsplash.com/photo-1592982537447-6f2a6a0c5c10?auto=format&fit=crop&w=800&q=80",
  },
  {
    year: "2023",
    text: "Recognised as model organic farm in Himachal Pradesh.",
    image: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=800&q=80",
  },
  {
    year: "2026",
    text: "Working towards making India a Global Food Bowl.",
    image: "https://images.unsplash.com/photo-1595804561066-51ed7d3eb84e?auto=format&fit=crop&w=800&q=80",
  },
] as const;

type Props = {
  gallery: GalleryItem[];
  testimonials: TestimonialItem[];
};

export default function HomeClient({ gallery, testimonials }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);

      const fadeUpElements = document.querySelectorAll(".fade-up");
      fadeUpElements.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      const timelineItems = document.querySelectorAll(".timeline-item");
      timelineItems.forEach((item, index) => {
        const direction = index % 2 === 0 ? 50 : -50;
        gsap.fromTo(
          item,
          { x: direction, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 80%",
            },
          }
        );
      });

      const timelineItemsList = document.querySelectorAll(".timeline-item");
      const timelinePreview = document.getElementById("timeline-preview");

      if (timelineItemsList.length > 0 && timelinePreview) {
        gsap.set(timelinePreview, { xPercent: 10, yPercent: -50 });

        timelineItemsList.forEach((item) => {
          item.addEventListener("mouseenter", () => {
            const imageUrl = item.getAttribute("data-image");
            if (imageUrl) {
              timelinePreview.style.backgroundImage = `url('${imageUrl}')`;
              timelinePreview.classList.add("active");
            }
          });

          item.addEventListener("mousemove", (e) => {
            const ev = e as MouseEvent;
            gsap.to(timelinePreview, {
              left: ev.clientX,
              top: ev.clientY,
              duration: 0.5,
              ease: "power2.out",
            });
          });

          item.addEventListener("mouseleave", () => {
            timelinePreview.classList.remove("active");
          });
        });
      }
    }
  }, []);

  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const onScroll = () => {
      if (!navbar) return;
      if (window.scrollY > 50) navbar.classList.add("scrolled");
      else navbar.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const themeToggle = document.getElementById("themeToggle");
    const htmlElement = document.documentElement;
    const themeIcon = themeToggle?.querySelector("i");

    const savedTheme = localStorage.getItem("theme") || "light";
    htmlElement.setAttribute("data-theme", savedTheme);
    function updateThemeIcon(theme: string) {
      if (!themeIcon) return;
      themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
    updateThemeIcon(savedTheme);

    const onClick = () => {
      const currentTheme = htmlElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      htmlElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      updateThemeIcon(newTheme);
      window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
    };

    themeToggle?.addEventListener("click", onClick);
    return () => themeToggle?.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".stat-card[data-tilt], .value-card[data-tilt]"));
    VanillaTilt.init(nodes, {
      max: 15,
      speed: 400,
      glare: true,
      "max-glare": 0.2,
      scale: 1.02,
    });
    return () => {
      nodes.forEach((el) => {
        const vt = (el as HTMLElement & { vanillaTilt?: { destroy: () => void } }).vanillaTilt;
        vt?.destroy?.();
      });
    };
  }, []);

  return (
    <>
      <nav className="navbar" id="navbar">
        <div className="nav-container">
          <Link href="#home" className="logo">
            <Image
              src={LOGO_URL}
              alt="Katoch Organic Farm Logo"
              width={160}
              height={100}
              priority
              className="logo-img"
              sizes="(max-width: 768px) 120px, 160px"
            />
          </Link>
          <ul className="nav-links">
            <li>
              <Link href="#home">Home</Link>
            </li>
            <li>
              <Link href="#about">About</Link>
            </li>
            <li>
              <Link href="#contact">Contact Us</Link>
            </li>
          </ul>
          <div className="nav-actions">
            <button className="theme-toggle" id="themeToggle" type="button" aria-label="Toggle Theme">
              <i className="fas fa-moon" />
            </button>
            <a href="https://wa.me/917807232423" className="btn btn-nav">
              <i className="fab fa-whatsapp" /> <span className="hide-mobile">Contact on WhatsApp</span>
            </a>
            <button
              type="button"
              className="hamburger"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`mobile-menu-overlay${menuOpen ? " active" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <div className={`mobile-menu${menuOpen ? " active" : ""}`}>
        <button type="button" className="mobile-menu-close" onClick={() => setMenuOpen(false)}>
          &times;
        </button>
        <ul className="mobile-nav-links">
          <li>
            <Link href="#home" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link href="#about" onClick={() => setMenuOpen(false)}>
              About
            </Link>
          </li>
          <li>
            <Link href="#contact" onClick={() => setMenuOpen(false)}>
              Contact Us
            </Link>
          </li>
        </ul>
      </div>

      <section id="home" className="hero">
        <HeroWebGL />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="badge fade-up">Farming Innovation &middot; Est. 2017</div>
          <h1 className="fade-up">
            Katoch Organic Farm
            <br />
            <span>Cultivating Purity.</span>
            <br />
            <span>Harvesting Health</span>
          </h1>
          <p className="fade-up">Located in the pristine landscapes of Himachal Pradesh &middot; Kangra</p>
          <div className="hero-btns fade-up">
            <a href="#about" className="btn btn-primary">
              Explore More
            </a>
            <a href="#contact" className="btn btn-secondary">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="our-story section-padding">
        <div className="container">
          <div className="section-header fade-up">
            <h2>Who We Are</h2>
            <div className="line" />
          </div>

          <div className="story-grid">
            <div className="story-text fade-up">
              <p className="lead-text">
                &quot;Katoch Organic Farm was started in 2017 with a simple but powerful goal: to restore farming
                back to its organic roots while also using new technology. Our farm is in the lush slopes of Kangra,
                near Pathankot.&quot;
              </p>

              <h3 className="subheading">Our Missions</h3>
              <ul className="mission-list">
                <li>
                  <i className="fas fa-check-circle" /> To sell organic fruits and vegetables that are safe,
                  traceable, and good for the environment.
                </li>
                <li>
                  <i className="fas fa-check-circle" /> To use farming methods that protect soil health, save water, and
                  promote biodiversity.
                </li>
                <li>
                  <i className="fas fa-check-circle" /> To help local farmers learn about regenerative agriculture and
                  give them the tools they need.
                </li>
              </ul>
            </div>

            <div className="story-stats fade-up">
              <div className="stat-card" data-tilt>
                <div className="stat-item">
                  <span className="stat-number">2017</span>
                  <span className="stat-label">Est. Year</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">10+</span>
                  <span className="stat-label">Acres of Farm</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Chemical-Free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="core-values section-padding bg-darker">
        <div className="container">
          <div className="section-header fade-up">
            <h2>Our Core Values</h2>
            <div className="line" />
          </div>

          <div className="values-grid">
            {[
              { icon: "fa-heartbeat", title: "Health & Safety", text: "Prioritizing the well-being of our consumers through pure, chemical-free produce." },
              { icon: "fa-medal", title: "Quality", text: "Delivering excellence in every harvest with strict organic standards." },
              { icon: "fa-handshake", title: "Integrity", text: "Transparent farming practices and honest relationships with our community." },
              { icon: "fa-seedling", title: "Responsibility", text: "Taking accountability for our environmental impact and ecological footprint." },
              { icon: "fa-users", title: "Collaboration", text: "Working together with local farmers to build a sustainable agricultural ecosystem." },
              { icon: "fa-globe-asia", title: "Sustainability", text: "Nurturing the earth today to ensure abundance for future generations." },
            ].map((v) => (
              <div key={v.title} className="value-card fade-up" data-tilt>
                <div className="icon-box">
                  <i className={`fas ${v.icon}`} />
                </div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gallery section-padding">
        <div className="container">
          <div className="section-header fade-up">
            <h2>3D Gallery</h2>
            <div className="line" />
          </div>
          <Gallery items={gallery} />
        </div>
      </section>

      <section className="journey section-padding bg-darker">
        <div className="container">
          <div className="section-header fade-up">
            <h2>Our Journey</h2>
            <div className="line" />
          </div>

          <div className="timeline">
            <div id="timeline-preview" className="timeline-preview" />
            {JOURNEY_STEPS.map((step) => (
              <div key={step.year} className="timeline-item fade-up" data-image={step.image}>
                <div className="timeline-dot" />
                <div className="timeline-date">{step.year}</div>
                <div className="timeline-content">
                  <div className="timeline-mobile-visual">
                    <Image
                      src={step.image}
                      alt={`${step.year} — farm journey photo`}
                      width={800}
                      height={500}
                      className="timeline-mobile-thumb"
                      sizes="(max-width: 768px) 90vw, 0px"
                    />
                  </div>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
            <div className="timeline-line" />
          </div>
        </div>
      </section>

      <section className="testimonials section-padding">
        <div className="container">
          <div className="section-header fade-up">
            <h2>Testimonials</h2>
            <div className="line" />
          </div>
          <Testimonials items={testimonials} />
        </div>
      </section>

      <section id="contact" className="contact section-padding bg-darker">
        <div className="container">
          <div className="section-header fade-up">
            <h2>Get In Touch</h2>
            <div className="line" />
          </div>

          <div className="contact-grid">
            <div className="contact-info fade-up">
              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-map-marker-alt" />
                </div>
                <div className="info-content">
                  <h3>Address</h3>
                  <p>
                    Bain Indorian Teh Indora Po Kathgarh
                    <br />
                    Dist Kangra, 176401, Himachal Pradesh
                  </p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-envelope" />
                </div>
                <div className="info-content">
                  <h3>Email</h3>
                  <a href="mailto:katochorganic0024@gmail.com">katochorganic0024@gmail.com</a>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <i className="fas fa-phone-alt" />
                </div>
                <div className="info-content">
                  <h3>Phone</h3>
                  <a href="tel:+917807232423">+91 78072 32423</a>
                </div>
              </div>

              <div className="social-links mt-4">
                <a href="#" className="social-btn" aria-label="Facebook">
                  <i className="fab fa-facebook-f" />
                </a>
                <a href="#" className="social-btn" aria-label="Instagram">
                  <i className="fab fa-instagram" />
                </a>
                <a href="https://wa.me/917807232423" className="social-btn" aria-label="WhatsApp">
                  <i className="fab fa-whatsapp" />
                </a>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h2>KOF</h2>
              <p>Katoch Organic Farm</p>
              <p className="footer-desc">
                Restoring farming back to its organic roots while embracing modern, sustainable technology.
              </p>
            </div>
            <div className="footer-links">
              <h3>Quick Links</h3>
              <ul>
                <li>
                  <Link href="#home">Home</Link>
                </li>
                <li>
                  <Link href="#about">About Us</Link>
                </li>
                <li>
                  <Link href="#contact">Contact</Link>
                </li>
              </ul>
            </div>
            <div className="footer-contact">
              <h3>Contact Details</h3>
              <p>
                <i className="fas fa-map-marker-alt" /> Kangra, Himachal Pradesh
              </p>
              <p>
                <i className="fas fa-phone-alt" /> +91 78072 32423
              </p>
              <p>
                <i className="fas fa-envelope" /> katochorganic0024@gmail.com
              </p>
            </div>
            <div className="footer-social">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="#" className="social-btn" aria-label="Facebook">
                  <i className="fab fa-facebook-f" />
                </a>
                <a href="#" className="social-btn" aria-label="Instagram">
                  <i className="fab fa-instagram" />
                </a>
                <a href="https://wa.me/917807232423" className="social-btn" aria-label="WhatsApp">
                  <i className="fab fa-whatsapp" />
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Katoch Organic Farm. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

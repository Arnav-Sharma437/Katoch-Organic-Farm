/**
 * Katoch Organic Farm - Interactions & 3D WebGL Scene
 */

// ==========================================================================
// Three.js Anti-Gravity Scene
// ==========================================================================
class AntiGravityScene {
    constructor() {
        this.container = document.getElementById('webgl-container');
        if (!this.container) return;

        // Configuration
        this.config = {
            particleCount: window.innerWidth < 768 ? 50 : 150,
            leafCount: window.innerWidth < 768 ? 20 : 60,
            colors: [0x6fcf7a, 0x5abd65, 0x8ef098, 0xffffff],
            mouseMultiplier: 0.0005
        };

        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.clock = new THREE.Clock();

        this.init();
        this.createParticles();
        this.createLeaves();
        this.addLights();
        this.setupEvents();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x121212, 0.0015);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 100;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Groups for organization
        this.particleGroup = new THREE.Group();
        this.leafGroup = new THREE.Group();
        this.scene.add(this.particleGroup);
        this.scene.add(this.leafGroup);
    }

    createTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(111, 207, 122, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createLeafTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#6fcf7a';
        ctx.beginPath();
        ctx.moveTo(32, 10);
        ctx.bezierCurveTo(55, 25, 55, 45, 32, 55);
        ctx.bezierCurveTo(9, 45, 9, 25, 32, 10);
        ctx.fill();
        
        // Leaf vein
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 10);
        ctx.lineTo(32, 53);
        ctx.stroke();
        
        return new THREE.CanvasTexture(canvas);
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.config.particleCount * 3);
        
        for (let i = 0; i < this.config.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 400; // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 400; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 400; // z
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 3,
            map: this.createTexture(),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0xffffff
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particleGroup.add(this.particles);
        
        // Add random velocities for particles
        this.particles.userData = {
            velocities: []
        };
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.userData.velocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.1
            });
        }
    }

    createLeaves() {
        const leafGeometry = new THREE.PlaneGeometry(3, 3);
        const leafTexture = this.createLeafTexture();
        this.leaves = [];
        
        for (let i = 0; i < this.config.leafCount; i++) {
            const material = new THREE.MeshLambertMaterial({
                map: leafTexture,
                transparent: true,
                side: THREE.DoubleSide,
                alphaTest: 0.1,
                color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)]
            });
            
            const leaf = new THREE.Mesh(leafGeometry, material);
            
            // Random positions
            leaf.position.x = (Math.random() - 0.5) * 300;
            leaf.position.y = (Math.random() - 0.5) * 300;
            leaf.position.z = (Math.random() - 0.5) * 300;
            
            // Random rotations
            leaf.rotation.x = Math.random() * Math.PI;
            leaf.rotation.y = Math.random() * Math.PI;
            leaf.rotation.z = Math.random() * Math.PI;
            
            // Random scales
            const scale = Math.random() * 0.8 + 0.4;
            leaf.scale.set(scale, scale, scale);
            
            // Custom data for animation
            leaf.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ),
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                )
            };
            
            this.leaves.push(leaf);
            this.leafGroup.add(leaf);
        }
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);
        
        const greenLight = new THREE.PointLight(0x6fcf7a, 2, 200);
        greenLight.position.set(0, 0, 50);
        this.scene.add(greenLight);
    }

    setupEvents() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.targetX = (event.clientX - window.innerWidth / 2);
        this.mouse.targetY = (event.clientY - window.innerHeight / 2);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const time = this.clock.getElapsedTime();
        
        // Smooth mouse easing
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
        
        // Camera parallax based on mouse
        this.camera.position.x = this.mouse.x * 0.05;
        this.camera.position.y = -this.mouse.y * 0.05;
        this.camera.lookAt(this.scene.position);
        
        // Rotate groups slowly
        this.particleGroup.rotation.y = time * 0.05;
        this.leafGroup.rotation.y = time * 0.03;
        this.leafGroup.rotation.z = time * 0.02;
        
        // Animate particles
        const positions = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < this.config.particleCount; i++) {
            const i3 = i * 3;
            const vel = this.particles.userData.velocities[i];
            
            positions[i3] += vel.x;
            positions[i3 + 1] += vel.y;
            positions[i3 + 2] += vel.z;
            
            // Gentle bounds wrapping
            if (positions[i3] > 200 || positions[i3] < -200) vel.x *= -1;
            if (positions[i3 + 1] > 200 || positions[i3 + 1] < -200) vel.y *= -1;
            if (positions[i3 + 2] > 200 || positions[i3 + 2] < -200) vel.z *= -1;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        // Animate leaves
        this.leaves.forEach(leaf => {
            leaf.position.add(leaf.userData.velocity);
            leaf.rotation.x += leaf.userData.rotationSpeed.x;
            leaf.rotation.y += leaf.userData.rotationSpeed.y;
            leaf.rotation.z += leaf.userData.rotationSpeed.z;
            
            // Soft bounds wrap
            if (leaf.position.length() > 250) {
                leaf.position.set(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100
                );
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

// ==========================================================================
// General UI Interactions
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize Three.js Scene
    new AntiGravityScene();
    
    // 2. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const closeBtn = document.querySelector('.mobile-menu-close');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

    function toggleMenu() {
        if (mobileMenu && overlay) {
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    }

    if (hamburger) hamburger.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', toggleMenu);
    
    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });

    // 4. GSAP Scroll Animations
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Fade Up Elements
        const fadeUpElements = document.querySelectorAll('.fade-up');
        fadeUpElements.forEach((el) => {
            gsap.fromTo(el, 
                { 
                    y: 50, 
                    opacity: 0 
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // Timeline Animation
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            const direction = index % 2 === 0 ? 50 : -50;
            gsap.fromTo(item,
                { x: direction, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: item,
                        start: "top 80%"
                    }
                }
            );
        });

        // Testimonials Horizontal Scroll using Swiper
        if (window.Swiper) {
            new Swiper('.testimonials-slider', {
                slidesPerView: 1,
                spaceBetween: 30,
                grabCursor: true,
                loop: true,
                speed: 800,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: true,
                },
                breakpoints: {
                    768: {
                        slidesPerView: 2,
                    },
                    1024: {
                        slidesPerView: 3,
                    }
                }
            });
        }

        // Interactive Timeline Preview using GSAP
        const timelineItemsList = document.querySelectorAll('.timeline-item');
        const timelinePreview = document.getElementById('timeline-preview');
        
        if (timelineItemsList.length > 0 && timelinePreview) {
            // Center the preview offset initially
            gsap.set(timelinePreview, { xPercent: 10, yPercent: -50 });

            timelineItemsList.forEach(item => {
                item.addEventListener('mouseenter', (e) => {
                    const imageUrl = item.getAttribute('data-image');
                    if (imageUrl) {
                        timelinePreview.style.backgroundImage = `url('${imageUrl}')`;
                        timelinePreview.classList.add('active'); // CSS handles scale/opacity
                    }
                });

                item.addEventListener('mousemove', (e) => {
                    // Update position smoothly with GSAP QuickTo or to
                    gsap.to(timelinePreview, {
                        left: e.clientX,
                        top: e.clientY,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                });

                item.addEventListener('mouseleave', () => {
                    timelinePreview.classList.remove('active');
                });
            });
        }
    }

    // 5. Vanilla Tilt Initialization
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
            scale: 1.02
        });
    }

    // 6. Form Submission (Prevent default for demonstration)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';
            btn.style.opacity = '0.7';
            
            // Simulate API call
            setTimeout(() => {
                btn.innerText = 'Message Sent!';
                btn.style.backgroundColor = '#5abd65';
                btn.style.opacity = '1';
                contactForm.reset();
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = '';
                }, 3000);
            }, 1500);
        });
    }
});

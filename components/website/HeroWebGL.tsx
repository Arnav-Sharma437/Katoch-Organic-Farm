"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroWebGL() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    class AntiGravityScene {
      container: HTMLDivElement;
      config: {
        particleCount: number;
        leafCount: number;
        colors: number[];
        mouseMultiplier: number;
      };
      mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
      clock = new THREE.Clock();
      scene!: THREE.Scene;
      camera!: THREE.PerspectiveCamera;
      renderer!: THREE.WebGLRenderer;
      particleGroup!: THREE.Group;
      leafGroup!: THREE.Group;
      particles!: THREE.Points;
      leaves: THREE.Mesh[] = [];

      constructor(containerEl: HTMLDivElement) {
        this.container = containerEl;
        this.config = {
          particleCount: window.innerWidth < 768 ? 50 : 150,
          leafCount: window.innerWidth < 768 ? 20 : 60,
          colors: [0x6fcf7a, 0x5abd65, 0x8ef098, 0xffffff],
          mouseMultiplier: 0.0005,
        };
        this.init();
        this.createParticles();
        this.createLeaves();
        this.addLights();
        this.setupEvents();
        this.animate();
      }

      init() {
        this.scene = new THREE.Scene();
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        this.scene.fog = new THREE.FogExp2(isDark ? 0x121212 : 0xf0f7f2, 0.0015);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 100;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.particleGroup = new THREE.Group();
        this.leafGroup = new THREE.Group();
        this.scene.add(this.particleGroup);
        this.scene.add(this.leafGroup);
      }

      createTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d")!;
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(0.5, "rgba(111, 207, 122, 0.2)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
      }

      createLeafTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#6fcf7a";
        ctx.beginPath();
        ctx.moveTo(32, 10);
        ctx.bezierCurveTo(55, 25, 55, 45, 32, 55);
        ctx.bezierCurveTo(9, 45, 9, 25, 32, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
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
          positions[i * 3] = (Math.random() - 0.5) * 400;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
        }
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
          size: 3,
          map: this.createTexture(),
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          color: 0xffffff,
        });
        this.particles = new THREE.Points(geometry, material);
        this.particleGroup.add(this.particles);
        this.particles.userData = {
          velocities: [] as { x: number; y: number; z: number }[],
        };
        for (let i = 0; i < this.config.particleCount; i++) {
          this.particles.userData.velocities.push({
            x: (Math.random() - 0.5) * 0.1,
            y: (Math.random() - 0.5) * 0.1,
            z: (Math.random() - 0.5) * 0.1,
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
            color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
          });
          const leaf = new THREE.Mesh(leafGeometry, material);
          leaf.position.x = (Math.random() - 0.5) * 300;
          leaf.position.y = (Math.random() - 0.5) * 300;
          leaf.position.z = (Math.random() - 0.5) * 300;
          leaf.rotation.x = Math.random() * Math.PI;
          leaf.rotation.y = Math.random() * Math.PI;
          leaf.rotation.z = Math.random() * Math.PI;
          const scale = Math.random() * 0.8 + 0.4;
          leaf.scale.set(scale, scale, scale);
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
            ),
          };
          this.leaves.push(leaf);
          this.leafGroup.add(leaf);
        }
      }

      addLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);
        const greenLight = new THREE.PointLight(0x6fcf7a, 2, 200);
        greenLight.position.set(0, 0, 50);
        this.scene.add(greenLight);
      }

      onWindowResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      };

      onMouseMove = (event: MouseEvent) => {
        this.mouse.targetX = event.clientX - window.innerWidth / 2;
        this.mouse.targetY = event.clientY - window.innerHeight / 2;
      };

      setupEvents() {
        window.addEventListener("resize", this.onWindowResize);
        document.addEventListener("mousemove", this.onMouseMove);
      }

      cleanupEvents() {
        window.removeEventListener("resize", this.onWindowResize);
        document.removeEventListener("mousemove", this.onMouseMove);
      }

      raf = 0;

      animate = () => {
        this.raf = requestAnimationFrame(this.animate);
        const time = this.clock.getElapsedTime();
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
        this.camera.position.x = this.mouse.x * 0.05;
        this.camera.position.y = -this.mouse.y * 0.05;
        this.camera.lookAt(this.scene.position);
        this.particleGroup.rotation.y = time * 0.05;
        this.leafGroup.rotation.y = time * 0.03;
        this.leafGroup.rotation.z = time * 0.02;

        const positions = this.particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < this.config.particleCount; i++) {
          const i3 = i * 3;
          const vel = this.particles.userData.velocities[i];
          positions[i3] += vel.x;
          positions[i3 + 1] += vel.y;
          positions[i3 + 2] += vel.z;
          if (positions[i3] > 200 || positions[i3] < -200) vel.x *= -1;
          if (positions[i3 + 1] > 200 || positions[i3 + 1] < -200) vel.y *= -1;
          if (positions[i3 + 2] > 200 || positions[i3 + 2] < -200) vel.z *= -1;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;

        this.leaves.forEach((leaf) => {
          leaf.position.add(leaf.userData.velocity as THREE.Vector3);
          leaf.rotation.x += (leaf.userData.rotationSpeed as THREE.Vector3).x;
          leaf.rotation.y += (leaf.userData.rotationSpeed as THREE.Vector3).y;
          leaf.rotation.z += (leaf.userData.rotationSpeed as THREE.Vector3).z;
          if (leaf.position.length() > 250) {
            leaf.position.set(
              (Math.random() - 0.5) * 100,
              (Math.random() - 0.5) * 100,
              (Math.random() - 0.5) * 100
            );
          }
        });

        this.renderer.render(this.scene, this.camera);
      };

      dispose() {
        this.cleanupEvents();
        cancelAnimationFrame(this.raf);
        this.renderer.dispose();
        if (this.renderer.domElement.parentNode === this.container) {
          this.container.removeChild(this.renderer.domElement);
        }
      }

      onTheme = (e: Event) => {
        const detail = (e as CustomEvent<string>).detail;
        if (this.scene?.fog instanceof THREE.FogExp2) {
          const isDark = detail === "dark";
          this.scene.fog.color.setHex(isDark ? 0x121212 : 0xf0f7f2);
        }
      };
    }

    const scene = new AntiGravityScene(container);
    window.addEventListener("themeChanged", scene.onTheme as EventListener);

    return () => {
      window.removeEventListener("themeChanged", scene.onTheme as EventListener);
      scene.dispose();
    };
  }, []);

  return <div id="webgl-container" ref={containerRef} />;
}

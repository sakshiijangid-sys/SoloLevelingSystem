import { useEffect, useRef, useState } from 'react';
import { playRobotGiggleSound } from '../lib/soundEffects';

interface ThreeRobotAlertProps {
  className?: string;
  onAnimationReady?: () => void;
  onTickle?: (intensity: number) => void;
}

interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function ThreeRobotAlert({ className, onAnimationReady, onTickle }: ThreeRobotAlertProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Soft interactive state
  const [, setIsGiggling] = useState(false);

  // Refs for smooth 60fps render loop
  const giggleScoreRef = useRef(0); // 0.0 to 1.0
  const lastSoundTimeRef = useRef(0);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'w-full h-full object-contain drop-shadow-[0_12px_32px_rgba(168,85,247,0.35)] select-none pointer-events-auto cursor-default touch-none';
    container.innerHTML = '';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();
    let hasTriggeredReady = false;

    // Mouse tracking for perspective tilt & gentle tickling
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const canvasParticles: CanvasParticle[] = [];

    // Precise hit-testing: only trigger on the robot's face or tummy
    const isInsideFaceOrTummy = (clientX: number, clientY: number): boolean => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width <= 0 || height <= 0) return false;

      const baseScale = Math.min(width, height) / 130;
      const centerX = width / 2;
      const centerY = height / 2;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Map canvas pixel position to 120x120 robot coordinate system (center is at 60, 60)
      const robotX = 60 + (x - centerX) / baseScale;
      const robotY = 60 + (y - centerY) / baseScale;

      // 1. Robot Face Screen & Dome (centered at x: 60, y: 45)
      const faceDx = (robotX - 60) / 28;
      const faceDy = (robotY - 45) / 20;
      const isFace = (faceDx * faceDx + faceDy * faceDy) <= 1.0;

      // 2. Robot Tummy / Torso Belly (centered at x: 60, y: 82)
      const tummyDx = (robotX - 60) / 20;
      const tummyDy = (robotY - 82) / 14;
      const isTummy = (tummyDx * tummyDx + tummyDy * tummyDy) <= 1.0;

      return isFace || isTummy;
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouse.targetX = Math.max(-1, Math.min(1, (clientX - cx) / (rect.width * 0.7)));
      mouse.targetY = Math.max(-1, Math.min(1, (clientY - cy) / (rect.height * 0.7)));

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const now = performance.now();

      // Check whether cursor is directly over the robot's face or tummy
      const onRobotTarget = isInsideFaceOrTummy(clientX, clientY);
      canvas.style.cursor = onRobotTarget ? 'pointer' : 'default';

      // Measure scratch velocity
      let delta = 0;
      if (lastPointerPosRef.current) {
        const dx = x - lastPointerPosRef.current.x;
        const dy = y - lastPointerPosRef.current.y;
        delta = Math.sqrt(dx * dx + dy * dy);
      }
      lastPointerPosRef.current = { x, y };

      // Giggling triggers ONLY when moving upon the robot's face or tummy
      if (onRobotTarget && delta > 3) {
        // Gentle increase, capped smoothly
        giggleScoreRef.current = Math.min(1.0, giggleScoreRef.current + 0.12);
        setIsGiggling(true);
        if (onTickle) onTickle(Math.round(giggleScoreRef.current * 10));

        // Soft, slower sound timing (spaced out every ~520ms)
        if (now - lastSoundTimeRef.current > 520) {
          lastSoundTimeRef.current = now;
          playRobotGiggleSound(Math.min(1.2, 0.7 + giggleScoreRef.current * 0.4));
        }

        // Soft ambient glints on contact location
        if (Math.random() < 0.25) {
          const width = rect.width;
          const height = rect.height;
          const baseScale = Math.min(width, height) / 130;
          const rx = 60 + (x - width / 2) / baseScale;
          const ry = 60 + (y - height / 2) / baseScale;

          canvasParticles.push({
            x: rx + (Math.random() - 0.5) * 8,
            y: ry + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -0.4 - Math.random() * 0.5,
            life: 0,
            maxLife: 45 + Math.random() * 20,
            color: Math.random() > 0.5 ? '#F472B6' : '#C084FC',
            size: 1.5 + Math.random() * 1.5,
          });
        }
      }
    };

    const handlePointerTap = (clientX: number, clientY: number) => {
      // Tap triggers only on the robot's face or tummy
      if (!isInsideFaceOrTummy(clientX, clientY)) return;

      giggleScoreRef.current = Math.min(1.0, giggleScoreRef.current + 0.45);
      setIsGiggling(true);
      playRobotGiggleSound(0.9);

      for (let i = 0; i < 4; i++) {
        canvasParticles.push({
          x: 60 + (Math.random() - 0.5) * 20,
          y: 65 + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.5 - Math.random() * 0.6,
          life: 0,
          maxLife: 40 + Math.random() * 20,
          color: i % 2 === 0 ? '#F472B6' : '#67E8F9',
          size: 2 + Math.random() * 1.5,
        });
      }
    };

    const onCanvasMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onCanvasTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onCanvasClick = (e: MouseEvent) => {
      handlePointerTap(e.clientX, e.clientY);
    };

    const onCanvasMouseLeave = () => {
      lastPointerPosRef.current = null;
      canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('touchmove', onCanvasTouchMove, { passive: true });
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('mouseleave', onCanvasMouseLeave);

    // Sparkle halo particles
    const haloParticles = Array.from({ length: 14 }, (_, i) => ({
      angle: (i / 14) * Math.PI * 2,
      dist: 58 + Math.random() * 22,
      speed: 0.3 + Math.random() * 0.4, // Slower orbit
      size: 1.4 + Math.random() * 1.8,
      color: i % 3 === 0 ? '#F472B6' : (i % 2 === 0 ? '#FDE047' : '#67E8F9'),
      phase: Math.random() * Math.PI * 2,
    }));

    // Ease-out back for entrance
    const easeOutBack = (x: number): number => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    // Render loop
    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const width = container.clientWidth || 320;
      const height = container.clientHeight || 320;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      // Slower, softer decay of giggle score
      if (giggleScoreRef.current > 0.005) {
        giggleScoreRef.current = Math.max(0, giggleScoreRef.current - 0.007);
      } else if (giggleScoreRef.current > 0) {
        giggleScoreRef.current = 0;
        setIsGiggling(false);
      }

      const giggleFactor = giggleScoreRef.current; // 0 to 1

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Entrance animation
      const enterDuration = 1.1;
      const enterProgress = Math.min(1, elapsed / enterDuration);
      const enterFactor = easeOutBack(enterProgress);

      if (enterProgress >= 0.95 && !hasTriggeredReady) {
        hasTriggeredReady = true;
        if (onAnimationReady) onAnimationReady();
      }

      // SOFTER & SLOWER GIGGLE DYNAMICS:
      // Slower cadence: 7.5 Hz (instead of 24 Hz)
      // Softer bounce: 2.2px (instead of 8.5px)
      // Gentle squash: 2.8% (instead of 13%)
      const laughSpeed = 7.5;
      const giggleBounceY = Math.sin(elapsed * laughSpeed) * 2.2 * giggleFactor;
      const giggleTilt = Math.sin(elapsed * 5.0) * 0.035 * giggleFactor;
      const giggleSquashX = 1 + Math.sin(elapsed * laughSpeed) * 0.028 * giggleFactor;
      const giggleSquashY = 1 - Math.sin(elapsed * laughSpeed) * 0.028 * giggleFactor;

      // Base translation & scale (target viewBox is 120x120)
      const baseScale = (Math.min(width, height) / 130) * Math.min(1, 0.15 + 0.85 * enterFactor);
      const centerX = width / 2;
      const enterYOffset = (1 - enterFactor) * 120;
      const floatY = Math.sin(elapsed * 2.8) * 3.2; // Slower, softer hover
      const floatTilt = Math.sin(elapsed * 1.8) * 0.03;
      const centerY = height / 2 + enterYOffset + floatY + giggleBounceY;

      ctx.translate(centerX, centerY);
      ctx.scale(baseScale * giggleSquashX, baseScale * giggleSquashY);
      ctx.rotate(floatTilt + mouse.x * 0.06 + giggleTilt);

      // Map center from SVG coordinates (60, 60 is center)
      ctx.translate(-60, -60);

      // Dynamic states
      const blinkCycle = elapsed % 4.6;
      let blinkScale = 1.0;
      if (blinkCycle > 4.35 && blinkCycle < 4.55) {
        const p = (blinkCycle - 4.35) / 0.2;
        blinkScale = Math.sin(p * Math.PI) * -0.9 + 1.0;
      }

      const heartPulse = (1 + Math.sin(elapsed * (5 + giggleFactor * 3)) * (0.14 + giggleFactor * 0.08));
      const thrusterPulse = 1 + Math.sin(elapsed * 14) * 0.12;

      // Gradients Setup
      const whiteChassisGrad = ctx.createLinearGradient(20, 15, 100, 100);
      whiteChassisGrad.addColorStop(0, '#FFFFFF');
      whiteChassisGrad.addColorStop(0.55, '#FAF8FF');
      whiteChassisGrad.addColorStop(1, '#DDD6FE');

      const blackScreenGrad = ctx.createLinearGradient(30, 28, 90, 64);
      blackScreenGrad.addColorStop(0, '#05020c');
      blackScreenGrad.addColorStop(0.6, '#0a0618');
      blackScreenGrad.addColorStop(1, '#150f2e');

      const glowEyeGrad = ctx.createLinearGradient(0, 34, 0, 52);
      glowEyeGrad.addColorStop(0, '#67E8F9');
      glowEyeGrad.addColorStop(1, '#38BDF8');

      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
      };

      // 1. FLOATING GROUND SHADOW
      ctx.save();
      const shadowPulse = 1 - (floatY + giggleBounceY) * 0.03;
      ctx.beginPath();
      ctx.ellipse(60, 113, 26 * shadowPulse, 4.5 * shadowPulse, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(88, 28, 135, 0.25)';
      ctx.fill();
      ctx.restore();

      // 2. HOVER THRUSTER NEON FLAME
      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 12 + giggleFactor * 4;
      ctx.beginPath();
      ctx.moveTo(48, 98);
      ctx.quadraticCurveTo(60, (112 + giggleFactor * 4) * thrusterPulse, 72, 98);
      ctx.quadraticCurveTo(60, 106, 48, 98);
      ctx.fillStyle = 'rgba(192, 132, 252, 0.9)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(52, 98);
      ctx.quadraticCurveTo(60, (108 + giggleFactor * 3) * thrusterPulse, 68, 98);
      ctx.quadraticCurveTo(60, 103, 52, 98);
      ctx.fillStyle = '#F472B6';
      ctx.fill();
      ctx.restore();

      // 3. FLOATING ARMS / PAWS (Slower, softer gentle wave)
      const leftArmWave = giggleFactor > 0.1
        ? Math.sin(elapsed * 7.5) * 0.16 * giggleFactor
        : Math.sin(elapsed * 3.2 + 1) * 0.12;

      const rightArmWave = giggleFactor > 0.1
        ? Math.cos(elapsed * 7.5) * 0.20 * giggleFactor
        : Math.sin(elapsed * 4.5) * 0.18 - 0.06;

      // Left Arm
      ctx.save();
      ctx.translate(26, 76);
      ctx.rotate(leftArmWave);
      ctx.translate(-26, -76);

      ctx.beginPath();
      ctx.moveTo(26, 74);
      ctx.bezierCurveTo(20, 78, 18, 86, 24, 92);
      ctx.bezierCurveTo(28, 96, 36, 93, 37, 86);
      ctx.bezierCurveTo(38, 80, 32, 72, 26, 74);
      ctx.closePath();
      ctx.fillStyle = whiteChassisGrad;
      ctx.fill();
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.ellipse(32, 80, 3.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#C084FC';
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(26.5, 86, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(244, 114, 182, 0.85)';
      ctx.fill();
      ctx.restore();

      // Right Arm
      ctx.save();
      ctx.translate(88, 80);
      ctx.rotate(rightArmWave);
      ctx.translate(-88, -80);

      ctx.beginPath();
      ctx.moveTo(94, 74);
      ctx.bezierCurveTo(100, 78, 102, 86, 96, 92);
      ctx.bezierCurveTo(92, 96, 84, 93, 83, 86);
      ctx.bezierCurveTo(82, 80, 88, 72, 94, 74);
      ctx.closePath();
      ctx.fillStyle = whiteChassisGrad;
      ctx.fill();
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.ellipse(88, 80, 3.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#C084FC';
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(93.5, 86, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(244, 114, 182, 0.85)';
      ctx.fill();
      ctx.restore();

      // 4. WHITE TORSO CAPSULE
      ctx.save();
      const torsoParallaxX = mouse.x * 0.8;
      const torsoParallaxY = mouse.y * 0.6;
      ctx.translate(torsoParallaxX, torsoParallaxY);

      drawRoundRect(39, 69, 42, 29, 14.5);
      ctx.fillStyle = whiteChassisGrad;
      ctx.fill();
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Purple Neon Trim around Belly Screen
      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 8 + giggleFactor * 4;
      drawRoundRect(44.5, 73, 31, 20, 9);
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      // Dark Belly Screen
      drawRoundRect(45.5, 74, 29, 18, 8);
      ctx.fillStyle = blackScreenGrad;
      ctx.fill();

      // Belly Heart Energy Core
      ctx.save();
      ctx.translate(60, 80);
      ctx.scale(heartPulse, heartPulse);
      ctx.translate(-60, -80);

      ctx.shadowColor = '#E879F9';
      ctx.shadowBlur = 8 + giggleFactor * 4;
      ctx.beginPath();
      ctx.moveTo(60, 86);
      ctx.bezierCurveTo(58, 83, 52, 83, 52, 79);
      ctx.bezierCurveTo(52, 76.5, 54.5, 75, 57, 75);
      ctx.bezierCurveTo(58.5, 75, 60, 76.5, 60, 76.5);
      ctx.bezierCurveTo(60, 76.5, 61.5, 75, 63, 75);
      ctx.bezierCurveTo(65.5, 75, 68, 76.5, 68, 79);
      ctx.bezierCurveTo(68, 83, 62, 83, 60, 86);
      ctx.closePath();
      ctx.fillStyle = '#F472B6';
      ctx.fill();
      ctx.restore();

      // Belly Status Dots
      ctx.save();
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(49, 89, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.fill();

      ctx.shadowColor = '#FDE047';
      ctx.beginPath();
      ctx.arc(71, 89, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FDE047';
      ctx.fill();
      ctx.restore();
      ctx.restore(); // end torso

      // 5. PURPLE NEON COLLAR LIGHT RING
      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(60, 69, 14, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#C084FC';
      ctx.fill();
      ctx.restore();

      // 6. WHITE HEADPHONE EARS
      ctx.save();
      const earParallax = mouse.x * -0.6;
      ctx.translate(earParallax, 0);

      // Left Ear
      drawRoundRect(11, 35, 13, 27, 6.5);
      ctx.fillStyle = whiteChassisGrad;
      ctx.fill();
      ctx.strokeStyle = '#DDD6FE';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(17.5, 48.5, 5.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(17.5, 48.5, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#F472B6';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(16.5, 47.5, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Right Ear
      drawRoundRect(96, 35, 13, 27, 6.5);
      ctx.fillStyle = whiteChassisGrad;
      ctx.fill();
      ctx.strokeStyle = '#DDD6FE';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(102.5, 48.5, 5.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(102.5, 48.5, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#F472B6';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(101.5, 47.5, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore(); // end ears

      // 7. HEAD ANTENNA (Gentle soft sway)
      ctx.save();
      const antennaWobble = Math.sin(elapsed * 7.5) * 0.7 * giggleFactor;
      const headParallaxX = mouse.x * 1.8 + antennaWobble;
      const headParallaxY = mouse.y * 1.2;
      ctx.translate(headParallaxX, headParallaxY);

      ctx.beginPath();
      ctx.moveTo(60, 16);
      ctx.lineTo(60 + antennaWobble * 0.4, 8);
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 10 + giggleFactor * 5;
      ctx.beginPath();
      ctx.arc(60 + antennaWobble * 0.4, 6, 4.5 + giggleFactor * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#F472B6';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(58.5 + antennaWobble * 0.4, 4.5, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // 8. CHIBI HEAD DOME
      ctx.beginPath();
      ctx.moveTo(22, 44);
      ctx.bezierCurveTo(22, 23, 38, 14, 60, 14);
      ctx.bezierCurveTo(82, 14, 98, 23, 98, 44);
      ctx.bezierCurveTo(98, 62, 84, 72, 60, 72);
      ctx.bezierCurveTo(36, 72, 22, 62, 22, 44);
      ctx.closePath();
      ctx.fillStyle = whiteChassisGrad;
      ctx.fill();
      ctx.strokeStyle = '#DDD6FE';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(32, 23);
      ctx.bezierCurveTo(40, 17, 55, 15, 68, 17);
      ctx.bezierCurveTo(64, 20, 44, 22, 32, 23);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();

      // 9. PURPLE NEON FRAME AROUND SCREEN
      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 10 + giggleFactor * 4;
      drawRoundRect(27.5, 26.5, 65, 37, 17.5);
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // 10. HIGH-GLOSS BLACK SCREEN
      drawRoundRect(29, 28, 62, 34, 16);
      ctx.fillStyle = blackScreenGrad;
      ctx.fill();
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(36, 31);
      ctx.bezierCurveTo(46, 30, 65, 30, 84, 32);
      ctx.bezierCurveTo(78, 35, 52, 35, 36, 31);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fill();

      // 11. SOFT ROSY BLUSHING CHEEKS (Gentle subtle pulse)
      const blushOpacity = Math.min(0.9, 0.65 + giggleFactor * 0.25);
      const blushRad = 4.5 + giggleFactor * 1.8;

      const leftBlushGrad = ctx.createRadialGradient(36, 52, 0, 36, 52, blushRad);
      leftBlushGrad.addColorStop(0, `rgba(244, 114, 182, ${blushOpacity})`);
      leftBlushGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');
      ctx.beginPath();
      ctx.ellipse(36, 52, blushRad, blushRad * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = leftBlushGrad;
      ctx.fill();

      const rightBlushGrad = ctx.createRadialGradient(84, 52, 0, 84, 52, blushRad);
      rightBlushGrad.addColorStop(0, `rgba(244, 114, 182, ${blushOpacity})`);
      rightBlushGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');
      ctx.beginPath();
      ctx.ellipse(84, 52, blushRad, blushRad * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = rightBlushGrad;
      ctx.fill();

      // 12. CUTE GENTLE LAUGHING EYES vs NORMAL EYES
      ctx.save();
      ctx.shadowColor = '#67E8F9';
      ctx.shadowBlur = 8 + giggleFactor * 3;

      if (giggleFactor > 0.2) {
        // Softer joyful squinting smile eyes (^ ^)
        const eyeJitterY = Math.sin(elapsed * 8) * 0.4 * giggleFactor;

        // Left Eye Laugh Arc
        ctx.beginPath();
        ctx.strokeStyle = '#67E8F9';
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.arc(45, 45 + eyeJitterY, 6.0, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(40, 42.5 + eyeJitterY, 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Right Eye Laugh Arc
        ctx.beginPath();
        ctx.strokeStyle = '#67E8F9';
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.arc(75, 45 + eyeJitterY, 6.0, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(80, 42.5 + eyeJitterY, 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Normal Cute Eyes
        ctx.beginPath();
        ctx.ellipse(45, 43, 6.5, 8.5 * blinkScale, 0, 0, Math.PI * 2);
        ctx.fillStyle = glowEyeGrad;
        ctx.fill();

        if (blinkScale > 0.4) {
          ctx.beginPath();
          ctx.arc(43, 40, 2.8 * blinkScale, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(47, 46, 1.4 * blinkScale, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.ellipse(75, 43, 6.5, 8.5 * blinkScale, 0, 0, Math.PI * 2);
        ctx.fillStyle = glowEyeGrad;
        ctx.fill();

        if (blinkScale > 0.4) {
          ctx.beginPath();
          ctx.arc(73, 40, 2.8 * blinkScale, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(77, 46, 1.4 * blinkScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 13. CUTE SMILE / GENTLE CHUCKLE MOUTH
      ctx.save();
      ctx.shadowColor = '#67E8F9';
      ctx.shadowBlur = 7 + giggleFactor * 3;

      if (giggleFactor > 0.25) {
        // Soft, gentle open smile with cute pink accent
        const mouthBounce = Math.sin(elapsed * 7.5) * 0.8 * giggleFactor;

        ctx.beginPath();
        ctx.moveTo(54, 49.5);
        ctx.lineTo(66, 49.5);
        ctx.quadraticCurveTo(60, 56 + mouthBounce, 54, 49.5);
        ctx.closePath();
        ctx.fillStyle = '#3B0764';
        ctx.fill();
        ctx.strokeStyle = '#67E8F9';
        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(60, 52.5 + mouthBounce * 0.5, 3.2, 1.8, 0, 0, Math.PI);
        ctx.fillStyle = '#F472B6';
        ctx.fill();
      } else {
        // Normal Cute Smile Arc
        ctx.beginPath();
        ctx.moveTo(56, 50);
        ctx.quadraticCurveTo(60, 54, 64, 50);
        ctx.strokeStyle = '#67E8F9';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();

      // 14. FOREHEAD DIAMOND GEM
      ctx.save();
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(60, 20);
      ctx.lineTo(63.5, 24);
      ctx.lineTo(60, 28);
      ctx.lineTo(56.5, 24);
      ctx.closePath();
      ctx.fillStyle = '#F472B6';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // end head

      // 15. FLOATING SPARKLE STARS HALO (Gentle, elegant)
      ctx.save();
      haloParticles.forEach((p) => {
        const currentAngle = p.angle + elapsed * p.speed * 0.15;
        const px = 60 + Math.cos(currentAngle) * p.dist;
        const py = 52 + Math.sin(currentAngle) * (p.dist * 0.75);
        const sparklePulse = Math.max(0.2, Math.sin(elapsed * 2.5 + p.phase));

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(sparklePulse, sparklePulse);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.fillStyle = p.color;

        const sz = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -sz * 1.5);
        ctx.lineTo(sz * 0.45, -sz * 0.4);
        ctx.lineTo(sz * 1.5, 0);
        ctx.lineTo(sz * 0.45, sz * 0.4);
        ctx.lineTo(0, sz * 1.5);
        ctx.lineTo(-sz * 0.45, sz * 0.4);
        ctx.lineTo(-sz * 1.5, 0);
        ctx.lineTo(-sz * 0.45, -sz * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();

      // 16. CANVAS PARTICLES (Slow, gentle rising glints - no comic tags)
      ctx.save();
      for (let i = canvasParticles.length - 1; i >= 0; i--) {
        const pt = canvasParticles[i];
        pt.life++;
        pt.x += pt.vx;
        pt.y += pt.vy;
        const alpha = Math.max(0, 1 - pt.life / pt.maxLife);

        if (pt.life >= pt.maxLife) {
          canvasParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(pt.x, pt.y);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(0, 0, pt.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      ctx.restore(); // end frame
    };

    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', onCanvasMouseMove);
      canvas.removeEventListener('touchmove', onCanvasTouchMove);
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('mouseleave', onCanvasMouseLeave);
      if (canvasRef.current && container.contains(canvasRef.current)) {
        container.removeChild(canvasRef.current);
      }
    };
  }, [onAnimationReady, onTickle]);

  return (
    <div className={`relative w-full h-full min-h-[280px] md:min-h-[380px] flex items-center justify-center select-none ${className || ''}`}>
      {/* Canvas container with pure 60fps soft canvas-rendered physics (no comic tags) */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
      />
    </div>
  );
}

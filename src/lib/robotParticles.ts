export interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function drawRobotParticles(ctx: CanvasRenderingContext2D, canvasParticles: CanvasParticle[]) {
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

}

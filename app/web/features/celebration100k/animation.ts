import { COUCHERS_LOGO_PATHS } from "resources/couchersLogoPaths";

import { LAND_PATH } from "./landPath";
import { MemberCluster, Region, Stay } from "./mapData";

interface Canvas2D {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}

interface View {
  s: number;
  ox: number;
  oy: number;
  k: number;
}

interface TimedCluster extends MemberCluster {
  appear: number;
}

interface TimedStay extends Stay {
  start: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  tilt: number;
  vt: number;
  size: number;
  color: string;
  age: number;
}

interface MapAnimationOptions {
  cities: MemberCluster[];
  regions: MemberCluster[];
  stays: Stay[];
  onProgress: (progress: number) => void;
  onDone: () => void;
}

const CONFETTI_COLORS = ["#e47701", "#fe982a", "#ffad52", "#00a398", "#6bc4a6", "#8fd4ba"];
// Same colours and size steps as the search map's cluster layer
const TEAL_LIGHT = "#6bc4a6";
const TEAL = "#00a398";
const TEAL_DARK = "#20686c";

const T_MERGE = 5600;
const T_MERGED = 6800;
const T_END = 7400;
const TRAVEL = 1300;
const HELLO_FOR = 1300;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const popScale = (t: number) => (t < 0.6 ? (t / 0.6) * 1.2 : 1.2 - ((t - 0.6) / 0.4) * 0.2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// Canvas drawing needs real colours, so read the theme's CSS variables at draw time
function cssVar(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function setUpCanvas(canvas: HTMLCanvasElement): Canvas2D | null {
  // jsdom and very old browsers have no 2D canvas or Path2D; the overlay still works without the drawing
  const ctx = typeof Path2D !== "undefined" ? canvas.getContext("2d") : null;
  if (!ctx) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height };
}

let couchPaths: Path2D[] | null = null;
let landPath: Path2D | null = null;
const getCouchPaths = () => (couchPaths ??= COUCHERS_LOGO_PATHS.map((d) => new Path2D(d)));
const getLandPath = () => (landPath ??= new Path2D(LAND_PATH));

function drawCouch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rot: number,
  flip: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  const s = size / 432;
  ctx.scale(s * flip, s);
  ctx.translate(-216, -146);
  ctx.fillStyle = color;
  getCouchPaths().forEach((p) => ctx.fill(p));
  ctx.restore();
}

/** Bursts couch-shaped confetti from a point, with side cannons and a second pop. Returns a stop function. */
export function startConfetti(canvas: HTMLCanvasElement, origin: { x: number; y: number }): () => void {
  const c = setUpCanvas(canvas);
  if (!c) return () => {};
  let particles: Particle[] = [];
  let raf = 0;
  const timers: number[] = [];

  const spawn = (x: number, y: number, count: number, angle: number, spread: number, speedMul: number) => {
    const n = Math.round(count * Math.min(1, Math.max(0.4, c.w / 760)));
    const speed = Math.max(7, c.w / 70) * speedMul;
    for (let i = 0; i < n; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const v = speed * (0.5 + Math.random() * 0.7);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.18,
        tilt: Math.random() * Math.PI * 2,
        vt: 0.05 + Math.random() * 0.08,
        size: Math.max(10, c.w / 42) * (0.7 + Math.random() * 0.9),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        age: 0,
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const tick = () => {
    c.ctx.clearRect(0, 0, c.w, c.h);
    particles.forEach((p) => {
      p.age += 1;
      p.vy += 0.16;
      p.vx *= 0.99;
      p.vy *= 0.99;
      // A gentle flutter so the couches drift down like paper
      p.tilt += p.vt;
      p.x += p.vx + Math.sin(p.tilt) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      const alpha = p.age > 200 ? Math.max(0, 1 - (p.age - 200) / 60) : 1;
      drawCouch(c.ctx, p.x, p.y, p.size, p.rot, Math.cos(p.tilt) > 0 ? 1 : -1, p.color, alpha);
    });
    particles = particles.filter((p) => p.age < 260 && p.y < c.h + 60);
    raf = particles.length ? requestAnimationFrame(tick) : 0;
  };

  spawn(origin.x, origin.y, 90, -Math.PI / 2, Math.PI * 1.2, 1);
  timers.push(
    window.setTimeout(() => {
      spawn(0, c.h, 55, -Math.PI / 3, 0.6, 1.25);
      spawn(c.w, c.h, 55, (-2 * Math.PI) / 3, 0.6, 1.25);
    }, 220),
  );
  timers.push(window.setTimeout(() => spawn(origin.x, origin.y, 70, -Math.PI / 2, Math.PI * 1.4, 0.9), 520));

  return () => {
    timers.forEach((t) => clearTimeout(t));
    cancelAnimationFrame(raf);
    c.ctx.clearRect(0, 0, c.w, c.h);
  };
}

function abbreviate(n: number) {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n / 1000)}k`;
}

function clusterStyle(n: number) {
  if (n < 100) return { fill: TEAL_LIGHT, text: "#313539", r: 20 };
  if (n < 750) return { fill: TEAL, text: "#fcfcfc", r: 30 };
  return { fill: TEAL_DARK, text: "#fcfcfc", r: 40 };
}

/**
 * The member map: city clusters pop in, couches travel between cities and say hello, then everything
 * merges into regional clusters. Wide canvases show the whole world; tall (phone) canvases start zoomed in,
 * pan from the Americas to Asia, then zoom out as the clusters merge.
 */
class MemberMap {
  private c: Canvas2D;
  private ms = Infinity;
  private cities: TimedCluster[];
  private regions: Map<Region, MemberCluster>;
  private stays: TimedStay[];

  constructor(c: Canvas2D, cities: MemberCluster[], regions: MemberCluster[], stays: Stay[]) {
    this.c = c;
    // Golden-ratio steps scatter the appearance times evenly, so the map fills in everywhere at once
    this.cities = cities.map((city, i) => ({ ...city, appear: 300 + ((i * 0.618034) % 1) * 3900 }));
    this.regions = new Map(regions.map((r) => [r.region, r]));
    this.stays = stays.map((stay, i) => ({ ...stay, start: 1100 + i * 330 }));
  }

  private view(): View {
    const { w, h } = this.c;
    const tall = h > w;
    const k = Math.max(0.5, Math.min(1, w / 1000));
    const bandTop = h * (tall ? 0.22 : 0.14);
    const bandH = h * (tall ? 0.56 : 0.74);
    const s0 = Math.min(w / 360, bandH / 128);
    const full = { s: s0, ox: (w - 360 * s0) / 2, oy: bandTop + (bandH - 128 * s0) / 2 };
    if (!tall) return { ...full, k };
    const s1 = Math.max(s0, (h * 0.62) / 128);
    const lng = -80 + 190 * easeInOut(clamp01(this.ms / T_MERGE));
    const lat = 20;
    const zoomed = { s: s1, ox: w / 2 - (lng + 180) * s1, oy: h * 0.54 - (72 - lat) * s1 };
    const z = easeInOut(clamp01((this.ms - T_MERGE) / (T_MERGED - T_MERGE)));
    return {
      s: zoomed.s + (full.s - zoomed.s) * z,
      ox: zoomed.ox + (full.ox - zoomed.ox) * z,
      oy: zoomed.oy + (full.oy - zoomed.oy) * z,
      k,
    };
  }

  private project(lat: number, lng: number): [number, number] {
    const v = this.view();
    return [v.ox + (lng + 180) * v.s, v.oy + (72 - lat) * v.s];
  }

  private drawBasemap() {
    const { ctx, w, h } = this.c;
    const v = this.view();
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, v.oy, w, 128 * v.s);
    ctx.clip();
    ctx.translate(v.ox, v.oy);
    ctx.scale(v.s, v.s);
    ctx.fillStyle = cssVar("--mui-palette-background-default", "#fcfcfc");
    ctx.fill(getLandPath());
    ctx.strokeStyle = cssVar("--mui-palette-divider", "#e0e0e0");
    ctx.lineWidth = 0.35;
    ctx.stroke(getLandPath());
    ctx.restore();
  }

  private drawCluster(x: number, y: number, n: number, scale: number, alpha: number) {
    if (n <= 0 || scale <= 0) return;
    const { ctx } = this.c;
    const { k } = this.view();
    const style = clusterStyle(n);
    const r = style.r * 0.62 * k * scale;
    ctx.save();
    ctx.fillStyle = style.fill;
    ctx.globalAlpha = alpha * 0.25;
    ctx.beginPath();
    ctx.arc(x, y, r + 3 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = style.text;
    ctx.font = `500 ${Math.max(9, 12 * k * Math.min(scale, 1.1))}px Ubuntu, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(abbreviate(n), x, y + 0.5);
    ctx.restore();
  }

  private arcPoint(stay: Stay, t: number): [number, number] {
    const [x1, y1] = this.project(...stay.from);
    const [x2, y2] = this.project(...stay.to);
    const d = Math.hypot(x2 - x1, y2 - y1);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2 - d * 0.35;
    const u = 1 - t;
    return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
  }

  private drawStay(stay: Stay, t: number, alpha: number, withCouch: boolean) {
    const { ctx } = this.c;
    const { k } = this.view();
    const orange = cssVar("--mui-palette-secondary-main", "#e47701");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = orange;
    ctx.lineWidth = 2 * k;
    ctx.lineCap = "round";
    ctx.setLineDash([1, 6 * k]);
    ctx.beginPath();
    for (let i = 0; i <= 40 * t; i++) {
      const [x, y] = this.arcPoint(stay, i / 40);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    if (withCouch && t > 0 && t < 1) {
      const [x, y] = this.arcPoint(stay, t);
      const [px, py] = this.arcPoint(stay, Math.max(0, t - 0.02));
      drawCouch(ctx, x, y, 22 * k, Math.atan2(y - py, x - px) * 0.25, 1, orange, 1);
    }
  }

  private drawHello(stay: Stay, alpha: number) {
    const { ctx, w } = this.c;
    const { k } = this.view();
    const [x, y] = this.project(...stay.to);
    const size = Math.max(10, 14 * k);
    ctx.save();
    ctx.font = `500 ${size}px Ubuntu, sans-serif`;
    const bw = ctx.measureText(stay.hello).width + size * 1.4;
    const bh = size * 1.8;
    // Keep the bubble inside the map even for cities near the edge, like Auckland
    const bx = Math.min(w - bw - 8, Math.max(8, x - bw / 2));
    const by = y - bh - 22 * k;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = cssVar("--mui-palette-background-paper", "#ffffff");
    ctx.beginPath();
    // roundRect is missing on older iOS web views
    if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, bh / 2);
    else ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = cssVar("--mui-palette-text-primary", "#313539");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stay.hello, bx + bw / 2, by + bh / 2 + 0.5);
    ctx.restore();
  }

  frame(ms: number) {
    this.ms = ms;
    this.drawBasemap();
    const merge = easeInOut(clamp01((ms - T_MERGE) / (T_MERGED - T_MERGE)));
    const stayProgress = (stay: TimedStay) => clamp01((ms - stay.start) / TRAVEL);

    this.stays.forEach((stay) => {
      const t = stayProgress(stay);
      if (t > 0) this.drawStay(stay, easeInOut(t), (1 - merge * 0.7) * 0.85, false);
    });
    if (merge < 1) {
      this.cities.forEach((city) => {
        const age = ms - city.appear;
        if (age < 0) return;
        const n = Math.round(city.count * easeOut(Math.min(1, age / 900)));
        const [x, y] = this.project(city.lat, city.lng);
        const region = this.regions.get(city.region);
        const [rx, ry] = region ? this.project(region.lat, region.lng) : [x, y];
        const scale = popScale(Math.min(1, age / 420)) * (1 - merge * 0.4);
        this.drawCluster(x + (rx - x) * merge, y + (ry - y) * merge, n, scale, 1 - merge);
      });
    }
    if (merge > 0) {
      this.regions.forEach((region) => {
        const [x, y] = this.project(region.lat, region.lng);
        this.drawCluster(x, y, region.count, 0.6 + 0.9 * merge, merge);
      });
    }
    this.stays.forEach((stay) => {
      const t = stayProgress(stay);
      if (t > 0 && t < 1) this.drawStay(stay, easeInOut(t), 1, true);
      const since = ms - (stay.start + TRAVEL);
      if (since > 0 && since < HELLO_FOR) {
        this.drawHello(stay, Math.min(1, since / 250, (HELLO_FOR - since) / 250));
      }
    });
  }

  drawFinal() {
    this.ms = Infinity;
    this.drawBasemap();
    this.stays.forEach((stay) => this.drawStay(stay, 1, 0.3, false));
    this.regions.forEach((region) => {
      const [x, y] = this.project(region.lat, region.lng);
      this.drawCluster(x, y, region.count, 1.5, 1);
    });
  }
}

/** Plays the member map once. Returns a stop function. */
export function startMapAnimation(canvas: HTMLCanvasElement, options: MapAnimationOptions): () => void {
  const c = setUpCanvas(canvas);
  if (!c) {
    options.onProgress(1);
    options.onDone();
    return () => {};
  }
  const map = new MemberMap(c, options.cities, options.regions, options.stays);
  const t0 = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const ms = now - t0;
    map.frame(ms);
    options.onProgress(easeOut(clamp01(ms / T_MERGED)));
    if (ms < T_END) {
      raf = requestAnimationFrame(step);
    } else {
      map.drawFinal();
      options.onDone();
    }
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/** Draws the finished map straight away, for reduced motion and after a resize. */
export function drawFinalMap(
  canvas: HTMLCanvasElement,
  cities: MemberCluster[],
  regions: MemberCluster[],
  stays: Stay[],
) {
  const c = setUpCanvas(canvas);
  if (c) new MemberMap(c, cities, regions, stays).drawFinal();
}

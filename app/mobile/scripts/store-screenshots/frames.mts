// Frames raw device screenshots and adds a caption, at each store's required sizes.
import {
  type Canvas,
  createCanvas,
  GlobalFonts,
  loadImage,
  type SKRSContext2D,
} from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { encodeRgbPng } from "./png.mts";

const APP = join(import.meta.dirname, "../../..");
GlobalFonts.registerFromPath(
  join(APP, "web/public/static/fonts/ubuntu/latin-700-normal.woff2"),
  "Ubuntu",
);

// brand palette (app/web/theme.ts)
const TEAL = "#00a398";
const TEAL_DARK = "rgba(32, 104, 108, 0.35)";
const TEAL_DARK_CLEAR = "rgba(32, 104, 108, 0)";
const BEZEL = "#1c1c1e";
const BEZEL_RIM = "#48484a";

// Google Play: "taglines should not take up more than 20% of the image"
const CAPTION_HEIGHT = 0.18;

/** Proportions of a generic device frame, relative to the screen width. */
export type Device = {
  bezel: number;
  bodyRadius: number;
  screenRadius: number;
  island?: { width: number; height: number; top: number };
  punchHole?: { diameter: number; top: number };
  cameraDot?: number; // in the top bezel
};

export const IPHONE: Device = {
  bezel: 0.04,
  bodyRadius: 0.16,
  screenRadius: 0.125,
  island: { width: 0.285, height: 0.083, top: 0.028 },
};
export const IPAD: Device = {
  bezel: 0.045,
  bodyRadius: 0.075,
  screenRadius: 0.045,
  cameraDot: 0.012,
};
export const ANDROID: Device = {
  bezel: 0.03,
  bodyRadius: 0.115,
  screenRadius: 0.09,
  punchHole: { diameter: 0.036, top: 0.03 },
};

export type Target = {
  store: string;
  name: string;
  size: [number, number];
  device: Device;
};

function roundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill: string,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function wrap(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const candidate = lines.length
      ? `${lines[lines.length - 1]} ${word}`
      : word;
    if (lines.length && ctx.measureText(candidate).width <= maxWidth) {
      lines[lines.length - 1] = candidate;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

function drawCaption(
  ctx: SKRSContext2D,
  caption: string,
  width: number,
  height: number,
) {
  let fontSize = Math.round(width * 0.068);
  let lines: string[];
  do {
    ctx.font = `bold ${fontSize}px Ubuntu`;
    lines = wrap(ctx, caption, width * 0.86);
    if (lines.length > 2) fontSize = Math.round(fontSize * 0.92);
  } while (lines.length > 2);

  const lineHeight = Math.round(fontSize * 1.18);
  let y =
    (height * CAPTION_HEIGHT - lineHeight * lines.length) / 2 + height * 0.012;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const line of lines) {
    ctx.fillText(line, width / 2, y);
    y += lineHeight;
  }
}

/** The screenshot inside a device body, drawn in screenshot pixels at the current transform. */
function drawDevice(
  ctx: SKRSContext2D,
  screenshot: Awaited<ReturnType<typeof loadImage>>,
  device: Device,
) {
  const sw = screenshot.width;
  const sh = screenshot.height;
  const bezel = device.bezel * sw;
  const bodyW = sw + 2 * bezel;
  const bodyH = sh + 2 * bezel;
  const rim = sw * 0.006;

  roundRect(ctx, 0, 0, bodyW, bodyH, device.bodyRadius * sw, BEZEL_RIM);
  roundRect(
    ctx,
    rim,
    rim,
    bodyW - 2 * rim,
    bodyH - 2 * rim,
    device.bodyRadius * sw - rim,
    BEZEL,
  );

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bezel, bezel, sw, sh, device.screenRadius * sw);
  ctx.clip();
  ctx.drawImage(screenshot, bezel, bezel);
  ctx.restore();

  if (device.island) {
    const { width, height, top } = device.island;
    roundRect(
      ctx,
      bezel + (sw - width * sw) / 2,
      bezel + top * sw,
      width * sw,
      height * sw,
      (height * sw) / 2,
      "#000",
    );
  }
  if (device.punchHole) {
    const d = device.punchHole.diameter * sw;
    ctx.beginPath();
    ctx.arc(
      bezel + sw / 2,
      bezel + device.punchHole.top * sw + d / 2,
      d / 2,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "#000";
    ctx.fill();
  }
  if (device.cameraDot) {
    ctx.beginPath();
    ctx.arc(bodyW / 2, bezel / 2, (device.cameraDot * sw) / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#2c2c2e";
    ctx.fill();
  }
}

export async function compose(
  screenshotPath: string,
  caption: string,
  target: Target,
): Promise<Canvas> {
  const [width, height] = target.size;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = TEAL;
  ctx.fillRect(0, 0, width, height);
  // soft darker band at the bottom so the device doesn't float on a flat colour
  const band = ctx.createLinearGradient(0, (height * 2) / 3, 0, height);
  band.addColorStop(0, TEAL_DARK_CLEAR);
  band.addColorStop(1, TEAL_DARK);
  ctx.fillStyle = band;
  ctx.fillRect(0, (height * 2) / 3, width, height / 3);

  drawCaption(ctx, caption, width, height);

  const screenshot = await loadImage(screenshotPath);
  const bezel = target.device.bezel * screenshot.width;
  const bodyW = screenshot.width + 2 * bezel;
  const bodyH = screenshot.height + 2 * bezel;
  const captionH = height * CAPTION_HEIGHT;
  const scale = Math.min(
    (width * 0.84) / bodyW,
    (height - captionH - height * 0.03) / bodyH,
  );
  ctx.save();
  ctx.translate((width - bodyW * scale) / 2, captionH);
  ctx.scale(scale, scale);
  drawDevice(ctx, screenshot, target.device);
  ctx.restore();
  return canvas;
}

export async function write(
  screenshotPath: string,
  caption: string,
  target: Target,
  outPath: string,
) {
  mkdirSync(dirname(outPath), { recursive: true });
  const canvas = await compose(screenshotPath, caption, target);
  const { data } = canvas
    .getContext("2d")
    .getImageData(0, 0, canvas.width, canvas.height);
  writeFileSync(outPath, encodeRgbPng(data, canvas.width, canvas.height));
}

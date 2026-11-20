// Small drawing helpers shared by the avatars and event covers.
import type { SKRSContext2D } from "@napi-rs/canvas";

export type Colour = readonly [number, number, number];
type Box = readonly [number, number, number, number];

export const css = ([r, g, b]: Colour, alpha = 1) =>
  `rgba(${r}, ${g}, ${b}, ${alpha})`;

const rad = (degrees: number) => (degrees * Math.PI) / 180;

function ellipsePath(
  ctx: SKRSContext2D,
  [x0, y0, x1, y1]: Box,
  start = 0,
  end = 360,
) {
  ctx.beginPath();
  ctx.ellipse(
    (x0 + x1) / 2,
    (y0 + y1) / 2,
    (x1 - x0) / 2,
    (y1 - y0) / 2,
    0,
    rad(start),
    rad(end),
  );
}

export function ellipse(ctx: SKRSContext2D, box: Box, colour: Colour) {
  ellipsePath(ctx, box);
  ctx.fillStyle = css(colour);
  ctx.fill();
}

// a filled slice of an ellipse closed by a straight line; angles go clockwise from 3 o'clock
export function chord(
  ctx: SKRSContext2D,
  box: Box,
  start: number,
  end: number,
  colour: Colour,
) {
  ellipsePath(ctx, box, start, end);
  ctx.closePath();
  ctx.fillStyle = css(colour);
  ctx.fill();
}

export function arc(
  ctx: SKRSContext2D,
  box: Box,
  start: number,
  end: number,
  colour: Colour,
  width: number,
) {
  ellipsePath(ctx, box, start, end);
  ctx.strokeStyle = css(colour);
  ctx.lineWidth = width;
  ctx.stroke();
}

export function rect(
  ctx: SKRSContext2D,
  [x0, y0, x1, y1]: Box,
  colour: Colour,
  radius = 0,
) {
  ctx.beginPath();
  ctx.roundRect(x0, y0, x1 - x0, y1 - y0, radius);
  ctx.fillStyle = css(colour);
  ctx.fill();
}

export function polygon(
  ctx: SKRSContext2D,
  points: readonly (readonly [number, number])[],
  colour: Colour,
) {
  ctx.beginPath();
  points.forEach(([x, y], i) =>
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y),
  );
  ctx.closePath();
  ctx.fillStyle = css(colour);
  ctx.fill();
}

export function line(
  ctx: SKRSContext2D,
  points: readonly (readonly [number, number])[],
  colour: Colour,
  width: number,
) {
  ctx.beginPath();
  points.forEach(([x, y], i) =>
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y),
  );
  ctx.strokeStyle = css(colour);
  ctx.lineWidth = width;
  ctx.stroke();
}

// Flat illustrated cover images for the seeded events, in the same style as the avatars.
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { MEDIA_DIR, SEED_DATA } from "./avatars.mts";
import {
  arc,
  chord,
  type Colour,
  css,
  ellipse,
  line,
  polygon,
  rect,
} from "./draw.mts";

const W = 1200;
const H = 630;

const TEAL: Colour = [0x00, 0xa3, 0x98];
const TEAL_LIGHT: Colour = [0x6b, 0xc4, 0xa6];
const TEAL_DARK: Colour = [0x20, 0x68, 0x6c];
const ORANGE: Colour = [0xe4, 0x77, 0x01];
const ORANGE_LIGHT: Colour = [0xfe, 0x98, 0x2a];
const CREAM: Colour = [0xfb, 0xf4, 0xe6];
const SKY: Colour = [0xd9, 0xf0, 0xea];
const SUN: Colour = [0xff, 0xc8, 0x57];
const INK: Colour = [0x31, 0x35, 0x39];
const WHITE: Colour = [0xff, 0xff, 0xff];

type Scene = (ctx: SKRSContext2D) => void;

const picnic: Scene = (ctx) => {
  ellipse(ctx, [880, 70, 1010, 200], SUN);
  ellipse(ctx, [-200, 380, 1400, 1100], TEAL_LIGHT);
  // tree
  rect(ctx, [215, 250, 245, 430], TEAL_DARK);
  ellipse(ctx, [140, 120, 320, 300], TEAL);
  // checked blanket
  const cell = 45;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const colour = (row + col) % 2 === 0 ? ORANGE : CREAM;
      rect(
        ctx,
        [
          470 + col * cell,
          420 + row * cell * 0.6,
          470 + (col + 1) * cell,
          420 + (row + 1) * cell * 0.6,
        ],
        colour,
      );
    }
  }
  // basket
  rect(ctx, [560, 360, 660, 430], ORANGE_LIGHT, 12);
  arc(ctx, [570, 320, 650, 400], 180, 360, INK, 6);
};

const language: Scene = (ctx) => {
  const bubble = (
    x: number,
    y: number,
    w: number,
    h: number,
    colour: Colour,
    tailLeft: boolean,
  ) => {
    rect(ctx, [x, y, x + w, y + h], colour, 40);
    const tx = tailLeft ? x + 60 : x + w - 60;
    polygon(
      ctx,
      [
        [tx, y + h - 5],
        [tx - 10, y + h + 50],
        [tx + 40, y + h - 5],
      ],
      colour,
    );
    for (let i = 0; i < 3; i++) {
      const cx = x + w / 2 + (i - 1) * 50;
      ellipse(
        ctx,
        [cx - 14, y + h / 2 - 14, cx + 14, y + h / 2 + 14],
        colour === WHITE ? TEAL : WHITE,
      );
    }
  };
  bubble(300, 130, 360, 180, TEAL, true);
  bubble(560, 300, 340, 170, WHITE, false);
};

const bike: Scene = (ctx) => {
  [ORANGE_LIGHT, SUN, CREAM].forEach((colour, i) =>
    rect(ctx, [0, i * 140, W, H], colour),
  );
  // bridge towers
  for (const x of [330, 870]) rect(ctx, [x - 25, 120, x + 25, 470], TEAL_DARK);
  // the main cable sags between the tower tops, with hangers down to the deck
  arc(ctx, [330, -110, 870, 350], 0, 180, TEAL_DARK, 10);
  for (let x = 375; x < 830; x += 45) {
    const top = 120 + 230 * Math.sqrt(1 - ((x - 600) / 270) ** 2);
    line(
      ctx,
      [
        [x, top],
        [x, 470],
      ],
      TEAL_DARK,
      4,
    );
  }
  rect(ctx, [0, 470, W, 500], TEAL_DARK);
  // bicycle
  for (const cx of [520, 680])
    arc(ctx, [cx - 60, 500, cx + 60, 620], 0, 360, INK, 10);
  line(
    ctx,
    [
      [520, 560],
      [590, 520],
      [680, 560],
    ],
    INK,
    10,
  );
};

const potluck: Scene = (ctx) => {
  rect(ctx, [0, 420, W, H], TEAL_DARK);
  // pot with steam
  rect(ctx, [470, 260, 730, 430], ORANGE, 30);
  rect(ctx, [440, 250, 760, 280], ORANGE_LIGHT);
  for (const x of [540, 600, 660])
    arc(ctx, [x - 25, 110, x + 25, 230], 90, 270, TEAL_LIGHT, 8);
  // bowls
  chord(ctx, [170, 300, 350, 460], 0, 180, TEAL);
  chord(ctx, [850, 300, 1030, 460], 0, 180, SUN);
};

const hike: Scene = (ctx) => {
  ellipse(ctx, [820, 80, 960, 220], SUN);
  const mountains: [[number, number][], Colour][] = [
    [
      [
        [-50, 630],
        [300, 180],
        [650, 630],
      ],
      TEAL_LIGHT,
    ],
    [
      [
        [400, 630],
        [780, 230],
        [1250, 630],
      ],
      TEAL,
    ],
    [
      [
        [100, 630],
        [520, 330],
        [900, 630],
      ],
      TEAL_DARK,
    ],
  ];
  for (const [points, colour] of mountains) polygon(ctx, points, colour);
  // snow cap
  polygon(
    ctx,
    [
      [300, 180],
      [250, 240],
      [350, 240],
    ],
    WHITE,
  );
  // trail
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const x = 520 + Math.sin(t * Math.PI * 2) * 60;
    const y = 600 - t * 250;
    ellipse(ctx, [x - 8, y - 8, x + 8, y + 8], CREAM);
  }
};

const sunset: Scene = (ctx) => {
  [ORANGE, ORANGE_LIGHT, SUN].forEach((colour, i) =>
    rect(ctx, [0, i * 120, W, H], colour),
  );
  ellipse(ctx, [520, 250, 680, 410], CREAM);
  // Lisbon rooftops, with a church dome
  let x = 0;
  for (const [width, height] of [
    [140, 180],
    [110, 240],
    [160, 150],
    [120, 210],
    [150, 170],
    [130, 260],
    [170, 190],
    [140, 230],
    [130, 160],
  ]) {
    rect(ctx, [x, H - height, x + width, H], TEAL_DARK);
    polygon(
      ctx,
      [
        [x, H - height],
        [x + width / 2, H - height - 40],
        [x + width, H - height],
      ],
      TEAL_DARK,
    );
    x += width;
  }
  ellipse(ctx, [800, 330, 920, 450], TEAL_DARK);
};

const tacos: Scene = (ctx) => {
  // papel picado bunting
  for (let i = 0; i < 10; i++) {
    const x = i * 125;
    polygon(
      ctx,
      [
        [x, 40],
        [x + 110, 40],
        [x + 110, 130],
        [x + 55, 160],
        [x, 130],
      ],
      [TEAL, ORANGE, SUN, TEAL_LIGHT][i % 4],
    );
  }
  line(
    ctx,
    [
      [0, 40],
      [W, 40],
    ],
    INK,
    4,
  );
  // three tacos on a table
  rect(ctx, [0, 480, W, H], TEAL_DARK);
  for (const cx of [320, 600, 880]) {
    [TEAL_LIGHT, ORANGE, TEAL].forEach((colour, j) => {
      const fx = cx - 60 + j * 60;
      ellipse(ctx, [fx - 30, 285, fx + 30, 345], colour);
    });
    chord(ctx, [cx - 120, 310, cx + 120, 650], 180, 360, SUN);
  }
};

const SCENES: Record<string, [Colour, Scene]> = {
  picnic: [SKY, picnic],
  language: [CREAM, language],
  bike: [CREAM, bike],
  potluck: [CREAM, potluck],
  hike: [SKY, hike],
  sunset: [CREAM, sunset],
  tacos: [CREAM, tacos],
};

export function cover(scene: string) {
  const [background, draw] = SCENES[scene];
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = css(background);
  ctx.fillRect(0, 0, W, H);
  draw(ctx);
  return canvas;
}

/** Writes each seeded event's cover to the media folder. */
export async function prepare() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  const events: { cover: string }[] = JSON.parse(
    readFileSync(SEED_DATA, "utf8"),
  ).events;
  for (const event of events) {
    writeFileSync(
      join(MEDIA_DIR, `store-event-${event.cover}.jpg`),
      await cover(event.cover).encode("jpeg", 90),
    );
  }
}

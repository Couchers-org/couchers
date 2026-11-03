// Profile pictures for the seeded users: volunteer photos where we have them, illustrated portraits otherwise.
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  arc,
  chord,
  type Colour,
  css,
  ellipse,
  polygon,
  rect,
} from "./draw.mts";

const HERE = import.meta.dirname;
const APP = join(HERE, "../../..");
export const SEED_DATA = join(APP, "backend/src/data/store_screenshots.json");
// served by the local media server, see the media service volumes in app/docker-compose.yml
export const MEDIA_DIR = join(APP, "data/media/uploads/full");
const PHOTOS_DIR = join(HERE, "photos");

const SIZE = 512;
const BACKGROUNDS: Colour[] = [
  [0xf6, 0xd5, 0xa8],
  [0xbf, 0xe5, 0xd9],
  [0xf3, 0xc1, 0xb0],
  [0xd7, 0xd3, 0xf0],
  [0xf8, 0xe4, 0xa6],
];
const SKIN: Colour[] = [
  [0xf5, 0xd0, 0xb5],
  [0xe8, 0xb8, 0x92],
  [0xd0, 0x9a, 0x6e],
  [0xa9, 0x71, 0x4b],
  [0x7d, 0x4e, 0x31],
  [0x5a, 0x38, 0x24],
];
const HAIR: Record<string, Colour> = {
  black: [0x1a, 0x1a, 0x1a],
  "dark brown": [0x3b, 0x26, 0x1a],
  brown: [0x7a, 0x4e, 0x2c],
  blond: [0xd9, 0xb0, 0x6a],
  grey: [0xa8, 0xa8, 0xa8],
};
const SHIRT: Colour[] = [
  [0x00, 0xa3, 0x98],
  [0xe4, 0x77, 0x01],
  [0x20, 0x68, 0x6c],
  [0x31, 0x35, 0x39],
  [0x6b, 0xc4, 0xa6],
];
const INK: Colour = [0x31, 0x35, 0x39];

type Appearance = { skin: number; hair: string; hair_color: string };
type SeedUser = { username: string; avatar: Appearance };
// photos/manifest.json: {"<seeded username>": {"photo": "file.jpg", "name": "First name"}}
type Manifest = Record<string, { photo?: string; name?: string }>;

function pick<T>(options: T[], username: string, salt: string): T {
  return options[
    createHash("sha256").update(`${salt}:${username}`).digest()[0] %
      options.length
  ];
}

export function illustrated(username: string, appearance: Appearance) {
  const s = SIZE;
  const canvas = createCanvas(s, s);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = css(pick(BACKGROUNDS, username, "bg"));
  ctx.fillRect(0, 0, s, s);
  const skin = SKIN[appearance.skin];
  const hair = HAIR[appearance.hair_color];
  const shirt = pick(SHIRT, username, "shirt");
  const style = appearance.hair;

  const cx = s / 2;
  const headW = s * 0.3;
  const headH = s * 0.36;
  const headTop = s * 0.22;
  const head = [
    cx - headW / 2,
    headTop,
    cx + headW / 2,
    headTop + headH,
  ] as const;

  if (style === "long" || style === "bob") {
    const bottom = style === "long" ? s * 0.8 : s * 0.62;
    rect(
      ctx,
      [head[0] - s * 0.05, headTop - s * 0.03, head[2] + s * 0.05, bottom],
      hair,
      s * 0.14,
    );
  }

  // shoulders and neck
  ellipse(ctx, [cx - s * 0.36, s * 0.7, cx + s * 0.36, s * 1.25], shirt);
  rect(ctx, [cx - s * 0.06, head[3] - s * 0.04, cx + s * 0.06, s * 0.74], skin);
  ellipse(ctx, head, skin);

  if (style === "bun") {
    ellipse(
      ctx,
      [cx - s * 0.08, headTop - s * 0.13, cx + s * 0.08, headTop + s * 0.03],
      hair,
    );
  }
  if (style === "curly") {
    // a cloud of curls around the top half of the head
    const r = s * 0.075;
    for (let i = 0; i < 11; i++) {
      const angle = Math.PI * (1 + i / 10);
      const x = cx + Math.cos(angle) * (headW / 2 + s * 0.01);
      const y = headTop + headH * 0.42 + Math.sin(angle) * (headH * 0.5);
      ellipse(ctx, [x - r, y - r, x + r, y + r], hair);
    }
    chord(
      ctx,
      [head[0], headTop, head[2], headTop + headH * 0.7],
      180,
      360,
      hair,
    );
  }
  if (["short", "side", "bun", "long", "bob"].includes(style)) {
    chord(
      ctx,
      [
        head[0] - s * 0.01,
        headTop - s * 0.04,
        head[2] + s * 0.01,
        headTop + headH * 0.62,
      ],
      180,
      360,
      hair,
    );
  }
  if (style === "side") {
    polygon(
      ctx,
      [
        [cx - s * 0.02, headTop],
        [head[2], headTop + s * 0.02],
        [head[2], headTop + s * 0.12],
      ],
      hair,
    );
  }
  if (style === "buzz") {
    chord(
      ctx,
      [head[0], headTop - s * 0.01, head[2], headTop + headH * 0.5],
      180,
      360,
      hair,
    );
  }

  // friendly face: eyes and a smile
  const eyeY = headTop + headH * 0.52;
  for (const dx of [-0.055, 0.055]) {
    const x = cx + s * dx;
    ellipse(
      ctx,
      [x - s * 0.013, eyeY - s * 0.013, x + s * 0.013, eyeY + s * 0.013],
      INK,
    );
  }
  const smileY = headTop + headH * 0.68;
  arc(
    ctx,
    [cx - s * 0.05, smileY - s * 0.03, cx + s * 0.05, smileY + s * 0.03],
    20,
    160,
    INK,
    s * 0.012,
  );
  return canvas;
}

async function fromPhoto(file: string) {
  // photos should be upright; EXIF rotation isn't applied
  const photo = await loadImage(join(PHOTOS_DIR, file));
  const canvas = createCanvas(SIZE, SIZE);
  const scale = Math.max(SIZE / photo.width, SIZE / photo.height);
  const w = photo.width * scale;
  const h = photo.height * scale;
  canvas
    .getContext("2d")
    .drawImage(photo, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
  return canvas;
}

/** Writes every seeded user's avatar to the media folder; returns display name overrides for the seeder. */
export async function prepare(): Promise<Record<string, string>> {
  mkdirSync(MEDIA_DIR, { recursive: true });
  const manifestPath = join(PHOTOS_DIR, "manifest.json");
  const manifest: Manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : {};
  const names: Record<string, string> = {};
  const users: SeedUser[] = JSON.parse(readFileSync(SEED_DATA, "utf8")).users;
  for (const user of users) {
    const entry = manifest[user.username] ?? {};
    const canvas = entry.photo
      ? await fromPhoto(entry.photo)
      : illustrated(user.username, user.avatar);
    writeFileSync(
      join(MEDIA_DIR, `store-${user.username}.jpg`),
      await canvas.encode("jpeg", 90),
    );
    if (entry.name) names[user.username] = entry.name;
  }
  return names;
}

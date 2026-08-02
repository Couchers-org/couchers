import { decomposeColor } from "@mui/system";

// Slightly adapted from https://github.com/Qix-/color-convert
// Using HSL (hue-saturation-lightness) values makes it easy to interpolate between colors in a natural way
export const colorStringToHsl = (colorString: string) => {
  let rgb: [number, number, number] | [number, number, number, number] = [0, 0, 0];

  try {
    const { values } = decomposeColor(colorString);
    rgb = values as [number, number, number];
  } catch {
    console.warn(`Tried to decompose invalid color string '${colorString}'`);
  }

  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;

  switch (max) {
    case min: {
      h = 0;
      break;
    }

    case r: {
      h = (g - b) / delta;
      break;
    }

    case g: {
      h = 2 + (b - r) / delta;
      break;
    }

    case b: {
      h = 4 + (r - g) / delta;
      break;
    }
  }

  h = Math.min(h * 60, 360);

  if (h < 0) {
    h += 360;
  }

  const l = (min + max) / 2;

  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }

  return [h, s * 100, l * 100];
};

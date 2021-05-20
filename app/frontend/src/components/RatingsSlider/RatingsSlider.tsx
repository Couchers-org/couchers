import Slider from "@material-ui/core/Slider";
import { withStyles } from "@material-ui/core/styles";
import {
  AMAZING,
  NEGATIVE,
  NEUTRAL,
  POSITIVE,
  RATINGS_SLIDER,
} from "components/RatingsSlider/constants";
import SliderLabel from "components/RatingsSlider/SliderLabel";
import React, { useRef } from "react";
import { theme } from "theme";
import makeStyles from "utils/makeStyles";

const StyledSlider = withStyles({
  root: {
    height: 8,
    borderRadius: 25,
    marginTop: theme.spacing(6),
    marginBottom: theme.spacing(1),
  },
  track: {
    height: 10,
    borderRadius: 25,
  },
  rail: {
    height: 10,
    borderRadius: 25,
  },
  thumb: {
    height: 20,
    width: 20,
    color: theme.palette.badRating.main,
  },
  valueLabel: {
    left: "calc(-50% + 4px)",
  },
  mark: {
    display: "none",
  },
  markLabel: {
    maxWidth: "20%",
    whiteSpace: "pre-line",
  },
})(Slider);

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiSlider-markLabel[data-index="0"]': {
      transform: "translateX(0%)",
    },
    '& .MuiSlider-markLabel[data-index="3"]': {
      transform: "translateX(10%)",
    },
  },
}));

const getSliderColor = (value: number) => {
  const goodColor = theme.palette.goodRating.main.slice(1);
  const badColor = theme.palette.badRating.main.slice(1);

  const r = Math.ceil(
    parseInt(goodColor.substring(0, 2), 16) * value +
      parseInt(badColor.substring(0, 2), 16) * (1 - value)
  );
  const g = Math.ceil(
    parseInt(goodColor.substring(2, 4), 16) * value +
      parseInt(badColor.substring(2, 4), 16) * (1 - value)
  );
  const b = Math.ceil(
    parseInt(goodColor.substring(4, 6), 16) * value +
      parseInt(badColor.substring(4, 6), 16) * (1 - value)
  );

  const rgb = `rgb(${r}, ${g}, ${b})`;

  return rgb;
};

const marks = [
  {
    value: 0,
    label: `${NEGATIVE}`,
  },
  {
    value: 0.33,
    label: `${NEUTRAL}`,
  },
  {
    value: 0.6,
    label: `${POSITIVE}`,
  },
  {
    value: 0.8,
    label: `${AMAZING}`,
  },
];

const handleSliderChange = (sliderRef: any, value: number | number[]) => {
  if (typeof value === "number") {
    const color = getSliderColor(value);

    sliderRef.current.querySelector(
      ".MuiSlider-track"
    ).style.backgroundColor = color;
    sliderRef.current.querySelector(
      ".MuiSlider-thumb"
    ).style.backgroundColor = color;
    sliderRef.current.querySelector(
      ".MuiSlider-valueLabel"
    ).style.color = color;
  }
};

interface SliderProps {
  defaultValue: number;
  onChange?: (...event: any[]) => void;
}

export default function RatingsSlider({ defaultValue, onChange }: SliderProps) {
  const sliderRef = useRef<HTMLSpanElement>(null);
  const classes = useStyles();

  return (
    <StyledSlider
      ref={sliderRef}
      className={classes.root}
      aria-label={RATINGS_SLIDER}
      defaultValue={defaultValue}
      min={0}
      max={1}
      step={0.01}
      marks={marks}
      valueLabelDisplay="on"
      valueLabelFormat={(value) => <SliderLabel value={value} />}
      onChange={(event, value) => {
        handleSliderChange(sliderRef, value);
        onChange?.(value);
      }}
    />
  );
}

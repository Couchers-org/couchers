import { styled } from "@mui/material";
import Slider from "@mui/material/Slider";
import {
  AMAZING,
  NEGATIVE,
  NEUTRAL,
  POSITIVE,
  RATINGS_SLIDER,
} from "components/RatingsSlider/constants";
import { getSliderColor } from "components/RatingsSlider/getSliderColor";
import SliderLabel from "components/RatingsSlider/SliderLabel";

interface ColorProps {
  sliderColor: string;
}

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
    value: 0.67,
    label: `${POSITIVE}`,
  },
  {
    value: 1,
    label: `${AMAZING}`,
  },
];

interface SliderProps {
  value: number;
  onChange: (value: number | number[]) => void;
}

const StyledSlider = styled(Slider, {
  shouldForwardProp: (prop) => prop !== "sliderColor", // Prevents `color` prop from being passed to the DOM
})<ColorProps>(({ theme, sliderColor }) => ({
  '& .MuiSlider-markLabel[data-index="0"]': {
    transform: "translateX(0%)",
  },
  '& .MuiSlider-markLabel[data-index="3"]': {
    transform: "translateX(-100%)",
  },
  height: "0.5rem",
  borderRadius: "1.5625rem",
  marginTop: theme.spacing(6),
  marginBottom: theme.spacing(1),

  "& .MuiSlider-track": {
    backgroundColor: sliderColor,
    height: "0.625rem",
    borderRadius: "1.5625rem",
    borderColor: sliderColor,
  },
  "& .MuiSlider-rail": {
    height: "0.625rem",
    borderRadius: "1.5625rem",
  },
  "& .MuiSlider-thumb": {
    height: "1.25rem",
    width: "1.25rem",
    backgroundColor: sliderColor,
  },
  "& .MuiSlider-valueLabel": {
    left: "calc(-50% + 0.25rem)",
    lineHeight: 1.2,
    background: "unset",
    padding: 0,
    width: 32,
    height: 32,
    borderRadius: "50% 50% 50% 0",
    backgroundColor: sliderColor,
    transformOrigin: "bottom left",
    transform: "translate(50%, -100%) rotate(-45deg) scale(0)",
    "&::before": { display: "none" },
    "&.MuiSlider-valueLabelOpen": {
      transform: "translate(50%, -100%) rotate(-45deg) scale(1)",
    },
    "& > *": {
      transform: "rotate(45deg)",
    },
  },
  "& .MuiSlider-mark": {
    display: "none",
  },
}));

export default function RatingsSlider({ value, onChange }: SliderProps) {
  const props = { color: getSliderColor(value) };

  return (
    <StyledSlider
      aria-label={RATINGS_SLIDER}
      sliderColor={props.color}
      value={value}
      min={0}
      max={1}
      step={0.01}
      marks={marks}
      valueLabelDisplay="on"
      valueLabelFormat={(value) => <SliderLabel value={value} />}
      onChange={(event, value) => {
        onChange(value);
      }}
    />
  );
}

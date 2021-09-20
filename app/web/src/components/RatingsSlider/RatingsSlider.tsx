import Slider from "@material-ui/core/Slider";
import {
  AMAZING,
  NEGATIVE,
  NEUTRAL,
  POSITIVE,
  RATINGS_SLIDER,
} from "components/RatingsSlider/constants";
import { getSliderColor } from "components/RatingsSlider/getSliderColor";
import SliderLabel from "components/RatingsSlider/SliderLabel";
import makeStyles from "utils/makeStyles";

interface ColorProps {
  color: string;
}

const useStyles = makeStyles((theme) => ({
  root: {
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
  },
  track: (props: ColorProps) => ({
    backgroundColor: props.color,
    height: "0.625rem",
    borderRadius: "1.5625rem",
  }),
  rail: {
    height: "0.625rem",
    borderRadius: "1.5625rem",
  },
  thumb: (props: ColorProps) => ({
    height: "1.25rem",
    width: "1.25rem",
    backgroundColor: props.color,
  }),
  valueLabel: (props: ColorProps) => ({
    left: "calc(-50% + 0.25rem)",
    color: props.color,
  }),
  mark: {
    display: "none",
  },
}));

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

export default function RatingsSlider({ value, onChange }: SliderProps) {
  const props = { color: getSliderColor(value) };
  const classes = useStyles(props);

  return (
    <Slider
      classes={{
        root: classes.root,
        thumb: classes.thumb,
        track: classes.track,
        rail: classes.rail,
        valueLabel: classes.valueLabel,
        mark: classes.mark,
      }}
      aria-label={RATINGS_SLIDER}
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

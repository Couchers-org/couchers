import Slider from "@material-ui/core/Slider";
import { withStyles } from "@material-ui/core/styles";
import MoodBadOutlinedIcon from "@material-ui/icons/MoodBadOutlined";
import MoodOutlinedIcon from "@material-ui/icons/MoodOutlined";
import SentimentDissatisfiedIcon from "@material-ui/icons/SentimentDissatisfied";
import SentimentDissatisfiedOutlinedIcon from "@material-ui/icons/SentimentDissatisfiedOutlined";
import SentimentSatisfiedIcon from "@material-ui/icons/SentimentSatisfied";
import SentimentSatisfiedAltOutlinedIcon from "@material-ui/icons/SentimentSatisfiedAltOutlined";
import SentimentVeryDissatisfiedOutlinedIcon from "@material-ui/icons/SentimentVeryDissatisfiedOutlined";
import SentimentVerySatisfiedOutlinedIcon from "@material-ui/icons/SentimentVerySatisfiedOutlined";
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
})(Slider);

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiSlider-markLabel[data-index="0"]': {
      transform: "translateX(0%)",
    },
    '& .MuiSlider-markLabel[data-index="2"]': {
      transform: "translateX(-100%)",
    },
  },
}));

const getSliderColor = (value: number) => {
  const goodColor = theme.palette.goodRating.main.slice(1);
  const badColor = theme.palette.badRating.main.slice(1);

  const hex = function (color: number) {
    const hexString = color.toString(16);
    return hexString.length === 1 ? "0" + hexString : hexString;
  };

  var r = Math.ceil(
    parseInt(goodColor.substring(0, 2), 16) * value +
      parseInt(badColor.substring(0, 2), 16) * (1 - value)
  );
  var g = Math.ceil(
    parseInt(goodColor.substring(2, 4), 16) * value +
      parseInt(badColor.substring(2, 4), 16) * (1 - value)
  );
  var b = Math.ceil(
    parseInt(goodColor.substring(4, 6), 16) * value +
      parseInt(badColor.substring(4, 6), 16) * (1 - value)
  );

  var middle = hex(r) + hex(g) + hex(b);

  return "#" + middle;
};

function getEmojiLabel(value: number) {
  if (value < 0.15) {
    return <SentimentVeryDissatisfiedOutlinedIcon />;
  } else if (value < 0.25) {
    return <MoodBadOutlinedIcon />;
  } else if (value < 0.35) {
    return <SentimentDissatisfiedOutlinedIcon />;
  } else if (value < 0.5) {
    return <SentimentDissatisfiedIcon />;
  } else if (value < 0.65) {
    return <SentimentSatisfiedIcon />;
  } else if (value < 0.75) {
    return <SentimentSatisfiedAltOutlinedIcon />;
  } else if (value < 0.85) {
    return <MoodOutlinedIcon />;
  } else {
    return <SentimentVerySatisfiedOutlinedIcon />;
  }
}

const marks = [
  {
    value: 0,
    label: "Very negative",
  },
  {
    value: 0.5,
    label: "Neutral",
  },
  {
    value: 1,
    label: "Very postive",
  },
];

const handleSliderChange = (sliderRef: React.RefObject<HTMLSpanElement>, value: number) => {
  const color = getSliderColor(value);

  sliderRef.current.querySelector(
    ".MuiSlider-track"
  ).style.backgroundColor = color;
  sliderRef.current.querySelector(
    ".MuiSlider-thumb"
  ).style.backgroundColor = color;
  sliderRef.current.querySelector(".MuiSlider-valueLabel").style.color = color;
};

export default function RatingsSlider({ ...props }) {
  const sliderRef = useRef<HTMLSpanElement>(null);
  const classes = useStyles();

  return (
    <div>
      <StyledSlider
        ref={sliderRef}
        className={classes.root}
        aria-label="ratings slider"
        min={0}
        max={1}
        step={0.01}
        marks={marks}
        valueLabelDisplay="on"
        valueLabelFormat={(value) => <span>{getEmojiLabel(value)}</span>}
        onChange={(event, value) => {
          handleSliderChange(sliderRef, event, value);
          props.onChange?.(value);
        }}
      />
    </div>
  );
}

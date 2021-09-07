import {
  DissatisfiedIcon,
  ExtremelyDissatisfiedIcon,
  ExtremelySatisfiedIcon,
  SatisfiedIcon,
  SlightlyDissatisfiedIcon,
  SlightlySatisfiedIcon,
  VeryDissatisfiedIcon,
  VerySatisfiedIcon,
} from "components/Icons/index";

interface SliderLabelProps {
  value: number;
}

export default function SliderLabel({ value }: SliderLabelProps) {
  if (value < 0.088) {
    return <ExtremelyDissatisfiedIcon />;
  } else if (value < 0.125) {
    return <VeryDissatisfiedIcon />;
  } else if (value < 0.177) {
    return <DissatisfiedIcon />;
  } else if (value < 0.25) {
    return <SlightlyDissatisfiedIcon />;
  } else if (value < 0.354) {
    return <SlightlySatisfiedIcon />;
  } else if (value < 0.5) {
    return <SatisfiedIcon />;
  } else if (value < 0.707) {
    return <VerySatisfiedIcon />;
  } else {
    return <ExtremelySatisfiedIcon />;
  }
}

import Slider from '@material-ui/core/Slider';
import { withStyles } from "@material-ui/core";

export const AgeSlider = withStyles({
    root: {
      color: '#3a8589',
      height: 3,
      padding: '13px 0',
    },
    valueLabel: {
      left: 'calc(-50% + 9px)',
      top: '35px',
      '& *': {
        background: 'transparent',
        color: '#000',
      },
      fontSize: '13px'
    },   
    thumb: {
      height: 27,
      width: 27,
      backgroundColor: '#fff',
      border: '1px solid currentColor',
      marginTop: -12,
      marginLeft: -13,
      boxShadow: '#ebebeb 0 2px 2px',
      '&:focus, &:hover, &$active': {
        boxShadow: '#ccc 0 2px 3px 1px',
      },
      '& .bar': {
        // display: inline-block !important;
        height: 9,
        width: 1,
        backgroundColor: 'currentColor',
        marginLeft: 1,
        marginRight: 1,
      },
    },
    active: {},
    track: {
      height: 3,
    },
    rail: {
      color: '#d8d8d8',
      opacity: 1,
      height: 3,
    },
  })(Slider);


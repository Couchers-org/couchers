import { SvgIcon, SvgIconProps } from "@mui/material";

export default function EventIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 37 37" xmlns="http://www.w3.org/2000/svg">
      <svg
        width="37"
        height="37"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12H16C16.5523 12 17 11.5523 17 11C17 10.4477 16.5523 10 16 10H8Z"
          fill="#767676"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6 3C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21H18C19.6569 21 21 19.6569 21 18V6C21 4.34315 19.6569 3 18 3H6ZM5 18V8H19V18C19 18.5523 18.5523 19 18 19H6C5.44772 19 5 18.5523 5 18Z"
          fill="#767676"
        />
      </svg>
    </SvgIcon>
  );
}

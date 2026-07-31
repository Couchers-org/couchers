import { Facebook, GitHub, Instagram, Reddit } from "@mui/icons-material";
import { Link } from "@mui/material";
import { BlueSkyIcon, TikTokIcon } from "components/Icons";
import {
  blueskyURL,
  facebookURL,
  githubURL,
  instagramURL,
  redditURL,
  tiktokURL,
} from "routes";

const socialLinks = [
  {
    label: "GitHub",
    href: githubURL,
    icon: <GitHub fontSize="inherit" />,
  },
  {
    label: "Instagram",
    href: instagramURL,
    icon: <Instagram fontSize="inherit" />,
  },
  {
    label: "Reddit",
    href: redditURL,
    icon: <Reddit fontSize="inherit" />,
  },
  {
    label: "BlueSky",
    href: blueskyURL,
    icon: <BlueSkyIcon fontSize="inherit" />,
  },
  {
    label: "TikTok",
    href: tiktokURL,
    icon: <TikTokIcon fontSize="inherit" />,
  },
  {
    label: "Facebook",
    href: facebookURL,
    icon: <Facebook fontSize="inherit" />,
  },
];

type SocialMediaLinksProps = {
  iconSize: string;
};

export default function SocialMediaLinks({ iconSize }: SocialMediaLinksProps) {
  return (
    <>
      {socialLinks.map(({ label, href, icon }) => (
        <Link
          key={label}
          href={href}
          target="_blank"
          rel="noopener"
          aria-label={label}
          color="inherit"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: iconSize,
          }}
        >
          {icon}
        </Link>
      ))}
    </>
  );
}

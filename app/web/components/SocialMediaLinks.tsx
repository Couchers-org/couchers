import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import RedditIcon from "@mui/icons-material/Reddit";
import { Link } from "@mui/material";
import { BlueSkyIcon, TikTokIcon } from "components/Icons";
import { facebookURL, githubURL, instagramURL, redditURL } from "routes";

const socialLinks = [
  {
    label: "GitHub",
    href: githubURL,
    icon: <GitHubIcon fontSize="inherit" />,
  },
  {
    label: "Instagram",
    href: instagramURL,
    icon: <InstagramIcon fontSize="inherit" />,
  },
  {
    label: "Reddit",
    href: redditURL,
    icon: <RedditIcon fontSize="inherit" />,
  },
  {
    label: "BlueSky",
    href: "https://bsky.app/profile/couchers.bsky.social",
    icon: <BlueSkyIcon fontSize="inherit" />,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@couchersorg",
    icon: <TikTokIcon fontSize="inherit" />,
  },
  {
    label: "Facebook",
    href: facebookURL,
    icon: <FacebookIcon fontSize="inherit" />,
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
          display="flex"
          alignItems="center"
          color="inherit"
          justifyContent="center"
          flexShrink={0}
          fontSize={iconSize}
        >
          {icon}
        </Link>
      ))}
    </>
  );
}

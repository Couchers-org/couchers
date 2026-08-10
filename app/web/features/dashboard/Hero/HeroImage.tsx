import { styled } from "@mui/material";
import React from "react";

const ImageOuterContainer = styled("div")(() => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  overflow: "hidden",
  display: "block",
}));

const PlaceholderLayer = styled("div")<{ placeholderSrc: string }>(({ placeholderSrc }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundImage: `url(${placeholderSrc})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  zIndex: -1,
}));

const StyledActualImage = styled("img")(() => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "50% 50%",
  zIndex: 0,
}));

interface ImageWidth {
  width: number;
  fileName: string;
}

interface HeroImageProps {
  alt: string;
  placeHolderSrc: string;
  imageWidths: ImageWidth[];
}

const HeroImage: React.FC<HeroImageProps> = ({ alt, placeHolderSrc, imageWidths }) => {
  const srcset = imageWidths.map(({ width, fileName }) => `${fileName} ${width}w`).join(", ");

  const primarySrc = `${imageWidths[imageWidths.length - 1].fileName}`;

  return (
    <ImageOuterContainer>
      <PlaceholderLayer placeholderSrc={placeHolderSrc} />
      <StyledActualImage src={primarySrc} srcSet={srcset} sizes="100vw" alt={alt} />
    </ImageOuterContainer>
  );
};

export default HeroImage;

import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { IconButton, List, styled } from "@mui/material";
import React, { ReactNode, useEffect, useState } from "react";

interface Props {
  resultsSnippet: ReactNode[];
  open: boolean;
  setOpen: (newState: boolean) => void;
}

const StyledDrawer = styled("div")<{
  open?: boolean;
}>(({ theme, open }) => ({
  width: "100%",
  overflowY: "auto",
  maxHeight: open ? "none" : "220px",
  position: open ? "fixed" : "relative",
  top: open ? "56px" : "auto",
  bottom: open ? 0 : "auto",
  left: open ? 0 : "auto",
  zIndex: open ? theme.zIndex.drawer : "auto",
  backgroundColor: open ? theme.palette.background.default : "transparent",
  minHeight: open ? "250px" : "auto",
  scrollbarWidth: "none", // Firefox
  "&::-webkit-scrollbar": {
    display: "none", // Chrome, Safari, Opera
  },
  msOverflowStyle: "none", // IE and Edge
}));

const StyledOpenButton = styled(IconButton)(({ theme }) => ({
  width: "100%",
  marginLeft: 0,
  borderRadius: "15px 15px 0 0",
  boxShadow: "0px -4px 5px 0px rgba(17, 17, 26, 0.08)",
  backgroundColor: theme.palette.background.default,
  maxHeight: "50px",
  "& svg": { fontSize: "4rem" },
  "&:hover": { backgroundColor: "#e2dcdc" },
}));

const StyledDiv = styled("div")(({ theme }) => ({
  position: "relative",
  top: "-12px",
  zIndex: "11",
}));

const StyledCloseButton = styled(IconButton)(({ theme }) => ({
  width: "100%",
  marginLeft: 0,
  position: "sticky",
  maxHeight: "60px",
  top: 0,
  backgroundColor: theme.palette.background.default,
  borderRadius: 0,
  zIndex: theme.zIndex.drawer,
  "& svg": { fontSize: "3rem" },
}));

const StyledVerticalList = styled(List)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  "& .MuiCard-root": {
    height: "auto",
    width: "100%",
    [theme.breakpoints.down("md")]: {
      height: "auto",
      "& .MuiCardContent-root": {
        height: "auto",
      },
      "& .MuiCardActionArea-root": {
        height: "100%",
      },
    },
  },
}));

export default function SearchResultsMobileVerticalList({
  resultsSnippet,
  open,
  setOpen,
}: Props) {
  const [shouldShowOpenButton, setShouldShowOpenButton] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  useEffect(() => {
    setShouldShowOpenButton(resultsSnippet.length > 1 && !open);
  }, [resultsSnippet, open]);

  return (
    <StyledDiv>
      {shouldShowOpenButton && (
        <StyledOpenButton onClick={toggleDrawer(true)}>
          <ExpandLess />
        </StyledOpenButton>
      )}

      <StyledDrawer open={open}>
        {open && (
          <StyledCloseButton onClick={toggleDrawer(false)}>
            <ExpandMore />
          </StyledCloseButton>
        )}

        <StyledVerticalList>{resultsSnippet}</StyledVerticalList>
      </StyledDrawer>
    </StyledDiv>
  );
}

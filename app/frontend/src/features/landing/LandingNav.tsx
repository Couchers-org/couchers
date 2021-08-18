import { pages } from "features/landing/LandingContent";
import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-around",
  },
}));

export default function LandingNav() {
  const links = useMemo(() => {
    const pageSlugs = pages.keys
  }, [])

  return (
    <div>
      <NavLink></NavLink>
    </div>
  );
}

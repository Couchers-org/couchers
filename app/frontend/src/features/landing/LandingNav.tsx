import { MenuItem } from "@material-ui/core";
import IconButton from "components/IconButton";
import { ExpandMoreIcon } from "components/Icons";
import Menu from "components/Menu";
import { useState } from "react";
import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import makeStyles from "utils/makeStyles";
import { getLinkMenuAriaLabel } from "./constants";
import { markdownIndex } from "./markdown";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-around",
  },
}));

export default function LandingNav() {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <div>
      {markdownIndex.map((page) =>
        page.omitFromNav ? null : (
          <div>
            <NavLink to={`/${page.slug}`}>{page.linkText}</NavLink>
            {page.children && (
              <>
                <IconButton
                  aria-label={getLinkMenuAriaLabel(page.linkText)}
                  onClick={(event) =>
                    setMenuAnchor(
                      event.currentTarget === menuAnchor
                        ? null
                        : event.currentTarget
                    )
                  }
                >
                  <ExpandMoreIcon />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={!!menuAnchor}
                  onClose={() => setMenuAnchor(null)}
                >
                  {page.children.map((child) => (
                    <MenuItem>
                      <NavLink to={`/${page.slug}/${child.slug}`}>
                        {child.linkText}
                      </NavLink>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}

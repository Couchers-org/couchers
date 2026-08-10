import { ExpandLess, ExpandMore, SearchOutlined } from "@mui/icons-material";
import { Button, InputAdornment, Menu, MenuItem, styled, Typography } from "@mui/material";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import useAccountInfo from "features/auth/useAccountInfo";
import { Trans, useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Community, NodeType } from "proto/communities_pb";
import { KeyboardEvent, useState } from "react";
import { communityCreationFormURL, routeToCommunity } from "routes";

const NODE_TYPE_LABEL_KEYS: Partial<Record<NodeType, string>> = {
  [NodeType.NODE_TYPE_MACROREGION]: "communities:select_macroregion",
  [NodeType.NODE_TYPE_REGION]: "communities:select_region",
  [NodeType.NODE_TYPE_SUBREGION]: "communities:select_subregion",
  [NodeType.NODE_TYPE_LOCALITY]: "communities:select_locality",
  [NodeType.NODE_TYPE_SUBLOCALITY]: "communities:select_sublocality",
};

const StyledSearchBox = styled("li")(({ theme }) => ({
  padding: theme.spacing(1, 2),
}));

const menuId = "sub-communities-menu";

export default function SubCommunitiesDropdown({ subCommunities }: { subCommunities: Community.AsObject[] }) {
  const { t } = useTranslation(COMMUNITIES);
  const router = useRouter();
  const { data: accountInfo } = useAccountInfo();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [query, setQuery] = useState("");
  const open = !!anchorEl;

  const filteredOptions = subCommunities.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));
  const labelKey = NODE_TYPE_LABEL_KEYS[subCommunities[0].nodeType] ?? "communities:select_sub_community";

  const handleClose = () => {
    setAnchorEl(null);
    setQuery("");
  };

  const handleSelect = (option: Community.AsObject) => {
    router.push(routeToCommunity(option.communityId, option.slug));
    handleClose();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") {
      event.stopPropagation();
    }
  };

  return (
    <>
      <Button
        variant="text"
        color="primary"
        endIcon={open ? <ExpandLess /> : <ExpandMore />}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t("communities:sub_community_dropdown_a11y")}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          minWidth: { xs: 0, sm: 64 },
          pl: { xs: 0, sm: 1 },
        }}
      >
        {t(labelKey)}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableAutoFocusItem
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: { sx: { width: 300, maxWidth: "90vw", maxHeight: 288 } },
        }}
      >
        <StyledSearchBox>
          <TextField
            autoFocus
            variant="outlined"
            size="small"
            fullWidth
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t("communities:sub_community_search_placeholder")}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </StyledSearchBox>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <MenuItem key={option.communityId} onClick={() => handleSelect(option)}>
              {option.name}
            </MenuItem>
          ))
        ) : (
          <StyledSearchBox>
            <Typography variant="body2" color="var(--mui-palette-text-secondary)">
              <Trans
                t={t}
                i18nKey="communities:no_results_found_with_link"
                components={[
                  <StyledLink
                    href={communityCreationFormURL(accountInfo?.username)}
                    target="_blank"
                    rel="noreferrer noopener"
                    key="request-link"
                  />,
                ]}
              />
            </Typography>
          </StyledSearchBox>
        )}
      </Menu>
    </>
  );
}

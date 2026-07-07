import { SearchOutlined } from "@mui/icons-material";
import {
  Autocomplete as MuiAutocomplete,
  debounce,
  InputAdornment,
  styled,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import useAccountInfo from "features/auth/useAccountInfo";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useRouter } from "next/router";
import {
  Community,
  ListAllCommunitiesRes,
  SearchCommunitiesRes,
} from "proto/communities_pb";
import { useEffect, useMemo, useState } from "react";
import { communityCreationFormURL, routeToCommunity } from "routes";
import { listAllCommunities, searchCommunities } from "service/communities";

type CommunityOption = Pick<
  Community.AsObject,
  "communityId" | "name" | "slug" | "parentsList"
>;

const MIN_SEARCH_LENGTH = 3;
const COMMUNITY_SEARCH_DEBOUNCE_MS = 400;

const regionOf = (option: CommunityOption): string => {
  const parents = option.parentsList;
  if (!parents || parents.length < 2) return "";
  return parents[parents.length - 2].community?.name ?? "";
};

const StyledAutocomplete = styled(
  MuiAutocomplete<CommunityOption, false, false, false>,
)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  maxWidth: 600,
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(3),
  },
}));

const OptionRegion = styled("span")(({ theme }) => ({
  marginLeft: theme.spacing(1),
  color: "var(--mui-palette-text-secondary)",
  fontSize: theme.typography.caption.fontSize,
}));

export default function CommunitySearch() {
  const { t, i18n } = useTranslation(COMMUNITIES);
  const router = useRouter();
  const { data: accountInfo } = useAccountInfo();
  const [inputValue, setInputValue] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");

  const query = debouncedInput.trim();
  const isSearching = query.length >= MIN_SEARCH_LENGTH;

  const { data: searchData, isLoading: searchLoading } = useQuery<
    SearchCommunitiesRes.AsObject,
    RpcError
  >({
    queryKey: ["searchCommunities", query],
    queryFn: () => searchCommunities(query),
    enabled: isSearching,
  });

  const { data: browseData, isLoading: browseLoading } = useQuery<
    ListAllCommunitiesRes.AsObject,
    RpcError
  >({
    queryKey: ["listAllCommunities"],
    queryFn: listAllCommunities,
    enabled: !isSearching,
  });

  const options = useMemo<CommunityOption[]>(() => {
    if (isSearching) {
      return searchData?.communitiesList ?? [];
    }
    const all = browseData?.communitiesList ?? [];
    const lowercase = query.toLowerCase();
    const filtered = lowercase
      ? all.filter((c) => c.name.toLowerCase().includes(lowercase))
      : all;
    return [...filtered].sort(
      (a, b) =>
        regionOf(a).localeCompare(regionOf(b), i18n.language) ||
        a.name.localeCompare(b.name, i18n.language),
    );
  }, [isSearching, searchData, browseData, query, i18n.language]);

  const debouncedSetInput = useMemo(
    () =>
      debounce(
        (value: string) => setDebouncedInput(value),
        COMMUNITY_SEARCH_DEBOUNCE_MS,
      ),
    [],
  );
  useEffect(() => () => debouncedSetInput.clear(), [debouncedSetInput]);

  const handleInputChange = (_event: React.SyntheticEvent, value: string) => {
    setInputValue(value);
    debouncedSetInput(value);
  };

  const handleChange = (
    _event: React.SyntheticEvent,
    value: CommunityOption | null,
  ) => {
    if (value) {
      router.push(routeToCommunity(value.communityId, value.slug));
    }
  };

  return (
    <StyledAutocomplete
      options={options}
      loading={isSearching ? searchLoading : browseLoading}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      getOptionLabel={(option) => option.name}
      // don't let MUI re-filter: it would drop the typo-tolerant server results
      filterOptions={(x) => x}
      groupBy={isSearching ? undefined : (option) => regionOf(option)}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        const region = regionOf(option);
        return (
          <li key={key} {...optionProps}>
            {option.name}
            {isSearching && region && <OptionRegion>{region}</OptionRegion>}
          </li>
        );
      }}
      noOptionsText={
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
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={t("communities:search_communities")}
          variant="outlined"
          placeholder={t("communities:search_communities_placeholder")}
          helperText={t("communities:search_communities_helper")}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <SearchOutlined color="action" />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}

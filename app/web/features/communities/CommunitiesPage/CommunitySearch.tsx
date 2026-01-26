import { SearchOutlined } from "@mui/icons-material";
import {
  Autocomplete as MuiAutocomplete,
  InputAdornment,
  styled,
} from "@mui/material";
import StyledLink from "components/StyledLink";
import TextField from "components/TextField";
import useAccountInfo from "features/auth/useAccountInfo";
import { Trans, useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useRouter } from "next/router";
import Sentry from "platform/sentry";
import { CommunitySummary } from "proto/communities_pb";
import { useEffect, useState } from "react";
import { communityCreationFormURL, routeToCommunity } from "routes";
import { listAllCommunities } from "service/communities";

interface GroupedCommunity extends CommunitySummary.AsObject {
  regionName?: string;
}

const StyledAutocomplete = styled(
  MuiAutocomplete<GroupedCommunity, false, false, false>,
)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  maxWidth: 600,
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(3),
  },
}));

export default function CommunitySearch() {
  const { t } = useTranslation(COMMUNITIES);
  const router = useRouter();
  const { data: accountInfo } = useAccountInfo();
  const [inputValue, setInputValue] = useState("");
  const [allCommunities, setAllCommunities] = useState<GroupedCommunity[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<GroupedCommunity[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // Fetch all communities on mount
  useEffect(() => {
    const fetchAllCommunities = async () => {
      try {
        setLoading(true);
        // Use the new ListAllCommunities API - single call returns everything!
        const response = await listAllCommunities();

        // Map communities and extract immediate parent name from parents (last parent is the immediate parent)
        const communitiesWithRegion: GroupedCommunity[] =
          response.communitiesList.map((community) => ({
            ...community,
            regionName:
              community.parentsList && community.parentsList.length > 0
                ? community.parentsList[community.parentsList.length - 1]
                    .community?.name || ""
                : "",
          }));

        // Sort hierarchically: first by depth (number of parents), then by full parent path, then by name
        const sortedCommunities = communitiesWithRegion.sort((a, b) => {
          // First, sort by depth in hierarchy (fewer parents = higher in tree)
          const depthCompare = a.parentsList.length - b.parentsList.length;
          if (depthCompare !== 0) return depthCompare;

          // Then sort by the full path through the hierarchy
          const aPath = a.parentsList
            .map((p) => p.community?.name || "")
            .join("/");
          const bPath = b.parentsList
            .map((p) => p.community?.name || "")
            .join("/");
          const pathCompare = aPath.localeCompare(bPath);
          if (pathCompare !== 0) return pathCompare;

          // Finally sort by community name
          return a.name.localeCompare(b.name);
        });

        setAllCommunities(sortedCommunities);
        setFilteredOptions(sortedCommunities);
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: "CommunitySearch",
            action: "fetchAllCommunities",
          },
        });
        setAllCommunities([]);
        setFilteredOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCommunities();
  }, []);

  // Filter communities based on input
  useEffect(() => {
    if (!inputValue) {
      setFilteredOptions(allCommunities);
      return;
    }

    const lowercaseInput = inputValue.toLowerCase();
    const filtered = allCommunities.filter(
      (community) =>
        community.name.toLowerCase().includes(lowercaseInput) ||
        (community.regionName &&
          community.regionName.toLowerCase().includes(lowercaseInput)),
    );
    setFilteredOptions(filtered);
  }, [inputValue, allCommunities]);

  const handleInputChange = (_event: React.SyntheticEvent, value: string) => {
    setInputValue(value);
  };

  const handleChange = (
    _event: React.SyntheticEvent,
    value: GroupedCommunity | null,
  ) => {
    if (value) {
      router.push(routeToCommunity(value.communityId, value.slug));
    }
  };

  return (
    <StyledAutocomplete
      options={filteredOptions}
      loading={loading}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      getOptionLabel={(option) => option.name}
      groupBy={(option) => option.regionName || ""}
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

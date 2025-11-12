import { SearchOutlined } from "@mui/icons-material";
import {
  Autocomplete as MuiAutocomplete,
  InputAdornment,
  styled,
  TextField,
} from "@mui/material";
import StyledLink from "components/StyledLink";
import useAccountInfo from "features/auth/useAccountInfo";
import { Trans, useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useRouter } from "next/router";
import Sentry from "platform/sentry";
import { Community } from "proto/communities_pb";
import { useEffect, useState } from "react";
import { communityCreationFormURL, routeToCommunity } from "routes";
import { listCommunities } from "service/communities";

interface GroupedCommunity extends Community.AsObject {
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
        // First, fetch all top-level regions (communityId = 0)
        const regionsResponse = await listCommunities(0);
        const regions = regionsResponse.communitiesList;

        // Then fetch subcommunities for each region
        const allCommunitiesPromises = regions.map(async (region) => {
          const subCommunitiesResponse = await listCommunities(
            region.communityId,
          );
          return subCommunitiesResponse.communitiesList.map((community) => ({
            ...community,
            regionName: region.name,
          }));
        });

        const communitiesArrays = await Promise.all(allCommunitiesPromises);
        const flattenedCommunities = communitiesArrays.flat();

        // Sort alphabetically by region name, then by community name
        const sortedCommunities = flattenedCommunities.sort((a, b) => {
          const regionCompare = (a.regionName || "").localeCompare(
            b.regionName || "",
          );
          if (regionCompare !== 0) return regionCompare;
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

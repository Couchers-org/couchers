import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import { LngLat } from "maplibre-gl";
import { searchQueryKey } from "queryKeys";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "react-query";
import { useHistory, useLocation } from "react-router-dom";
import { searchRoute } from "routes";

import { APPLY_FILTER, FILTER_DIALOG_TITLE } from "./constants";

export default function FilterDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose(): void;
}) {
  const location = useLocation();
  const history = useHistory();
  const searchParams = useRef(new URLSearchParams(location.search));
  const { control, handleSubmit } = useForm({ mode: "onBlur" });
  const queryClient = useQueryClient();
  const onSubmit = handleSubmit(() => {
    //necessary because we don't want to cache every search for each filter
    //but we do want react-query to handle pagination
    queryClient.removeQueries(searchQueryKey());
    history.push(`${searchRoute}?${searchParams.current.toString()}`);
    onClose();
  });
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="filter-dialog-title"
    >
      <DialogTitle id="filter-dialog-title">{FILTER_DIALOG_TITLE}</DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <LocationAutocomplete
            control={control}
            defaultValue={
              searchParams.current.has("location") &&
              searchParams.current.has("lng") &&
              searchParams.current.has("lat")
                ? {
                    name: searchParams.current.get("location")!,
                    simplifiedName: searchParams.current.get("location")!,
                    location: new LngLat(
                      Number.parseFloat(searchParams.current.get("lng")!) || 0,
                      Number.parseFloat(searchParams.current.get("lat")!) || 0
                    ),
                  }
                : undefined
            }
            onChange={(value) => {
              searchParams.current.set("location", value.simplifiedName);
              searchParams.current.set("lat", value.location.lat.toString());
              searchParams.current.set("lng", value.location.lng.toString());
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit">{APPLY_FILTER}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

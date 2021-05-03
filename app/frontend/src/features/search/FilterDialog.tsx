import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import LocationAutocomplete from "features/search/LocationAutocomplete";
import { useRef } from "react";
import { useForm } from "react-hook-form";
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
  const onSubmit = handleSubmit(() => {
    history.push(`${searchRoute}?${searchParams.current.toString()}`);
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
            params={searchParams.current}
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit">{APPLY_FILTER}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

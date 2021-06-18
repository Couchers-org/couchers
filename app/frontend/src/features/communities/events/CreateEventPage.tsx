import { Typography } from "@material-ui/core";
import Button from "components/Button";
import Datepicker from "components/Datepicker";
import MarkdownInput from "components/MarkdownInput";
import PageTitle from "components/PageTitle";
import TextField from "components/TextField";
import { CREATE } from "features/constants";
import { useForm } from "react-hook-form";
import makeStyles from "utils/makeStyles";

import { CREATE_EVENT, EVENT_DETAILS, START_DATE, TITLE } from "../constants";

const useStyles = makeStyles((theme) => ({
  form: {
    "& > * + *": {
      marginTop: theme.spacing(3),
    },
  },
}));

interface CreateEventData {
  content: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
}

export default function CreateEventPage() {
  const classes = useStyles();
  const { control, errors, handleSubmit, register } =
    useForm<CreateEventData>();

  const onSubmit = handleSubmit((data) => {
    // create event mutation
  });

  return (
    <>
      <PageTitle>{CREATE_EVENT}</PageTitle>
      <form className={classes.form} onSubmit={onSubmit}>
        <TextField
          id="title"
          inputRef={register({ required: true })}
          name="title"
          label={TITLE}
        />
        <Datepicker
          control={control}
          error={!!errors.startDate?.message}
          helperText={errors.startDate?.message || ""}
          id="startDate"
          inputRef={register}
          label={START_DATE}
          name="startDate"
        />
        <Typography id="content-label" variant="body1">
          {EVENT_DETAILS}
        </Typography>
        <MarkdownInput
          control={control}
          id="content"
          name="content"
          labelId="content-label"
        />
        <Button type="submit">{CREATE}</Button>
      </form>
    </>
  );
}

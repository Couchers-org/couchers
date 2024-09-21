import {
  Card,
  CardContent,
  CardMedia,
  Theme,
  Typography,
} from "@material-ui/core";
import { eventImagePlaceholderUrl } from "appConstants";
import { Event } from "proto/events_pb";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme: Theme) => ({
  card: {
    display: "flex",
    width: "100%",
    height: theme.spacing(20),
    margin: theme.spacing(2, 0, 2, 0),
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.spacing(1),
  },
  cardMedia: {
    height: "100%",
    width: "25%",
  },
  cardContent: {
    width: "75%",
    padding: theme.spacing(2, 4),
  },
}));

const EventItem = ({ event }: { event: Event.AsObject }) => {
  const classes = useStyles({
    eventImageSrc: event.photoUrl || eventImagePlaceholderUrl,
  });

  return (
    <Card className={classes.card}>
      <CardMedia
        className={classes.cardMedia}
        component="img"
        image={event.photoUrl || eventImagePlaceholderUrl}
      />
      <CardContent className={classes.cardContent}>
        <Typography variant="h3">{event.title}</Typography>
      </CardContent>
    </Card>
  );
};

export default EventItem;

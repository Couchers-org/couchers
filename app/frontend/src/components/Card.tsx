import {
  Card as MuiCard,
  CardActionArea as MuiCardActionArea,
  CardActionAreaProps,
  CardActions as MuiCardActions,
  CardActionsProps,
  CardContent as MuiCardContent,
  CardContentProps,
  CardMedia as MuiCardMedia,
  CardMediaProps,
  CardProps,
} from "@material-ui/core";

export function Card(props: CardProps) {
  return <MuiCard {...props} />;
}
export function CardActions(props: CardActionsProps) {
  return <MuiCardActions {...props} />;
}
export function CardActionArea(props: CardActionAreaProps) {
  return <MuiCardActionArea {...props} />;
}
export function CardContent(props: CardContentProps) {
  return <MuiCardContent {...props} />;
}
export function CardMedia(props: CardMediaProps) {
  return <MuiCardMedia {...props} />;
}

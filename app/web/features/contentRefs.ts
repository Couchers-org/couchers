import type { User } from "proto/api_pb";
import type { Discussion } from "proto/discussions_pb";
import type { Event } from "proto/events_pb";
import type { PhotoGalleryItem } from "proto/galleries_pb";
import type { Message } from "proto/messages_pb";
import type { PublicTrip } from "proto/public_trips_pb";
import type { Reply } from "proto/threads_pb";

// content_refs identify reported content to moderators, see //docs/content_ref.md
export const contentRefs = {
  profile: (user: User.AsObject) => `profile/${user.userId}`,
  chatMessage: (message: Message.AsObject) => `chat/message/${message.messageId}`,
  photo: (photo: PhotoGalleryItem.AsObject) => `photo/${photo.itemId}`,
  publicTrip: (trip: PublicTrip.AsObject) => `public_trip/${trip.tripId}`,
  event: (event: Event.AsObject) => `event/${event.eventId}`,
  // a comment is referenced by its own thread id, not the thread of the
  // discussion or event it hangs off
  comment: (comment: Reply.AsObject) => `comment/${comment.threadId}`,
  // a discussion belongs to either a community or a group; the proto oneof is
  // flattened into two numbers, so the unset one comes back as 0
  discussion: (discussion: Discussion.AsObject) => {
    const owner =
      discussion.ownerCommunityId !== 0
        ? `community/${discussion.ownerCommunityId}`
        : `group/${discussion.ownerGroupId}`;
    return `${owner}/discussion/${discussion.discussionId}`;
  },
};

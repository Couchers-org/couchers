# Reported content reference (content_ref)

When content is reported by the *reporting user* to admins, the report includes information about the *author user* of that content, as well as a *content reference*.

The content reference, or `content_ref`, is a reference that uniquely identifies a piece of content and helps the admin or moderator find the flagged content. It is in many aspects similar to the path in a URL, but sometimes a page has several different pieces of content that are not uniquely identified by the page. For example, a discussion will have multiple comment on the same page.

This page documents the `content_ref`s currently in use. On the web frontend they are all built by the helpers in `app/web/features/contentRefs.ts`; keep the two in sync.

## User profile

`content_ref`: `profile/{user_id}`

Explanation: flag button on a user's profile

## Message

`content_ref`: `chat/message/{message_id}`

Explanation: message sent by one user to another, as part of a normal chat or a request

## Photo

`content_ref`: `photo/{item_id}`

Explanation: a photo in a user's profile gallery

## Public trip

`content_ref`: `public_trip/{trip_id}`

Explanation: a trip a user has made public

## Discussion

`content_ref`: `community/{community_id}/discussion/{discussion_id}` or `group/{group_id}/discussion/{discussion_id}`

Explanation: flag button on a discussion, either on the discussion's own page or on the card in a list of discussions. Discussions belong to either a community or a group, hence the two forms

## Event

`content_ref`: `event/{event_id}`

Explanation: flag button on an event, either on the event's own page or on the card in a list of events

## Comment

`content_ref`: `comment/{thread_id}`

Explanation: a comment or reply on a discussion or an event. Note that this is the thread id of the comment itself, not of the discussion or event it belongs to

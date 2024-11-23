# Design doc for unified, real-time push notification system

# TODO

* Link to object!
* Etc

## Overview

Currently we have a way of sending emails, and notifications are sent by email only, through a combination of directly firing off an email and a set of regular background jobs that fire off emails through some kind of idempotent DB polling (every few minutes).

This has a lot of problems:

1. it means users get a lot of email spam instead of just one neat email with all of the recent notifications (e.g. if a host replies to a host request, then accepts the request, and then sends you a friend request, you get three emails in rapid succession);
2. a 5-minute delay is not acceptable on mobile devices/push notifications;
3. there's no support for multi-channel notifications (e.g. user got a notification on the iOS and it was marked read, so it should not be emailed to them a few minutes later);
4. there's no throttling (only email once per day) and/or notification settings (don't get emails for events) users can set;
5. the frontend polls for messages in group chat view!

We need some unified system to deliver notifications.

## Use cases

* Host requests
  - A sends B a host request
  - B wants to get notified ASAP, both email and phone
* Replies to host requests
  - B replies to A's host request
  - A wants to get notified ASAP, both email and phone
* Generic messages
  - A sends B a message
  - B wants to get notified by phone, but short delay is okay
  - Should send a reminder to B if they miss it for longer than 4 hours
* Friend requests
  - A sends B a friend request
  - Not critical
* Discussion comments
  - A comments on a post that B made
  - B wants to get notified, not critical
* Event reminder
  - A says they're going to an event
  - A wants needs a reminder 2 hours before the event
* Event changes
  - A marks as going on an event organized by B
  - B changes the event location
  - A wants a notification

* User A sends B a host request: need

* Collapse key, messages:
  - A sends B 5 messages throughout the day
  - The messages should be collated into one
  - But should still count as 5 unread things, and all be in email/notification
* Collapse key, discussions

(user, topic, key, subtopic)

```
user =
```

e.g.

## Topics and their actions and data

* Host requests (host_request), key = host request id
  - create
  - accept
  - reject
  - confirm
  - cancel
  - message
* Messaging (chat), key = chat id
  - message
  - add_admin
  - etc
* Friend requests (friend_request), key = user id
  - send
  - accept
* Discussions (discussion), key = discussion id
  - create
  - comment (in same discussion)
  - reply (to this user's message)
* Event (event), key = event id
  - create
  - invite
  - reminder
  - change
  - cancel
  - schedule
  - broadcast?
* References (reference), key = reference id
  - receive
* Password (password), key = 0
  - change_password
* Email settings (email), key = email address
  - change
  - verify
* Phone settings (phone), key = phone number
  - change
  - verify
* API keys (api_key), key = api key id
  - create
  - revoke
* Gender setting (gender), key = 0
  - change
* Birthdate setting (birthdate), key = 0
  - change
* New login (login), key = session/api key id
  - new
* User reports (user_report), key = user report id
  - create
  - user_ban?
* Donations (donation), key = donation_id
  - receive

```py3
def notify(user_id, topic, key, action, data)
```

## Language

A *notification* is ...

An *item* is a message sent to a device. Each notification may result in many items.

## Goals

* Notifications are quick and easy to generate so they can in most cases be generated in the foreground during a sync RPC
* There is a background worker that then goes ahead and takes care of the actual delivery and "deduplication"
* Easy to add new notification types

## Requirements

The work done on notifications synchronously with the RPC must be constant. Ideally the notification will not require any additional database accesses to generate, but will just use data already fetched in the RPC.

In particular, notifications cannot figure out which devices to send the notification to in the foreground. Therefore they have to either pre-generate the stuff to be sent for each device, or store that somewhere else to be processed later.

## Some rough idea

Have "streams" for notifications:
* Backend publishes notifications into a triplet (user, topic, key), and gets back a monotone message_id
* For each triplet (u, t, k), we keep track for each registered client the last notification and last seen one?

I don't know

e.g.

```
user = 123
topic = private_message
key = 321 (user_id of sender)
```

user's topic with a key (e.g. user_id 123's "messages" topic, key "user")



???

queue: user 123

topic: conversation / host request / private messages

key:  392 (conversation id) / 432 (host request id) / 124 (other user id)



state diagram






```proto
service Notify {
  rpc SendNotification(Notification) returns (Empty) {
    // Sends a notification
  }

  rpc MarkNotificationRead(MarkNotificationReadReq) returns (Empty) {
    // Marks a notification as sent
  }
}

message Notification {

}

message MarkNotificationReadReq {
  int64 notification_id = 1;
}
```

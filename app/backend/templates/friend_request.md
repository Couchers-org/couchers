---
subject: "{{ friend_relationship.from_user.name }} wants to be your friend on Couchers.org!"
---

{% from "macros.html" import button %}

Hi {{ escape(friend_relationship.to_user.name) }}!

You've received a friend request from {{ escape(friend_relationship.from_user.name) }}!

{% if html %}

<img src="{{ friend_relationship.from_user.avatar.avatar_url }}" alt="Your New Friend's Profile Picture" >

{% endif %}

Check it out here:

{% if html %}

{{ button("Friend Requests", friend_requests_link) }}

Alternatively, click the following link: <{{ friend_requests_link }}>.

{% else %}
<{{ friend_requests_link }}>
{% endif %}

We hope you make a new friend!

The Couchers.org team

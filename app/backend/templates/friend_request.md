---
subject: "{{ friend_relationship.from_user.name|couchers_escape }} wants to be your friend on Couchers.org!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ friend_relationship.to_user.name|couchers_escape }}!

You've received a friend request from {{ friend_relationship.from_user.name|couchers_escape }}!

{% if html %}

{% if friend_relationship.from_user.avatar %}
<img src="{{ friend_relationship.from_user.avatar.thumbnail_url|couchers_safe }}" alt="Your New Friend's Profile Picture" >
{% endif %}

{% endif %}

Check it out here:

{% if html %}

{{ button("Friend Requests", friend_requests_link)|couchers_safe }}

Alternatively, click the following link: {{ link(friend_requests_link, html)|couchers_safe }}

{% else %}
<{{ friend_requests_link|couchers_safe }}>
{% endif %}

We hope you make a new friend!

The Couchers.org team

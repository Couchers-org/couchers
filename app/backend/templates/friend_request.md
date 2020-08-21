{% from "macros.html" import button %}

Hi {{ username }}!

You've received a friend request!

Check it out here:

{% if html %}

{{ button("Friend Requests", friend_requests_link) }}

Alternatively, click the following link: <{{ friend_requests_link }}>.

{% else %}
<{{ friend_requests_link }}>
{% endif %}

We hope you make a new friend!

The Couchers.org team

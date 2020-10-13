{% from "macros.html" import button %}

<p> Hi {{ name_recipient }}! </p>

<p> You've received a friend request from {{ name_sender }}! </p>

{% if html %}

<img src={{ profile_picture_or_avatar }} alt="Your New Friend's Profile Picture" >

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

---
subject: "{{ friend_relationship.to_user.name|couchers_escape }} accepted your friend request!"         
---

{% from "macros.html" import button, link, support_email %}

Hi {{ friend_relationship.from_user.name|couchers_escape }}!

{{ friend_relationship.to_user.name|couchers_escape }} has accepted your friend request!

{% if html %}

{% if friend_relationship.to_user.avatar %}
<img src="{{ friend_relationship.to_user.avatar.thumbnail_url|couchers_escape }}" alt="Your New Friend's Profile Picture" >       
{% endif %}

{% endif %}

Check it out here:

{% if html %}

{{ button("Friend Profile", friend_relationship.to_user.user_link)|couchers_safe }}

Alternatively, click the following link: {{ link(friend_relationship.to_user.user_link, html)|couchers_safe }}.

{% else %}
<{{ friend_relationship.to_user.user_link|couchers_escape }}>
{% endif %}

We hope you continue making new friends!

The Couchers.org team

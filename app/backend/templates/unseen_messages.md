---
subject: "You have unseen messages in {{ unseen_messages|length }} chats on Couchers.org!"
---

{% from "macros.html" import button %}

Hi {{ escape(user.name) }}!

You've unseen messages on Couchers.org, here's the latest:

{% for group_chat, subscription, latest_message in unseen_messages[:5] %}
{{ latest_message.author.name }} wrote{% if group_chat.title %} in "{{ group_chat.title }}"{% endif %} on {{ latest_message.time }}: "{{ latest_message.text }}"

{% endfor %}

{% if unseen_messages|length > 5 %}
... and {{ unseen_messages|length - 5}} other chats!
{% endif %}

Check it out here:

{% if html %}

{{ button("Friend Requests", group_chats_link) }}

Alternatively, click the following link: <{{ group_chats_link }}>.

{% else %}
<{{ group_chats_link }}>
{% endif %}

The Couchers.org team

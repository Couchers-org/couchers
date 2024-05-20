---
subject: "You have {{ total_unseen_message_count|couchers_escape }} unseen messages in {{ unseen_messages|length|couchers_escape }} chats on Couchers.org!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ user.name|couchers_escape }}!

You have unseen messages on Couchers.org, here's the latest:

{% for group_chat, latest_message, count in unseen_messages[:5] %}
{% if group_chat.title %}
"{{ group_chat.title|couchers_escape }}": {{ latest_message.author.name|couchers_escape }} wrote on {{ latest_message.time|couchers_escape }}: "{{ latest_message.text|couchers_escape }}" ({{ (count - 1)|couchers_escape }} more messages)
{% else %}
Private message from {{ latest_message.author.name|couchers_escape }} on {{ latest_message.time|couchers_escape }}: "{{ latest_message.text|couchers_escape }}" ({{ (count - 1)|couchers_escape }} more messages)
{% endif %}

{% endfor %}

{% if unseen_messages|length > 5 %}
... and {{ (total_unseen_message_count - 5)|couchers_escape }} more messages in {{ (unseen_messages|length - 5)|couchers_escape }} other chats!
{% endif %}

Check it out here:

{% if html %}

{{ button("See Messages", group_chats_link)|couchers_safe }}

Alternatively, click the following link: {{ link(group_chats_link, html)|couchers_safe }}

{% else %}
<{{ group_chats_link|couchers_safe }}>
{% endif %}

The Couchers.org team

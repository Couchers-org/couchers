---
subject: "You have {{ total_unseen_message_count|couchers_escape }} unseen messages in {{ unseen_messages|length|couchers_escape }} chats on Couchers.org!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ user.name|couchers_escape }}!

You have unseen messages on Couchers.org, here's the latest:

{% for chat, latest_message, count in unseen_messages[:5] %}
{% if chat.title %}
"{{ chat.title|couchers_escape }}": {{ latest_message.author.name|couchers_escape }} wrote on {{ latest_message.time|couchers_escape }}: "{{ latest_message.text|couchers_escape }}" ({{ (count - 1)|couchers_escape }} more messages)
{% else %}
Private message from {{ latest_message.author.name|couchers_escape }} on {{ latest_message.time|couchers_escape }}: "{{ latest_message.text|couchers_escape }}" ({{ (count - 1)|couchers_escape }} more messages)
{% endif %}

{% endfor %}

{% if unseen_messages|length > 5 %}
... and {{ (total_unseen_message_count - 5)|couchers_escape }} more messages in {{ (unseen_messages|length - 5)|couchers_escape }} other chats!
{% endif %}

Check it out here:

{% if html %}

{{ button("See Messages", chats_link)|couchers_safe }}

Alternatively, click the following link: {{ link(chats_link, html)|couchers_safe }}.

{% else %}
<{{ chats_link|couchers_escape }}>
{% endif %}

The Couchers.org team

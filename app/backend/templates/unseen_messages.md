---
subject: "You have {{ total_unseen_message_count }} unseen messages in {{ unseen_messages|length }} chats on Couchers.org!"
---

{% from "macros.html" import button %}

Hi {{ escape(user.name) }}!

You have unseen messages on Couchers.org, here's the latest:

{% for group_chat, latest_message, count in unseen_messages[:5] %}
{% if group_chat.title %}
"{{ group_chat.title }}": {{ latest_message.author.name }} wrote on {{ latest_message.time }}: "{{ latest_message.text }}" ({{ count - 1 }} more messages)
{% else %}
Private message from {{ latest_message.author.name }} on {{ latest_message.time }}: "{{ latest_message.text }}" ({{ count - 1 }} more messages)
{% endif %}

{% endfor %}

{% if unseen_messages|length > 5 %}
... and {{ total_unseen_message_count - 5 }} more messages in {{ unseen_messages|length - 5}} other chats!
{% endif %}

Check it out here:

{% if html %}

{{ button("See Messages", group_chats_link) }}

Alternatively, click the following link: <{{ group_chats_link }}>.

{% else %}
<{{ group_chats_link }}>
{% endif %}

The Couchers.org team

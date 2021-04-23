---
subject: "You have {{ total_unseen_message_count }} new unseen messages in {{ unseen_messages|length }} chat(s) on Couchers.org!"
---

{% from "macros.html" import button %}

Hi {{ escape(user.name) }}!

You have unseen messages on Couchers.org, here's the latest:

{% for conversation_type, latest_message, count in unseen_messages[:5] %}
{% if conversation_type == "group_chat" %}
"Groupchat": {{ latest_message.author.name }} wrote on {{ latest_message.time }}: "{{ latest_message.text }}" ({{ count - 1 }} more messages)
{% elsif conversation_type == "host_request" %} 
"Hostrequest": {{ latest_message.author.name }} wrote on {{ latest_message.time }}: "{{ latest_message.text }}" ({{ count - 1 }} more messages
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

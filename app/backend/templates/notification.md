---
subject: "{{ notification.plain_title|couchers_escape }}"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ notification.user.name|couchers_escape }}!

You missed a notification on Couchers.org.

Title: {{ notification.title|couchers_escape }}

Content: {{ notification.content|couchers_escape }}

To unsubscribe from this item {{ link(unsub_topic_key, html)|couchers_safe }}.

To unsubscribe from these types of notifications {{ link(unsub_topic_action, html)|couchers_safe }}.

To unsubscribe from all notifications, click on {{ link(unsub_all, html)|couchers_safe }}.

---
subject: "{{ notification.plain_title|couchers_escape }}"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ notification.user.name|couchers_escape }}!

You missed a notification on Couchers.org.

Title: {{ notification.title|couchers_escape }}

Content: {{ notification.content|couchers_escape }}

Debug: (topic, action) = ({{ notification.topic|couchers_escape }}, {{ notification.action|couchers_escape }})

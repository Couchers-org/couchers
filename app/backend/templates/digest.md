---
subject: "You missed {{ len(notifications)|couchers_escape }} notifications on Couchers.org"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ notification.user.name|couchers_escape }}!

This is your Couchers.org digest of notifications you missed.

{% for notification in notifications %}

Title: {{ notification.title|couchers_escape }}

Content: {{ notification.content|couchers_escape }}

Debug: (topic, action) = ({{ notification.topic|couchers_escape }}, {{ notification.action|couchers_escape }})

{% endfor %}

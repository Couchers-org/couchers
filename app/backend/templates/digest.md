---
subject: "You missed {{ notifications|length }} notifications on Couchers.org"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ user.name|couchers_escape }}!

This is your Couchers.org digest of notifications you missed.

{% for notification in notifications %}

Title: {{ notification.title|couchers_escape }}
Content: {{ notification.content|couchers_escape }}

{% endfor %}

---
subject: "New request for a community invite"
---

{% from "macros.html" import link %}

Profile: {{ link(user_link, html)|couchers_safe }}

Event Link: {{ link(event_link, html)|couchers_safe }}

Approve/deny here: <https://console.couchers.org/admin>

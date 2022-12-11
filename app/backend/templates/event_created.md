---
subject: "New couchers event in {{ event.owner_cluster.name|couchers_escape }}!"
---

{% from "macros.html" import button, link %}

{{ user }}
Stuff: {{ event.organizers, event.creator_user, event.owner_cluster.name, event.title }}
{{ button("Go To Event", event_link)|couchers_safe}} or {{ link(event_link, html)|couchers_safe }}
<{{ event_link|couchers_escape }}>
Hi {{ host_request.host.name|couchers_escape }}!

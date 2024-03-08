---
subject: "New Couchers.org event!"
---

{% from "macros.html" import button, link %}

Hi {{ user.name | couchers_escape }}!

A new event was created in your area!

{% set clusters = event.clusters %}
{% set is_plural = event.clusters | length > 1 %}
{% set first_occurrence_start = event.occurrences | first | attr("during") | attr("lower") %}
{{ event.creator_user.name | couchers_escape }} is hosting {{ event.title | couchers_escape }} for members of the {{ event.clusters | join(", ", attribute="name") | couchers_escape }} {{ "communities" if is_plural else "community" }} on {{ first_occurrence_start.strftime("%a, %b %d, %Y at %I %p") }}.

For more event details, visit: {{ link(event_link, html) | couchers_safe }}
Unsubscribe from all event notifications at: {{ link(unsubscribe_link, html) | couchers_safe }}.

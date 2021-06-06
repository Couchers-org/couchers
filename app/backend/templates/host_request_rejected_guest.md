---
subject: "{{ host_request.to_user.name|couchers_escape }} rejected your hosting request"
---

{% from "macros.html" import button, link, support_email %}

Hi {{ host_request.from_user.name|couchers_escape }},

{{ host_request.to_user.name|couchers_escape }} rejected your hosting request from {{ host_request.from_date|couchers_escape }} until {{ host_request.to_date|couchers_escape }} :/

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link)|couchers_safe }}

Alternatively, click the following link: {{ link(host_request_link, html)|couchers_safe }}.

{% else %}
<{{ host_request_link|couchers_escape }}>
{% endif %}

Thanks for using Couchers!

The Couchers.org team

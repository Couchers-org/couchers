---
subject: "You've received a host request from {{ host_request.surfer.name|couchers_escape }}!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ host_request.host.name|couchers_escape }}!

You've received a host request!

{{ host_request.surfer.name|couchers_escape }} is requesting to stay with you from {{ host_request.from_date|couchers_escape }} until {{ host_request.to_date|couchers_escape }}.

{% if html %}

{% if host_request.surfer.avatar %}
<img src="{{ host_request.surfer.avatar.thumbnail_url|couchers_escape }}" alt="Your Guest's Profile Picture" >
{% endif %}

{% endif %}

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link)|couchers_safe }}

Alternatively, click the following link: {{ link(host_request_link, html)|couchers_safe }}.

{% else %}
<{{ host_request_link|couchers_escape }}>
{% endif %}

Thanks for using Couchers!

The Couchers.org team

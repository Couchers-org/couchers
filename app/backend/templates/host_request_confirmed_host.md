---
subject: "{{ host_request.surfer.name|couchers_escape }} confirmed their hosting request!"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ host_request.host.name|couchers_escape }},

{{ host_request.surfer.name|couchers_escape }} just confirmed their hosting request from {{ host_request.from_date|couchers_escape }} until {{ host_request.to_date|couchers_escape }}!

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link)|couchers_safe }}

Alternatively, click the following link: {{ link(host_request_link, html)|couchers_safe }}.

{% else %}
<{{ host_request_link|couchers_escape }}>
{% endif %}

Thanks for using Couchers!

The Couchers.org team

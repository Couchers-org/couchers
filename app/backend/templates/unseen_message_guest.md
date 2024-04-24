---
subject: "{{ host_request.host.name|couchers_escape }} wrote a message in your hosting request"
---

{% from "macros.html" import button, link, support_email, email_link, newline %}

Hi {{ user.name|couchers_escape }}!

You have an unseen message from {{ host_request.host.name|couchers_escape }} regarding your hosting request from {{ host_request.from_date|couchers_escape }} until {{ host_request.to_date|couchers_escape }}.

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link)|couchers_safe }}

Alternatively, click the following link: {{ link(host_request_link, html)|couchers_safe }}

{% else %}
<{{ host_request_link|couchers_escape }}>
{% endif %}

The Couchers.org team

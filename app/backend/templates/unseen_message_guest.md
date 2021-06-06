---
subject: "{{ host_request.to_user.name|couchers_escape }} wrote a message in your hosting request"
---

{% from "macros.html" import button %}

Hi {{ user.name|couchers_escape }}!

You have an unseen message from {{ host_request.to_user.name|couchers_escape }} regarding your hosting request from {{ host_request.from_date|couchers_escape }} until {{ host_request.to_date|couchers_escape }}.

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link)|couchers_safe }}

Alternatively, click the following link: <{{ host_request_link|couchers_escape }}>.

{% else %}
<{{ host_request_link|couchers_escape }}>
{% endif %}

The Couchers.org team

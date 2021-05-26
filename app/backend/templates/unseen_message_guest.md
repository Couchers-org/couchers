---
subject: "{{ escape(host_request.to_user.name) }} wrote a message in your hosting request"
---

{% from "macros.html" import button %}

Hi {{ escape(user.name) }}!

You have an unseen message from {{ escape(host_request.to_user.name) }} regarding your hosting request from {{ host_request.from_date }} until {{ host_request.to_date }}.

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link) }}

Alternatively, click the following link: <{{ host_request_link }}>.

{% else %}
<{{ host_request_link }}>
{% endif %}

The Couchers.org team

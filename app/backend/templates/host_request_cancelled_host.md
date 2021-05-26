---
subject: "{{ escape(host_request.from_user.name) }} cancelled their hosting request"
---

{% from "macros.html" import button %}

Hi {{ escape(host_request.to_user.name) }},

{{ escape(host_request.from_user.name) }} cancelled their hosting request.

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link) }}

Alternatively, click the following link: <{{ host_request_link }}>.

{% else %}
<{{ host_request_link }}>
{% endif %}

Thanks for using Couchers!

The Couchers.org team

---
subject: "{{ escape(host_request.from_user.name) }} wrote a message in their hosting request"
---

{% from "macros.html" import button %}

Hi {{ escape(user.name) }}!

You have an unseen message from {{ escape(host_request.from_user.name) }} regarding their hosting request.

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link) }}

Alternatively, click the following link: <{{ host_request_link }}>.

{% else %}
<{{ host_request_link }}>
{% endif %}

The Couchers.org team

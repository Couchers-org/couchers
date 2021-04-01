---
subject: "You've received a host request from {{ escape(host_request.from_user.name) }}!"
---

{% from "macros.html" import button %}

Hi {{ escape(host_request.to_user.name) }}!

You've received a host request!

{{ escape(host_request.from_user.name) }} is requesting to stay with you from {{ host_request.from_date }} until {{ host_request.to_date }}.

{% if html %}

{% if host_request.from_user.avatar %}
<img src="{{ host_request.from_user.avatar.thumbnail_url }}" alt="Your Guest's Profile Picture" >
{% endif %}

{% endif %}

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link) }}

Alternatively, click the following link: <{{ host_request_link }}>.

{% else %}
<{{ host_request_link }}>
{% endif %}

Thanks for using Couchers!

The Couchers.org team

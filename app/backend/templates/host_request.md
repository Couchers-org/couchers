{% from "macros.html" import button %}

Hi {{ user.name }}!

You've received a host request!

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link) }}

Alternatively, click the following link: <{{ host_request_link }}>.

{% else %}
<{{ host_request_link }}>
{% endif %}

We hope you make a new friend!

The Couchers.org team
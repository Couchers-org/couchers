{% from "macros.html" import button %}

Hi {{ username_host }}!

You've received a host request from {{ username_guest }}!

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link) }}

Alternatively, click the following link: <{{ host_request_link }}>.

{% else %}
<{{ host_request_link }}>
{% endif %}

We hope you make a new friend!

The Couchers.org team

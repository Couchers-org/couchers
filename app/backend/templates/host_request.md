{% from "macros.html" import button %}

Hi {{ name_host }}!

You've received a host request!

{{ name_guest }} is requesting to stay with you from {{ from_date }} until {{ to_date }}!

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link) }}

Alternatively, click the following link: <{{ host_request_link }}>.

{% else %}
<{{ host_request_link }}>
{% endif %}

We hope you make a new friend!

The Couchers.org team

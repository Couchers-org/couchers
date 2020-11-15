{% from "macros.html" import button %}

<p> Hi {{ name_host }}! </p>

You've received a host request!

<p> {{ name_guest }} is requesting to stay with you from {{ from_date }} until {{ to_date }}. </p>

{% if html %}

<img src={{ profile_picture_or_avatar }} alt="Your Guest's Profile Picture" >

{% endif %}

Check it out here:

{% if html %}

{{ button("Host Requests", host_request_link) }}

Alternatively, click the following link: <{{ host_request_link }}>.

{% else %}
<{{ host_request_link }}>
{% endif %}

We hope you make a new friend!

The Couchers.org team

def render(notification):
    if topic == "host_request":
        args = {
            "view_link": urls.host_request(host_request_id=data.host_request_info.host_request_id),
        }
        if action == "create":
            template_name = "host_request__create"
            args["other"] = data.surfer_info
            args["text"] = data.text
            args["label"] = "sent you a host request"
        elif action == "message":
            template_name = "host_request__message"
            args["other"] = data.user_info
            args["text"] = data.text
            args["label"] = "sent you a message in " + ("their" if data.am_host else "your")
        elif action in ["accept", "reject", "confirm", "cancel"]:
            template_name = "host_request__plain"
            if action in ["accept", "reject"]:
                args["other"] = data.host_info
                args["their_your"] = "your"
            else:
                args["other"] = data.surfer_info
                args["their_your"] = "their"
            actioned = {
                "accept": "accepted",
                "reject": "rejected",
                "confirm": "confirmed",
                "cancel": "cancelled",
            }
            args["actioned"] = actioned[action]
        return template_name, args
    elif topic == "":
        pass

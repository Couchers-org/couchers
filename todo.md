# TODO

## Public trips: OfferToHost follow-ups

- [ ] **Frontend (web/mobile):** build "Offer to host" UI on the public trip detail page; call `PublicTrips.OfferToHost`.
- [ ] **Frontend:** in the host request list and thread view, branch on `host_request.public_trip_id != null` to render offer-flow copy ("Offer to host" instead of "Host request"; "X accepted your offer to host" instead of "X accepted your host request"; etc.).
- [ ] **Backend lifecycle notifications:** the offer flow currently reuses `host_request__accept/reject/confirm/cancel` notifications, so the surfer accepting an offer fires a notification with copy "X accepted your host request" (slightly off — should read "accepted your offer to host"). Add offer-aware variants — either dedicated `host_request__offer_accept/reject/confirm/cancel` topics, or branch the existing renderers on `host_request.public_trip_id != null` to swap copy.
- [ ] **`am_host` semantics in `HostRequestMessage` / `HostRequestMissedMessages`:** these notification protos carry an `am_host` boolean that's currently inferred from initiator-vs-recipient. With offer rows the initiator is the host, so the existing inference may be inverted — verify and fix.
- [ ] **Mobile:** decide whether the React Native app needs a native OfferToHost surface or whether the webview path is enough.

# Backend team meeting #7

Attending: Aapeli, Christian, Claudio, Itsi, Kamiel, Lucas, Lukas, Sam, Tina

## Notes

* Open sourcing
    - Permissive vs copyleft (GPL or AGPL)
    - Agree that permissive is OK and in line with ethos of Couchers
    - We can still control the way the way our hosted APIs/site is used through terms of service, etc (e.g. allow third party frontends)
    - Aapeli will read up on latest permissive stuff and write on #development, get OK from people, add to git, make github repo open
* Christian: is SQLite broken/not supported anymore after postgres migration?
    - Aapeli probably broke something/not intentional
    - Tina makes a point that we will need to specify to a certain database at some point, so we probably need to drop it at some point
* GIS: started working on geo feature using postgis
    - Use OSM geocoding and store coordinates + display address
* Next steps with big features and getting started on local community project

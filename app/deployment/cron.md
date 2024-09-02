# Cron jobs

The following are in `ubuntu`'s cron (`crontab -e`)

```
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# take a db backup
0 12 * * * cd /home/ubuntu/couchers/app/deployment && bash backup.sh
# reload the config in case TLS certs changed
32 4 * * * docker exec app-postgres-1 psql -U postgres -c 'SELECT pg_reload_conf();' >> /home/ubuntu/cronlog.log 2>&1
```

# User setup

```sql
create role humans;

create role humans_ro;
create role humans_rw;

grant humans to humans_ro;
grant humans to humans_rw;

grant pg_read_all_data to humans_rw;
grant pg_write_all_data to humans_rw;

grant pg_read_all_data to humans_ro;

create role NAME_ro login password 'pwd' in role humans_ro;
create role NAME_rw login password 'pwd' in role humans_rw;
```

Replace the last line of `pg_hba.conf` with:

```
hostssl all             +humans         0.0.0.0/0               scram-sha-256
hostnossl       all     postgres        172.16.0.0/12           scram-sha-256

host all all all reject
```

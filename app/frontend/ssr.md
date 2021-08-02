# SSR

```sh
yarn babel --extensions ".js,.ts,.tsx" --copy-files -w src -d dist/
NODE_IS_SERVER_SIDE=true NODE_ENV=development node dist/server/server.js
```

Navigate to http://localhost:12000/login

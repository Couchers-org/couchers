# SSR

```sh
yarn add --dev @babel/cli @babel/preset-env @babel/preset-react @babel/preset-typescript babel-plugin-module-resolver @babel/plugin-transform-runtime
yarn babel --extensions ".js,.ts,.tsx" src -d dist/
NODE_ENV=development node dist/server/server.js
```

// Clustered entrypoint for the Next.js standalone server (prod image only).
const cluster = require("cluster"); // eslint-disable-line

const WEB_WORKER_COUNT = 4;

if (!cluster.isPrimary) {
  require("./server.js"); // eslint-disable-line
} else {
  let shuttingDown = false;

  console.log(`[cluster] primary ${process.pid} starting ${WEB_WORKER_COUNT} worker(s)`);
  for (let i = 0; i < WEB_WORKER_COUNT; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(
      `[cluster] worker ${worker.process.pid} exited (code=${code}, signal=${signal}); stopping all workers`,
    );
    for (const other of Object.values(cluster.workers)) {
      other.process.kill("SIGTERM");
    }
    process.exitCode = 1;
  });

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[cluster] ${signal} received, stopping workers`);
    for (const worker of Object.values(cluster.workers)) {
      worker.process.kill(signal);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

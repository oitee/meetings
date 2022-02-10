import * as nodeWorker from "worker_threads";
import * as db from "../src/db_connection.js";
import * as model from "../src/model.js";

async function runQueries(entity, timeSlot) {
  await model.insertMeeting([entity], timeSlot.from, timeSlot.to);
}

export async function launchWorkers(entity, timeSlot, n) {
  let lastWorkerCallBack;
  const p = new Promise((resolve, reject) => {
    lastWorkerCallBack = resolve;
  });
  if (nodeWorker.isMainThread) {
    const threads = new Set();
    for (let i = 0; i < n; i++) {
      threads.add(
        new nodeWorker.Worker("./test/concurrent_requests.js", {
          workerData: { entity, timeSlot },
        })
      );
    }

    for (let worker of threads) {
      worker.on("exit", () => {
        threads.delete(worker);
        if (threads.size === 0) {
          lastWorkerCallBack();
        }
      });
    }
    for (let worker of threads) {
      worker.postMessage("go");
    }
  }
  return p;
}

if (!nodeWorker.isMainThread) {
  db.poolStart();
  nodeWorker.parentPort.once("message", async (msg) => {
    await runQueries(
      nodeWorker.workerData.entity,
      nodeWorker.workerData.timeSlot
    );
    await db.pool.end();
  });
}

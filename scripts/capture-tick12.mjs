import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const PORT = 3005;
const URL = `http://127.0.0.1:${PORT}/simulate?tick=12`;
const OUTPUT_PATH = "C:\\Users\\Riya\\.gemini\\antigravity\\brain\\ca691adc-4644-4b8e-8b14-47f410e2b8c7\\tick12_chronopolis_svd.png";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILE_DIR = "C:\\Users\\Riya\\.gemini\\antigravity\\brain\\ca691adc-4644-4b8e-8b14-47f410e2b8c7\\chrome-profile";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await sleep(500);
  }
  throw new Error(`Server did not respond within ${timeoutMs}ms`);
}

async function run() {
  console.log("Starting Next.js dev server on port", PORT, "...");
  const devProcess = spawn("cmd.exe", ["/c", "npx", "next", "dev", "-p", String(PORT), "-H", "127.0.0.1"], {
    cwd: process.cwd(),
    stdio: "pipe",
    detached: false,
  });

  devProcess.stdout.on("data", (data) => {
    const str = data.toString();
    if (str.includes("Ready") || str.includes("Local:") || str.includes("error")) {
      console.log("[Next.js]", str.trim());
    }
  });

  devProcess.stderr.on("data", (data) => {
    console.error("[Next.js err]", data.toString().trim());
  });

  try {
    console.log("Waiting for", URL, "...");
    await waitForServer(URL);
    console.log("Server is ready! Waiting 3s for client hydration and animation settling...");
    await sleep(3000);

    console.log("Capturing screenshot via headless Chrome...");
    await new Promise((resolve, reject) => {
      const chrome = spawn(
        CHROME_PATH,
        [
          "--headless=new",
          "--no-sandbox",
          "--disable-gpu",
          "--virtual-time-budget=6000",
          `--user-data-dir=${PROFILE_DIR}`,
          "--window-size=1440,960",
          `--screenshot=${OUTPUT_PATH}`,
          URL,
        ],
        { stdio: "inherit" }
      );

      chrome.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Chrome exited with code ${code}`));
        }
      });
    });

    console.log("Screenshot saved successfully to:", OUTPUT_PATH);
  } finally {
    console.log("Shutting down dev server...");
    spawn("taskkill", ["/pid", String(devProcess.pid), "/f", "/t"]);
  }
}

run()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });

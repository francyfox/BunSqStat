import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

async function main() {
  const [SERVER_SCRIPT, WEB_DIR] = [
    join(__dirname, './server/index.js'),
    join(__dirname, './web'),
  ]

  if (!existsSync(WEB_DIR) || !existsSync(SERVER_SCRIPT)) {
    throw new Error('Build app doesn\'t exist')
  }

  const processMap = [
    {
      name: 'backend',
      spawn: spawn(`bun ${SERVER_SCRIPT}`, [])
    }
  ]

  for (const process of processMap) {
    process.spawn.on("message", (message) => {
      console.log(`[${process.name}] ${message}`);
    });
  }
}

await main()
const SEED_URL = 'http://localhost:8080/admin/settings/seed';
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForApp(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(SEED_URL, { method: 'POST' });
      if (res.ok) {
        const body = await res.json();
        console.log(`[seed] Success:`, body);
        return;
      }
      console.warn(
        `[seed] Attempt ${attempt}/${MAX_RETRIES}: server responded with status ${res.status}`,
      );
    } catch (err) {
      console.warn(
        `[seed] Attempt ${attempt}/${MAX_RETRIES}: app not ready yet (${(err as Error).message})`,
      );
    }

    if (attempt < MAX_RETRIES) {
      console.log(`[seed] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
    }
  }

  console.error(`[seed] Failed to seed after ${MAX_RETRIES} attempts. Exiting.`);
  process.exit(1);
}

waitForApp().catch((err: unknown) => {
  console.error('[seed] Unexpected error:', err);
  process.exit(1);
});

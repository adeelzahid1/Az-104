/** Runs a load again after a short wait when it fails, e.g. because a connection was reset. */
export async function withRetry<T>(load: () => Promise<T>, retries = 2, waitMs = 600): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await load();
    } catch (error) {
      if (attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, waitMs * (attempt + 1)));
    }
  }
}

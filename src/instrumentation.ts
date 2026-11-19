/**
 * Runs once when the server starts. On shared hosting (cPanel / Passenger) the app is stopped after a quiet period
 * and started again by the next visitor; loading and checking the course library here, while the server boots,
 * means that visitor is not also kept waiting for it on top of the page itself.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const started = Date.now();
    const { catalog, regulatoryCatalog } = await import("@/lib/courses/catalog");
    catalog();
    regulatoryCatalog();
    console.log(`Course library ready in ${Date.now() - started} ms`);
  } catch (err) {
    console.error("Course library warm-up failed (pages will load it on first use):", err);
  }
}

import { AxiomWithoutBatching } from "@axiomhq/js";

export async function trackAxiomEvent(data: Record<string, unknown>): Promise<void> {
  const token = process.env.AXIOM_TOKEN;
  const dataset = process.env.AXIOM_DATASET;

  if (!token || !dataset) return;

  try {
    // Keep network work within the request's waitUntil lifetime on Workers.
    // A shared batching client can flush another request's events after it ends.
    const axiom = new AxiomWithoutBatching({ token });
    await axiom.ingest(dataset, [data]);
  } catch (error) {
    console.error("Failed to send Axiom analytics", error);
  }
}

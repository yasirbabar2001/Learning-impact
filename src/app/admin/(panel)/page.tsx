import { RequestsBoard } from "@/components/admin/RequestsBoard";
import { store } from "@/lib/store";
import type { TrainingRequest } from "@/lib/types";

const countSince = (requests: TrainingRequest[], days: number) => {
  const since = Date.now() - days * 86_400_000;
  return requests.filter((r) => Date.parse(r.createdAt) > since).length;
};

export default async function RequestsPage() {
  const requests = await store.listRequests();
  return <RequestsBoard requests={requests} recentCount={countSince(requests, 7)} />;
}

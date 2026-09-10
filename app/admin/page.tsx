import { getBrothers, getPointValues } from "@/lib/data";
import AdminLogForm from "./AdminLogForm";

export default async function AdminPage() {
  const [brothers, pointValues] = await Promise.all([getBrothers(), getPointValues()]);

  return (
    <div>
      <h2 className="font-display text-3xl text-parchment mb-2">Log Points</h2>
      <p className="text-parchmentDim text-sm max-w-md mb-10">
        Select one or more brothers, pick an action, and submit — this writes directly to the
        Log sheet and every total updates immediately.
      </p>
      <AdminLogForm brothers={brothers.map((b) => b.name)} pointValues={pointValues} />
    </div>
  );
}

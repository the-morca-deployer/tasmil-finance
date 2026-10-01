import { redirect } from "next/navigation";

// Policy activity lives in the vault (SOW2 Deliverable 4): Farming > Activity,
// "Policy" filter. Kept as a redirect so existing links keep working.
export default function Page() {
  redirect("/farming?tab=activity");
}

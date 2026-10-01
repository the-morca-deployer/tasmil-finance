import { redirect } from "next/navigation";

// Fees and policy rejections now live on the public evidence page; keep the old
// URL working for links already shared as SOW2 evidence.
export default function Page() {
  redirect("/traction?tab=fees");
}

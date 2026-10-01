import { redirect } from "next/navigation";

export default function Page() {
  redirect("/farming?tab=rulebook");
}

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Top up credits — Tasmil Finance",
  description: "Buy Tasmil credits with crypto or bank transfer.",
};

export default function TopupRoute() {
  redirect("/portfolio?tab=credits");
}

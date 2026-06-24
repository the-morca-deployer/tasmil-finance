import { redirect } from "next/navigation";

export default function MyAgentsRedirect() {
  redirect("/strategies/dashboard");
}

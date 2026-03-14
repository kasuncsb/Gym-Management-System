import { redirect } from "next/navigation";

export default function RegisterDashboardRedirect() {
    redirect("/member/dashboard");
}

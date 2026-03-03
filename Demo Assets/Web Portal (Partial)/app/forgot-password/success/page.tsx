import { redirect } from "next/navigation";

export default function ForgotPasswordSuccessRedirect() {
    redirect("/login");
}

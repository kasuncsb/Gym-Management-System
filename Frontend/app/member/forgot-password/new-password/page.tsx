import { redirect } from "next/navigation";

export default function ForgotPasswordNewRedirect() {
    redirect("/member/reset-password");
}

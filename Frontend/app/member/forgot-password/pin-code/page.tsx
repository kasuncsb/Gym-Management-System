import { redirect } from "next/navigation";

export default function ForgotPasswordPinRedirect() {
    redirect("/member/forgot-password");
}

import { redirect } from "next/navigation";

export default function RegisterVerifyEmailRedirect() {
    redirect("/member/verify-email");
}

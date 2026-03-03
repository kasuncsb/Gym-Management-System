import { redirect } from "next/navigation";

export default function RegisterVerifyEmailRedirect() {
    redirect("/verify-email");
}

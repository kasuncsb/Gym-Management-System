import { redirect } from "next/navigation";

export default function RegisterIdentityRedirect() {
    redirect("/member/upload");
}

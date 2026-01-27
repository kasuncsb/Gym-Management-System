import { redirect } from "next/navigation";

export default function WorkoutsRedirect() {
    redirect("/dashboard/workouts");
}

import { redirect } from "next/navigation";

export default function StaffCheckinRedirect() {
    redirect("/staff-dashboard/checkin");
}

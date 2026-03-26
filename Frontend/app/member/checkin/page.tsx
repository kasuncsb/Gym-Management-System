'use client';

import { DoorQrCheckIn } from '@/components/checkin/DoorQrCheckIn';

export default function CheckinPage() {
    return (
        <DoorQrCheckIn
            title="Door check-in"
            subtitle="Allow camera access, then scan the live QR on the simulator. Your account must be signed in; members need an active subscription to enter."
        />
    );
}

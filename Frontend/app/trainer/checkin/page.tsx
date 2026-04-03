'use client';

import { DoorQrCheckIn } from '@/components/checkin/DoorQrCheckIn';

export default function TrainerCheckinPage() {
    return (
        <div className="space-y-10">
            <DoorQrCheckIn
                title="Check-in"
                subtitle="Scan the simulator door QR to record your own entry or exit. Subscription rules apply to members only."
            />
        </div>
    );
}

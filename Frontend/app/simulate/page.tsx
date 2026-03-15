'use client';

import { useCallback, useState } from 'react';
import { QrCode, DoorOpen, CreditCard, Dumbbell, UserRoundCog, CalendarClock, RefreshCw, Activity } from 'lucide-react';
import { Card, Input, LoadingButton, PageHeader, Select } from '@/components/ui/SharedComponents';
import { getErrorMessage, opsAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useRealtimePolling } from '@/hooks/useRealtimePolling';

export default function SimulatePage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [state, setState] = useState<any>({ visits: [], payments: [], workouts: [], ptSessions: [], activeDoorOtps: [] });
  const [door, setDoor] = useState({ token: '', code: '', personId: '' });
  const [payment, setPayment] = useState({ memberId: '', planId: '', method: 'online' });
  const [workout, setWorkout] = useState({ memberId: '', durationMin: '45', caloriesBurned: '300' });
  const [shift, setShift] = useState({ trainerId: '', action: 'in' as 'in' | 'out' });
  const [session, setSession] = useState({ memberId: '', trainerId: '', sessionDate: '', startTime: '', endTime: '' });
  const [vitals, setVitals] = useState({ memberId: '', weightKg: '', heightCm: '', bmi: '', restingHr: '' });

  const refresh = useCallback(async () => {
    const [m, t, p, s] = await Promise.all([
      opsAPI.users('member'),
      opsAPI.users('trainer'),
      opsAPI.plans(),
      opsAPI.simulationState(),
    ]);
    setMembers(m ?? []);
    setTrainers(t ?? []);
    setPlans(p ?? []);
    setState(s ?? { visits: [], payments: [], workouts: [], ptSessions: [], activeDoorOtps: [] });
  }, []);

  useRealtimePolling(() => refresh().catch(() => undefined), 10000);

  const run = async (fn: () => Promise<any>, success: string) => {
    setLoading(true);
    try {
      await fn();
      toast.success('Simulation Success', success);
      await refresh();
    } catch (err) {
      toast.error('Simulation Failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const memberOptions = members.map((u) => ({ value: u.id, label: `${u.fullName} (${u.memberCode ?? u.id.slice(0, 6)})` }));
  const trainerOptions = trainers.map((u) => ({ value: u.id, label: `${u.fullName} (${u.employeeCode ?? u.id.slice(0, 6)})` }));
  const planOptions = plans.map((p) => ({ value: p.id, label: `${p.name} - Rs.${Number(p.price ?? 0).toLocaleString()}` }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Simulation Control Plane"
        subtitle="Simulate door access, payments, workouts, trainer shifts, and appointments in realtime."
        action={<LoadingButton icon={RefreshCw} onClick={() => refresh().catch(() => undefined)} variant="secondary">Refresh</LoadingButton>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><QrCode size={16} className="text-red-400" /> Door QR/OTP</h3>
          <div className="space-y-3">
            <LoadingButton
              loading={loading}
              icon={DoorOpen}
              onClick={() => run(async () => {
                const otp = await opsAPI.simulateGenerateDoorOtp(120);
                setDoor((d) => ({ ...d, token: otp.token, code: otp.code }));
              }, 'Door OTP generated')}
            >
              Generate OTP
            </LoadingButton>
            <Input label="Token" value={door.token} onChange={(e) => setDoor((d) => ({ ...d, token: e.target.value }))} />
            <Input label="OTP Code" value={door.code} onChange={(e) => setDoor((d) => ({ ...d, code: e.target.value }))} />
            <Select label="Person" options={[...memberOptions, ...trainerOptions]} value={door.personId} onChange={(e) => setDoor((d) => ({ ...d, personId: e.target.value }))} />
            <LoadingButton loading={loading} onClick={() => run(() => opsAPI.simulateDoorScan({ token: door.token, code: door.code, personId: door.personId }), 'Door scan simulated')}>
              Simulate Door Scan
            </LoadingButton>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><CreditCard size={16} className="text-red-400" /> Payment/Subscription</h3>
          <div className="space-y-3">
            <Select label="Member" options={memberOptions} value={payment.memberId} onChange={(e) => setPayment((f) => ({ ...f, memberId: e.target.value }))} />
            <Select label="Plan" options={planOptions} value={payment.planId} onChange={(e) => setPayment((f) => ({ ...f, planId: e.target.value }))} />
            <Select
              label="Method"
              options={[
                { value: 'online', label: 'Online' },
                { value: 'card', label: 'Card' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'cash', label: 'Cash' },
              ]}
              value={payment.method}
              onChange={(e) => setPayment((f) => ({ ...f, method: e.target.value }))}
            />
            <LoadingButton loading={loading} onClick={() => run(() => opsAPI.simulatePayment({ memberId: payment.memberId, planId: payment.planId, paymentMethod: payment.method as any }), 'Payment simulated')}>
              Simulate Payment
            </LoadingButton>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Dumbbell size={16} className="text-red-400" /> Workout Log</h3>
          <div className="space-y-3">
            <Select label="Member" options={memberOptions} value={workout.memberId} onChange={(e) => setWorkout((f) => ({ ...f, memberId: e.target.value }))} />
            <Input label="Duration (min)" type="number" value={workout.durationMin} onChange={(e) => setWorkout((f) => ({ ...f, durationMin: e.target.value }))} />
            <Input label="Calories" type="number" value={workout.caloriesBurned} onChange={(e) => setWorkout((f) => ({ ...f, caloriesBurned: e.target.value }))} />
            <LoadingButton loading={loading} onClick={() => run(() => opsAPI.simulateWorkout({ memberId: workout.memberId, durationMin: Number(workout.durationMin), caloriesBurned: Number(workout.caloriesBurned) }), 'Workout simulated')}>
              Simulate Workout
            </LoadingButton>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><UserRoundCog size={16} className="text-red-400" /> Trainer Shift</h3>
          <div className="space-y-3">
            <Select label="Trainer" options={trainerOptions} value={shift.trainerId} onChange={(e) => setShift((f) => ({ ...f, trainerId: e.target.value }))} />
            <Select label="Action" options={[{ value: 'in', label: 'Check In' }, { value: 'out', label: 'Check Out' }]} value={shift.action} onChange={(e) => setShift((f) => ({ ...f, action: e.target.value as 'in' | 'out' }))} />
            <LoadingButton loading={loading} onClick={() => run(() => opsAPI.simulateTrainerShift({ trainerId: shift.trainerId, action: shift.action }), 'Trainer shift simulated')}>
              Simulate Shift
            </LoadingButton>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Activity size={16} className="text-red-400" /> Device Vitals</h3>
          <div className="space-y-3">
            <Select label="Member" options={memberOptions} value={vitals.memberId} onChange={(e) => setVitals((f) => ({ ...f, memberId: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Weight (kg)" type="number" value={vitals.weightKg} onChange={(e) => setVitals((f) => ({ ...f, weightKg: e.target.value }))} placeholder="70.5" />
              <Input label="Height (cm)" type="number" value={vitals.heightCm} onChange={(e) => setVitals((f) => ({ ...f, heightCm: e.target.value }))} placeholder="175" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="BMI" type="number" value={vitals.bmi} onChange={(e) => setVitals((f) => ({ ...f, bmi: e.target.value }))} placeholder="22.4" />
              <Input label="Resting HR (bpm)" type="number" value={vitals.restingHr} onChange={(e) => setVitals((f) => ({ ...f, restingHr: e.target.value }))} placeholder="65" />
            </div>
            <LoadingButton
              loading={loading}
              onClick={() => run(() => opsAPI.simulateVitals({
                memberId: vitals.memberId,
                weightKg: vitals.weightKg ? Number(vitals.weightKg) : undefined,
                heightCm: vitals.heightCm ? Number(vitals.heightCm) : undefined,
                bmi: vitals.bmi ? Number(vitals.bmi) : undefined,
                restingHr: vitals.restingHr ? Number(vitals.restingHr) : undefined,
              }), 'Device vitals simulated')}
            >
              Simulate Vitals Capture
            </LoadingButton>
          </div>
        </Card>

        <Card padding="lg" className="xl:col-span-2">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><CalendarClock size={16} className="text-red-400" /> Appointment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Member" options={memberOptions} value={session.memberId} onChange={(e) => setSession((f) => ({ ...f, memberId: e.target.value }))} />
            <Select label="Trainer" options={trainerOptions} value={session.trainerId} onChange={(e) => setSession((f) => ({ ...f, trainerId: e.target.value }))} />
            <Input label="Date" type="date" value={session.sessionDate} onChange={(e) => setSession((f) => ({ ...f, sessionDate: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start" type="time" value={session.startTime} onChange={(e) => setSession((f) => ({ ...f, startTime: e.target.value }))} />
              <Input label="End" type="time" value={session.endTime} onChange={(e) => setSession((f) => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <div className="pt-3">
            <LoadingButton loading={loading} onClick={() => run(() => opsAPI.simulateAppointment({ ...session, startTime: `${session.startTime}:00`, endTime: `${session.endTime}:00` }), 'Appointment simulated')}>
              Simulate Appointment
            </LoadingButton>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <h3 className="text-white font-semibold mb-4">Realtime State Snapshot</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3"><p className="text-zinc-400 text-xs">Visits</p><p className="text-white text-lg font-bold">{state.visits?.length ?? 0}</p></div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3"><p className="text-zinc-400 text-xs">Payments</p><p className="text-white text-lg font-bold">{state.payments?.length ?? 0}</p></div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3"><p className="text-zinc-400 text-xs">Workouts</p><p className="text-white text-lg font-bold">{state.workouts?.length ?? 0}</p></div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3"><p className="text-zinc-400 text-xs">PT Sessions</p><p className="text-white text-lg font-bold">{state.ptSessions?.length ?? 0}</p></div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3"><p className="text-zinc-400 text-xs">Active OTPs</p><p className="text-white text-lg font-bold">{state.activeDoorOtps?.filter((o: any) => !o.expired).length ?? 0}</p></div>
        </div>
      </Card>
    </div>
  );
}


// Manages persistent timers by reconciling stored end times with Chrome alarms.
import type { ChefTimer } from '../shared/contracts';
import { timerStore } from './storage';

const ALARM_PREFIX = 'jeff-timer:';

function alarmName(id: string): string {
  return `${ALARM_PREFIX}${id}`;
}

export async function listTimers(): Promise<ChefTimer[]> {
  const timers = await timerStore.list();
  return timers.toSorted((left, right) =>
    left.endsAt.localeCompare(right.endsAt),
  );
}

export async function createTimer(
  label: string,
  durationSeconds: number,
): Promise<ChefTimer> {
  const started = Date.now();
  const timer: ChefTimer = {
    id: crypto.randomUUID(),
    label,
    durationSeconds,
    startedAt: new Date(started).toISOString(),
    endsAt: new Date(started + durationSeconds * 1_000).toISOString(),
    status: 'active',
  };
  const timers = await timerStore.list();
  await timerStore.save([...timers, timer]);
  await chrome.alarms.create(alarmName(timer.id), {
    when: Date.parse(timer.endsAt),
  });
  return timer;
}

export async function cancelTimer(id: string): Promise<void> {
  const timers = await timerStore.list();
  const timer = timers.find((candidate) => candidate.id === id);
  if (!timer || timer.status !== 'active') {
    throw new Error('That active timer no longer exists.');
  }
  const updated = timers.map((candidate) =>
    candidate.id === id
      ? { ...candidate, status: 'cancelled' as const }
      : candidate,
  );
  await timerStore.save(updated);
  await chrome.alarms.clear(alarmName(id));
}

export async function completeTimer(id: string): Promise<void> {
  const timers = await timerStore.list();
  const timer = timers.find((candidate) => candidate.id === id);
  if (!timer || timer.status !== 'active') return;

  await timerStore.save(
    timers.map((candidate) =>
      candidate.id === id
        ? { ...candidate, status: 'completed' as const }
        : candidate,
    ),
  );
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/chef-128.png'),
    title: 'Timer complete',
    message: `${timer.label} is ready.`,
    priority: 2,
  });
}

export async function reconcileTimers(): Promise<void> {
  const timers = await timerStore.list();
  const now = Date.now();
  for (const timer of timers) {
    if (timer.status !== 'active') continue;
    if (Date.parse(timer.endsAt) <= now) {
      await completeTimer(timer.id);
      continue;
    }
    const alarm = await chrome.alarms.get(alarmName(timer.id));
    if (!alarm) {
      await chrome.alarms.create(alarmName(timer.id), {
        when: Date.parse(timer.endsAt),
      });
    }
  }
}

export function timerIdFromAlarm(name: string): string | undefined {
  return name.startsWith(ALARM_PREFIX)
    ? name.slice(ALARM_PREFIX.length)
    : undefined;
}

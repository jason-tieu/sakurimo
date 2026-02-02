/**
 * Read NDJSON stream from sync API and call onProgress / onDone.
 */

export interface ProgressEvent {
  type: 'progress';
  current: number;
  total?: number;
}

export interface UnitsDoneEvent {
  type: 'done';
  ok: boolean;
  added: number;
  updated: number;
  skipped: number;
  total: number;
  errors: number;
}

export interface AssignmentsDoneEvent {
  type: 'done';
  ok: boolean;
  unitsProcessed: number;
  assignmentsUpserted: number;
  assignmentsSkipped: number;
  errors: string[];
}

export async function readUnitsSyncStream(
  url: string,
  token: string,
  onProgress: (current: number, total: number) => void,
  onDone: (data: UnitsDoneEvent) => void
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? res.statusText);
  }
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed) as ProgressEvent | UnitsDoneEvent;
        if (data.type === 'progress') {
          onProgress(data.current, data.total ?? 0);
        } else if (data.type === 'done') {
          onDone(data as UnitsDoneEvent);
          return;
        }
      } catch {
        // skip malformed line
      }
    }
  }
  if (buffer.trim()) {
    try {
      const data = JSON.parse(buffer.trim()) as UnitsDoneEvent;
      if (data.type === 'done') onDone(data);
    } catch {
      // ignore
    }
  }
  } finally {
    reader.releaseLock();
  }
}

export async function readAssignmentsSyncStream(
  url: string,
  token: string,
  onProgress: (current: number, total?: number) => void,
  onDone: (data: AssignmentsDoneEvent) => void
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? res.statusText);
  }
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed) as ProgressEvent | AssignmentsDoneEvent;
        if (data.type === 'progress') {
          onProgress(data.current, data.total);
        } else if (data.type === 'done') {
          onDone(data as AssignmentsDoneEvent);
          return;
        }
      } catch {
        // skip malformed line
      }
    }
  }
  if (buffer.trim()) {
    try {
      const data = JSON.parse(buffer.trim()) as AssignmentsDoneEvent;
      if (data.type === 'done') onDone(data);
    } catch {
      // ignore
    }
  }
  } finally {
    reader.releaseLock();
  }
}

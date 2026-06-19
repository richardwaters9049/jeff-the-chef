// Presents the first usable Jeff interface for creating local notes and persistent timers.
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { ChefTimer, Note } from '../shared/contracts';
import { extensionApi } from './api';

function remainingLabel(timer: ChefTimer, now: number): string {
  if (timer.status === 'completed') return 'Complete';
  if (timer.status === 'cancelled') return 'Cancelled';
  const remaining = Math.max(
    0,
    Math.ceil((Date.parse(timer.endsAt) - now) / 1_000),
  );
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
}

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [timers, setTimers] = useState<ChefTimer[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    const [nextNotes, nextTimers] = await Promise.all([
      extensionApi.listNotes(),
      extensionApi.listTimers(),
    ]);
    setNotes(nextNotes);
    setTimers(nextTimers);
  }, []);

  useEffect(() => {
    void refresh().catch((cause: unknown) =>
      setError(
        cause instanceof Error
          ? cause.message
          : 'Jeff could not load your data.',
      ),
    );
    const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(clock);
  }, [refresh]);

  async function createNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setError('');
    try {
      await extensionApi.createNote(
        String(form.get('title')),
        String(form.get('body')),
      );
      formElement.reset();
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Jeff could not save the note.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeNote(note: Note) {
    if (!window.confirm(`Delete “${note.title}”? This cannot be undone.`))
      return;
    setBusy(true);
    setError('');
    try {
      await extensionApi.deleteNote(note.id);
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Jeff could not delete the note.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function createTimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const minutes = Number(form.get('minutes'));
    setBusy(true);
    setError('');
    try {
      await extensionApi.createTimer(
        String(form.get('label')),
        Math.round(minutes * 60),
      );
      formElement.reset();
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Jeff could not create the timer.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function cancelTimer(timer: ChefTimer) {
    if (!window.confirm(`Cancel the “${timer.label}” timer?`)) return;
    setBusy(true);
    setError('');
    try {
      await extensionApi.cancelTimer(timer.id);
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Jeff could not cancel the timer.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-5 py-6 text-ink">
      <header className="mb-8 flex items-center gap-4">
        <img className="size-16 rounded-2xl" src="/icons/chef.svg" alt="" />
        <div>
          <p className="eyebrow">Kitchen companion</p>
          <h1 className="font-display text-3xl font-bold">Jeff The Chef</h1>
          <p className="text-sm text-ink/65">Local tools are ready.</p>
        </div>
      </header>

      {error && (
        <div
          className="mb-5 rounded-xl border border-red-800/30 bg-red-50 p-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="panel" aria-labelledby="timer-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Keep an eye on things</p>
            <h2 id="timer-heading">Timers</h2>
          </div>
          <span className="count">
            {timers.filter((timer) => timer.status === 'active').length}
          </span>
        </div>

        <form className="stack" onSubmit={createTimer}>
          <label>
            Label
            <input
              name="label"
              required
              maxLength={120}
              placeholder="Potatoes"
            />
          </label>
          <label>
            Minutes
            <input
              name="minutes"
              type="number"
              required
              min="0.5"
              max="1440"
              step="0.5"
              placeholder="12"
            />
          </label>
          <button className="primary" type="submit" disabled={busy}>
            Start timer
          </button>
        </form>

        <ul className="item-list" aria-live="polite">
          {timers.map((timer) => (
            <li key={timer.id}>
              <div>
                <strong>{timer.label}</strong>
                <span>{remainingLabel(timer, now)}</span>
              </div>
              {timer.status === 'active' && (
                <button
                  className="quiet"
                  type="button"
                  onClick={() => void cancelTimer(timer)}
                  disabled={busy}
                >
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="notes-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Remember for later</p>
            <h2 id="notes-heading">Notes</h2>
          </div>
          <span className="count">{notes.length}</span>
        </div>

        <form className="stack" onSubmit={createNote}>
          <label>
            Title
            <input
              name="title"
              required
              maxLength={120}
              placeholder="Sourdough"
            />
          </label>
          <label>
            Note
            <textarea
              name="body"
              required
              maxLength={10_000}
              rows={3}
              placeholder="Use 20 grams less water next time."
            />
          </label>
          <button className="primary" type="submit" disabled={busy}>
            Save note
          </button>
        </form>

        <ul className="item-list">
          {notes.map((note) => (
            <li key={note.id}>
              <div>
                <strong>{note.title}</strong>
                <span>{note.body}</span>
              </div>
              <button
                className="quiet danger"
                type="button"
                onClick={() => void removeNote(note)}
                disabled={busy}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <footer>
        Voice remains off until you explicitly enable it in a future build.
      </footer>
    </main>
  );
}

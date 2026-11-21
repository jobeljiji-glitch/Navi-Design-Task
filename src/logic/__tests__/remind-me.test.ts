import { describe, it, expect } from 'vitest';
import { boardFlowReducer, remindable, selectBoard, selectMoney, selectSeatRows, seatRowText, withBoard, type BoardState, type BoardFlowAction } from '../boardFlow';
import { selectFriendPage, selectRemindMe, type FriendName } from '../friendFlow';
import { SCRIPT_STEPS, applyStep, ist, runScriptTo } from '../script';
import { createInitialDemoState } from '../seed';

/** 10: "Opened" includes logged-in friends; "Not sure yet? Remind me before 7:15 PM". */

const fresh = () => withBoard(createInitialDemoState());
const run = (s: BoardState, a: BoardFlowAction) => boardFlowReducer(s, a);
const rows = (s: BoardState) => selectSeatRows(s).map(seatRowText);
const nudgesFor = (s: BoardState, name: FriendName) => s.notifications.filter((n) => n.type === `friend_reminder:${name}`).length;

function invariant(s: BoardState) {
  const m = selectMoney(s)!;
  expect(m.charged + m.unblocked + m.stillBlocked).toBe(m.blockAmount);
}

describe('10 opened: logged-in friends count without a phone number', () => {
  it('a logged-in friend who opens the link shows as "Sana · D09 · Opened, not paid"', () => {
    let s = runScriptTo(fresh(), 'amit');
    s = run(s, { type: 'SET_FRIEND_LOGGED_IN', loggedIn: true });
    s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Sana' });
    expect(rows(s)).toContain('Sana · D09 · Opened, not paid');
    expect(selectBoard(s)!.notOpenedCount).toBe(3);
  });

  it('not logged in, just opening the link: still "D09 · Not opened yet" (BMS doesn\'t know who it is)', () => {
    let s = runScriptTo(fresh(), 'amit');
    s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Sana' });
    expect(rows(s)).toContain('D09 · Not opened yet');
  });

  it('halfway and T−30 nudges go to every opened friend, logged in or with a phone number', () => {
    let s = runScriptTo(fresh(), 'amit');
    s = run(s, { type: 'SET_FRIEND_LOGGED_IN', loggedIn: true });
    s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Sana' });
    expect(remindable(s, 'halfway')).toEqual(['Sana']);
    s = run(s, { type: 'SET_CLOCK', now: ist(17, 45) });
    expect(nudgesFor(s, 'Sana')).toBe(1);
    s = run(s, { type: 'SET_CLOCK', now: ist(18, 45) });
    expect(nudgesFor(s, 'Sana')).toBe(2);
    // Never-opened friends get nothing from BMS (only Rohan's "Share a reminder" reaches them)
    for (const f of ['Priya', 'Kabir', 'Neha'] as FriendName[]) expect(nudgesFor(s, f)).toBe(0);
  });
});

describe('10 remind me', () => {
  const opened = () => run(runScriptTo(fresh(), 'amit'), { type: 'FRIEND_OPEN_LINK', name: 'Sana' });

  it('the option shows the deadline and the T−30 time from selectors', () => {
    const v = selectFriendPage(opened(), 'Sana')!.remind!;
    expect(v.lead).toBe('Not sure yet?');
    expect(v.action).toBe('Remind me before 7:15 PM');
    expect(v.toast).toBe("We'll remind you at 6:45 PM");
    expect(v.needsPhone).toBe(true);
    expect(v.requested).toBe(false);
  });

  it('asks for a phone number when BMS does not know the friend', () => {
    const s = opened();
    expect(run(s, { type: 'FRIEND_REMIND_ME', name: 'Sana' })).toBe(s);
  });

  it('logged in: no phone needed', () => {
    let s = run(opened(), { type: 'SET_FRIEND_LOGGED_IN', loggedIn: true });
    expect(selectRemindMe(s, 'Sana')!.needsPhone).toBe(false);
    s = run(s, { type: 'FRIEND_REMIND_ME', name: 'Sana' });
    expect(s.friendFlow.sessions.Sana.remindRequested).toBe(true);
  });

  it('marks the friend opened + reminder-requested: board row and sub-line', () => {
    const s = run(opened(), { type: 'FRIEND_REMIND_ME', name: 'Sana', phone: '98765 43211' });
    expect(s.friendFlow.sessions.Sana).toMatchObject({ opened: true, remindRequested: true, phone: '98765 43211' });
    const row = selectSeatRows(s).find((r) => r.seatId === 'D09')!;
    expect(seatRowText(row)).toBe('Sana · D09 · Opened, not paid');
    expect(row.note).toBe('Asked for a reminder');
    expect(selectRemindMe(s, 'Sana')).toMatchObject({ requested: true, requestedLine: 'Reminder set for 6:45 PM' });
    // The seat is not locked: anyone can still pick it
    expect(s.seats.D09.state).toBe('held');
  });

  it('sends the T−30 nudge only: no halfway nudge, nothing extra', () => {
    let s = run(opened(), { type: 'FRIEND_REMIND_ME', name: 'Sana', phone: '98765 43211' });
    s = run(s, { type: 'SET_CLOCK', now: ist(17, 45) });
    expect(nudgesFor(s, 'Sana')).toBe(0);
    s = run(s, { type: 'SET_CLOCK', now: ist(18, 45) });
    expect(nudgesFor(s, 'Sana')).toBe(1);
    expect(s.notifications.find((n) => n.type === 'friend_reminder:Sana')!.body).toBe("Rohan's holding a seat for Monsoon Heist. Pay by 7:15 PM.");
    s = run(s, { type: 'SET_CLOCK', now: ist(19, 10) });
    expect(nudgesFor(s, 'Sana')).toBe(1);
  });

  it('not offered once the T−30 time has passed, nor to a friend who paid or declined', () => {
    let s = run(opened(), { type: 'SET_CLOCK', now: ist(18, 45) });
    expect(selectRemindMe(s, 'Sana')).toBeNull();
    expect(run(s, { type: 'FRIEND_REMIND_ME', name: 'Sana', phone: '98765 43211' }).friendFlow.sessions.Sana.remindRequested).toBe(false);
    s = runScriptTo(fresh(), 'amit');
    expect(selectRemindMe(s, 'Amit')).toBeNull();
    s = runScriptTo(fresh(), 'neha');
    expect(selectRemindMe(s, 'Neha')).toBeNull();
  });

  it('a friend who asked can still pay later; the row becomes Paid', () => {
    let s = run(opened(), { type: 'FRIEND_REMIND_ME', name: 'Sana', phone: '98765 43211' });
    s = applyStep(s, 'sana');
    expect(rows(s)).toContain('Sana · D09 · Paid');
    expect(selectRemindMe(s, 'Sana')).toBeNull();
  });

  it('never-opened seats are unchanged: "Share a reminder" still counts them', () => {
    const s = run(opened(), { type: 'FRIEND_REMIND_ME', name: 'Sana', phone: '98765 43211' });
    const b = selectBoard(s)!;
    expect(b.notOpenedCount).toBe(3);
    expect(b.canShareReminder).toBe(true);
  });

  it('money invariant holds through the whole script with a reminder in it', () => {
    let s = fresh();
    for (const step of SCRIPT_STEPS) {
      s = applyStep(s, step);
      if (step === 'amit') {
        s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Priya' });
        s = run(s, { type: 'FRIEND_REMIND_ME', name: 'Priya', phone: '98765 43212' });
        expect(selectSeatRows(s).find((r) => r.seatId === 'D10')!.note).toBe('Asked for a reminder');
      }
      invariant(s);
    }
    expect(s.hold!.status).toBe('settled');
    expect(selectMoney(s)!.charged).toBe(27714);
  });
});

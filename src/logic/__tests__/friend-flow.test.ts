import { describe, it, expect } from 'vitest';
import { createInitialDemoState } from '../seed';
import { stillBlocked, unblockedSoFar } from '../money';
import {
  friendFlowReducer,
  withFriendFlow,
  selectFriendPage,
  selectFriendCheckout,
  selectFriendTicket,
  selectChatThread,
  selectShareDraft,
  selectLatestFriendNotification,
  conflictCopy,
  type AppAction,
  type AppState,
  type FriendName,
} from '../friendFlow';

const GROUP = ['D05', 'D06', 'D07', 'D08', 'D09', 'D10'];
const MIN = 60 * 1000;

function run(state: AppState, ...actions: AppAction[]): AppState {
  return actions.reduce(friendFlowReducer, state);
}

function activeHold(): AppState {
  return run(
    withFriendFlow(createInitialDemoState()),
    { type: 'BEGIN_GROUP_HOLD', seatIds: GROUP },
    { type: 'OPEN_UPI' },
    { type: 'APPROVE_HOLD', pin: '1234' },
  );
}

function shared(): AppState {
  const s = activeHold();
  const d = selectShareDraft(s)!;
  return run(s, { type: 'SHARE_TO_GROUP', text: `${d.editable}\n${d.locked}` });
}

function payFlow(s: AppState, name: FriendName): AppState {
  return run(
    s,
    { type: 'FRIEND_OPEN_LINK', name },
    { type: 'FRIEND_PAY', name },
    { type: 'FRIEND_PHONE_SUBMIT', name, phone: '98765 43210' },
    { type: 'FRIEND_OTP_OK', name },
    { type: 'FRIEND_CHOOSE_UPI', name, app: 'Kite Pay' },
    { type: 'FRIEND_APPROVE', name },
    { type: 'FRIEND_RESOLVE', name },
  );
}

const fee = (s: AppState) => s.show.fee;

describe('friendFlow: share and chat', () => {
  it('the share draft has an editable part and a locked deadline line', () => {
    const d = selectShareDraft(activeHold())!;
    expect(d.editable).toBe('Held 6 seats for Monsoon Heist, Fri, 9:15 PM. Pick your seat and pay your share:');
    expect(d.locked).toBe('Pay by 7:15 PM today · bms.link/g/k7Qx2');
  });

  it("Amit's chat shows the link preview only after Rohan sends it", () => {
    expect(selectChatThread(activeHold(), 'Amit').messages.some((m) => m.preview)).toBe(false);
    const thread = selectChatThread(shared(), 'Amit');
    const msg = thread.messages.find((m) => m.preview)!;
    expect(msg.from).toBe('Rohan');
    expect(msg.mine).toBe(false);
    expect(msg.preview).toEqual({
      title: 'Monsoon Heist',
      headline: 'Rohan is holding 6 seats for Monsoon Heist',
      subtitle: 'Fri, 9:15 PM · Cineplex Kurla · ₹277.14 each',
      deadlineNote: 'Pick your seat by 7:15 PM today',
      domain: 'bms.link',
    });
    expect(selectChatThread(shared(), 'Rohan').messages.find((m) => m.preview)!.mine).toBe(true);
  });
});

describe('friendFlow: Amit pays (acceptance)', () => {
  it('chat → pay page → phone → OTP → UPI → ticket; Rohan’s block shrinks by ₹277.14', () => {
    const before = shared();
    const blockedBefore = stillBlocked(before.hold!, before.seats, fee(before));
    const unblockedBefore = unblockedSoFar(before.hold!, before.seats, fee(before));

    let s = run(before, { type: 'FRIEND_OPEN_LINK', name: 'Amit' });
    expect(s.friendFlow.sessions.Amit.screen).toBe('pay');
    const page = selectFriendPage(s, 'Amit')!;
    expect(page.kicker).toBe('Rohan is holding seats for you');
    expect(page.meta).toBe('Fri, 9:15 PM · Cineplex: Phoenix Marketcity, Kurla');
    expect(page.whoNames).toBe('Rohan is in');
    expect(page.whoRest).toBe('5 seats left');
    expect(page.seatLabel).toBe('Your seat D08');
    expect(page.cta).toBe('Pay ₹277.14 for D08');
    expect(page.heldUntil).toBe('Held for you until 7:15 PM today');

    s = run(s, { type: 'FRIEND_PAY', name: 'Amit' });
    expect(s.friendFlow.sessions.Amit.screen).toBe('phone');
    expect(s.seats.D08.state).toBe('locked');
    expect(s.seats.D08.lockedUntil).toBe(s.clock.now + 5 * MIN);

    s = run(s, { type: 'FRIEND_PHONE_SUBMIT', name: 'Amit', phone: '98765 43210' }, { type: 'FRIEND_OTP_OK', name: 'Amit' });
    expect(s.friendFlow.sessions.Amit.screen).toBe('upi');
    s = run(s, { type: 'FRIEND_CHOOSE_UPI', name: 'Amit', app: 'Kite Pay' }, { type: 'FRIEND_APPROVE', name: 'Amit' });
    expect(s.friendFlow.sessions.Amit.screen).toBe('pending');
    expect(s.seats.D08.state).toBe('paying');

    s = run(s, { type: 'FRIEND_RESOLVE', name: 'Amit' });
    expect(s.friendFlow.sessions.Amit.screen).toBe('ticket');
    expect(s.seats.D08.state).toBe('paid_friend');
    expect(stillBlocked(s.hold!, s.seats, fee(s))).toBe(blockedBefore - 27714);
    expect(unblockedSoFar(s.hold!, s.seats, fee(s))).toBe(unblockedBefore + 27714);
    expect(s.hold!.debited).toBe(before.hold!.debited);

    const notif = selectLatestFriendNotification(s)!;
    expect(notif.title).toBe("Amit's in! 🎉");
    expect(notif.body).toBe('Amit paid for D08. ₹277.14 unblocked from your account.');

    const t = selectFriendTicket(s, 'Amit')!;
    expect(t.headline).toBe("You're in, next to Rohan");
    expect(t.seatLine).toBe('D08 · 1 ticket · Paid ₹277.14 · Sent to your SMS');
    expect(t.groupLine).toBe('2 of 6 in · Rohan, you');
  });

  it('Sana after Amit: who’s in lists payers only; ticket is next to Amit', () => {
    let s = payFlow(shared(), 'Amit');
    s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Sana' });
    const page = selectFriendPage(s, 'Sana')!;
    expect(page.whoNames).toBe('Rohan and Amit are in');
    expect(page.whoRest).toBe('4 seats left');
    expect(page.avatars).toEqual(['Rohan', 'Amit']);
    for (const name of ['Sana', 'Priya', 'Neha', 'Kabir']) {
      expect(page.whoNames).not.toContain(name);
      expect(page.tiles.map((t) => t.caption)).not.toContain(name);
    }
    expect(page.seatIds).toEqual(['D09']);
    s = payFlow(s, 'Sana');
    const t = selectFriendTicket(s, 'Sana')!;
    expect(t.headline).toBe("You're in, next to Amit");
    expect(t.groupLine).toBe('3 of 6 in · Rohan, Amit, you');
  });

  it('logged-in friends skip phone and OTP', () => {
    const s = run(shared(), { type: 'SET_FRIEND_LOGGED_IN', loggedIn: true }, { type: 'FRIEND_OPEN_LINK', name: 'Amit' }, { type: 'FRIEND_PAY', name: 'Amit' });
    expect(s.friendFlow.sessions.Amit.screen).toBe('upi');
  });
});

describe('friendFlow: failures', () => {
  it("#17 Can't make it notifies only Rohan, once", () => {
    const before = shared();
    let s = run(before, { type: 'FRIEND_OPEN_LINK', name: 'Neha' }, { type: 'FRIEND_CANT_MAKE_IT', name: 'Neha' });
    expect(s.friendFlow.sessions.Neha.screen).toBe('declined');
    expect(s.declines.map((d) => d.name)).toEqual(['Neha']);
    const added = s.notifications.length - before.notifications.length;
    expect(added).toBe(1);
    expect(s.notifications[0].title).toBe("Neha can't make it 😕");
    expect(s.notifications[0].type).toBe('friend_declined');
    s = run(s, { type: 'FRIEND_CANT_MAKE_IT', name: 'Neha' });
    expect(s.declines).toHaveLength(1);
    // Other friends never see who declined
    const page = selectFriendPage(run(s, { type: 'FRIEND_OPEN_LINK', name: 'Sana' }), 'Sana')!;
    expect(JSON.stringify(page)).not.toContain('Neha');
  });

  it('#10 two friends on the same seat: conflict copy, never naming the other friend', () => {
    let s = run(shared(), { type: 'FRIEND_OPEN_LINK', name: 'Kabir' }, { type: 'FRIEND_PICK_SEAT', name: 'Kabir', seatId: 'D09' }, { type: 'FRIEND_OPEN_LINK', name: 'Sana' });
    expect(s.friendFlow.sessions.Sana.seatId).toBe('D09');
    s = run(s, { type: 'FRIEND_PAY', name: 'Kabir' }, { type: 'FRIEND_PAY', name: 'Sana' });
    expect(s.friendFlow.sessions.Sana.screen).toBe('pay');
    const page = selectFriendPage(s, 'Sana')!;
    expect(page.conflict).toBe("Someone's paying for D09 right now. Pick another seat.");
    expect(page.conflict).not.toContain('Kabir');
    expect(page.ctaEnabled).toBe(false);
    expect(page.tiles.find((t) => t.id === 'D09')).toMatchObject({ kind: 'paying', caption: 'Paying' });
    // Tapping the taken seat also shows the copy
    s = run(s, { type: 'FRIEND_PICK_SEAT', name: 'Sana', seatId: 'D09' });
    expect(s.friendFlow.sessions.Sana.conflict).toBe(conflictCopy('D09'));
    // Picking a free seat clears it
    s = run(s, { type: 'FRIEND_PICK_SEAT', name: 'Sana', seatId: 'D10' });
    expect(selectFriendPage(s, 'Sana')!.conflict).toBeNull();
    expect(selectFriendPage(s, 'Sana')!.cta).toBe('Pay ₹277.14 for D10');
  });

  it('#10 a seat locked from the controller shows the conflict on the friend’s pre-selected seat', () => {
    let s = run(shared(), { type: 'FRIEND_OPEN_LINK', name: 'Sana' });
    s = run(s, { type: 'FRIEND_LOCK_SEAT', friendName: 'Kabir', seatId: 'D09' });
    expect(selectFriendPage(s, 'Sana')!.conflict).toBe(conflictCopy('D09'));
  });

  it('#11 seat lock expires after 5 minutes and the seat returns to the block', () => {
    let s = run(shared(), { type: 'FRIEND_OPEN_LINK', name: 'Amit' }, { type: 'FRIEND_PAY', name: 'Amit' });
    s = run(s, { type: 'ADVANCE_CLOCK', ms: 4 * MIN });
    expect(s.seats.D08.state).toBe('locked');
    s = run(s, { type: 'ADVANCE_CLOCK', ms: MIN });
    expect(s.seats.D08.state).toBe('held');
  });

  it('#12 payment fails: copy, seat still theirs for 5 minutes, try again works', () => {
    let s = run(shared(), { type: 'SET_NEXT_PAYMENT_OUTCOME', outcome: 'fail' }, { type: 'SET_FRIEND_LOGGED_IN', loggedIn: true });
    s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Sana' }, { type: 'FRIEND_PAY', name: 'Sana' }, { type: 'FRIEND_CHOOSE_UPI', name: 'Sana', app: 'Kite Pay' }, { type: 'FRIEND_APPROVE', name: 'Sana' }, { type: 'FRIEND_RESOLVE', name: 'Sana' });
    expect(s.friendFlow.sessions.Sana.screen).toBe('failed');
    expect(selectFriendCheckout(s, 'Sana').failedBody).toBe("Payment didn't go through. D09 is still yours for 5 minutes.");
    expect(s.seats.D09).toMatchObject({ state: 'locked', lockedBy: 'Sana', lockedUntil: s.clock.now + 5 * MIN });
    s = run(s, { type: 'SET_NEXT_PAYMENT_OUTCOME', outcome: 'success' }, { type: 'FRIEND_RETRY', name: 'Sana' });
    expect(s.friendFlow.sessions.Sana.screen).toBe('approve');
    s = run(s, { type: 'FRIEND_APPROVE', name: 'Sana' }, { type: 'FRIEND_RESOLVE', name: 'Sana' });
    expect(s.seats.D09.state).toBe('paid_friend');
  });

  it('#19 a pending payment past the deadline keeps the seat and succeeds in grace', () => {
    let s = run(shared(), { type: 'SET_NEXT_PAYMENT_OUTCOME', outcome: 'pending' }, { type: 'SET_FRIEND_LOGGED_IN', loggedIn: true });
    s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Priya' }, { type: 'FRIEND_PAY', name: 'Priya' }, { type: 'FRIEND_CHOOSE_UPI', name: 'Priya', app: 'Kite Pay' }, { type: 'FRIEND_APPROVE', name: 'Priya' }, { type: 'FRIEND_RESOLVE', name: 'Priya' });
    expect(s.friendFlow.sessions.Priya.screen).toBe('pending');
    expect(selectFriendCheckout(s, 'Priya').pendingBody).toBe('D10 stays yours while we wait, even past the deadline.');
    s = run(s, { type: 'SET_CLOCK', now: s.hold!.deadline - MIN }, { type: 'TICK', now: s.hold!.deadline + MIN });
    expect(s.hold!.status).toBe('resolving');
    expect(s.seats.D10.state).toBe('paying');
    s = run(s, { type: 'FRIEND_RESOLVE', name: 'Priya', outcome: 'success' });
    expect(s.seats.D10.state).toBe('paid_friend');
  });
});

describe('friendFlow: more seats, assigned mode, restart', () => {
  it('Pay for more seats: stepper up to the free count, one payment of ₹554.28', () => {
    let s = run(shared(), { type: 'FRIEND_OPEN_LINK', name: 'Sana' });
    expect(selectFriendPage(s, 'Sana')!.maxExtra).toBe(4);
    s = run(s, { type: 'FRIEND_SET_EXTRA', name: 'Sana', count: 9 });
    expect(s.friendFlow.sessions.Sana.extra).toBe(4);
    s = run(s, { type: 'FRIEND_SET_EXTRA', name: 'Sana', count: 1 });
    const page = selectFriendPage(s, 'Sana')!;
    expect(page.seatIds).toEqual(['D09', 'D10']);
    expect(page.cta).toBe('Pay ₹554.28 for D09, D10');
    s = payFlow(s, 'Sana');
    expect(s.seats.D10).toMatchObject({ state: 'paid_friend', payerName: 'Sana' });
    expect(selectFriendTicket(s, 'Sana')!.seatLine).toBe('D09, D10 · 2 tickets · Paid ₹554.28 · Sent to your SMS');
    expect(selectLatestFriendNotification(s)!.body).toBe('Sana paid for D09, D10. ₹554.28 unblocked from your account.');
  });

  it('assigned mode: "Which one is you?" with names on seats', () => {
    let s = run(withFriendFlow(createInitialDemoState()), { type: 'BEGIN_GROUP_HOLD', seatIds: GROUP }, { type: 'SET_ASSIGN_MODE', mode: 'assigned' }, { type: 'OPEN_UPI' }, { type: 'APPROVE_HOLD', pin: '1234' });
    s = run(s, { type: 'FRIEND_OPEN_LINK', name: 'Amit' });
    const page = selectFriendPage(s, 'Amit')!;
    expect(page.pickTitle).toBe('Which one is you?');
    expect(page.tiles.find((t) => t.id === 'D06')!.caption).toBe('Kabir');
    expect(page.tiles.find((t) => t.id === 'D08')!.kind).toBe('selected');
  });

  it('paying again after a ticket never re-locks a paid seat', () => {
    const s = run(payFlow(shared(), 'Amit'), { type: 'FRIEND_OPEN_LINK', name: 'Amit' }, { type: 'FRIEND_PAY', name: 'Amit' });
    expect(s.seats.D08.state).toBe('paid_friend');
    expect(s.friendFlow.sessions.Amit.screen).toBe('ticket');
  });

  it('restart resets the friend slice', () => {
    const s = run(payFlow(shared(), 'Amit'), { type: 'RESTART_DEMO' });
    expect(s.friendFlow.share).toBeNull();
    expect(s.friendFlow.sessions.Amit.screen).toBe('chat');
  });
});

# Feasibility: can Group Hold run on real UPI rails?

Group Hold blocks Rohan's friends' shares instead of charging them. On UPI that is **Reserve Pay**: the
"single block, multiple debits" (SBMD) capability the RBI enabled for UPI in 2022, which NPCI now offers as
Reserve Pay. One approval reserves an amount in the payer's account; the merchant debits parts of it later; the
rest is released.

This page lists the constraints the prototype is built around, and the open questions BookMyShow would need to
settle with NPCI and partner banks before building it. The figures below are the working assumptions for this
prototype. Confirm them against current NPCI circulars before any build.

## Constraints and how the prototype follows them

| Constraint (working assumption) | What the prototype does |
| --- | --- |
| **Block cap ₹10,000** per mandate | A hold that would block more than ₹10,000 is refused with "Group holds can block up to ₹10,000. Pick fewer seats or pay now." The group is capped by amount (a premium 10-seat group allows 7 seats). Demo: `failure=over-cap`. |
| **Validity up to 90 days** | Far longer than a group hold needs. The block ends at **showtime** ("Block ends · Today, 9:15 PM" on the approval screen). |
| **One active mandate per user** (per merchant) | One active group hold per account: "You already have a group hold running. Finish it or book these seats now." Demo: `failure=hold-running`. |
| **Limited issuer coverage**: not every bank supports Reserve Pay | The payment ladder: UPI Reserve Pay → card pre-authorisation → pay for all seats now, refunded as each friend pays. Demo: `failure=no-blocking`, `failure=no-card`. |
| **Merchant category**: cinema / ticketing MCCs are not yet enabled for Reserve Pay | Open question 1. The prototype assumes BookMyShow is enabled. |
| **Partial release is not documented**: we can debit parts of a block, but it's unclear whether part of a block can be released early | The prototype never releases money seat by seat. Friends' payments lower what's **left to cover**. Unused money is **unblocked once, at the showtime settlement**, together with the only later debit (kept seats and any fees kept). |

## Why the money model looks the way it does

- **Charged** happens at most three times: at approval (Rohan's own seat and any seats he covers), when Rohan
  covers more seats from the board, and at showtime (kept seats and fees kept on late releases).
- **Unblocked** happens once, at showtime (or at once if Rohan cancels the hold). This needs only "debit part,
  release the remainder at the end", which is the documented SBMD shape.
- **No refunds on the Reserve Pay or card rails.** A kept seat isn't charged until showtime. A friend who pays
  for it before the 9:00 PM cut-off takes the ticket, and that seat is never charged to Rohan. Refunds exist only
  on the pay-all-now fallback, where everything was charged up front.
- **Late payments close at 9:00 PM** (showtime − 15 min), with the usual 10-minute grace for a payment already
  with the bank. So nothing is pending when the block is settled at 9:15 PM, and the block ends when the
  approval screen promised.

## Open questions for NPCI / BookMyShow

1. **Cinema MCC:** is ticketing (movies, events) eligible for Reserve Pay, and on what timeline?
2. **Partial release:** can a merchant release part of an active block before it ends (for example, when a friend
   pays)? If yes, Rohan could see money unblocked seat by seat; the prototype deliberately doesn't assume this.
3. **Cap:** is ₹10,000 per mandate, per user per day, or per merchant? Can high-value shows (IMAX, events) get a
   higher limit?
4. **One mandate per user:** does an existing Reserve Pay mandate with another merchant block a new one with
   BookMyShow?
5. **Debit timing:** can the final debit run at showtime (evening, weekends) with the same success rates? What
   happens if the debit fails at showtime (retry window vs. releasing the seat, spec §5 #22)?
6. **Issuer coverage:** which banks and PSP apps support Reserve Pay today? This sets how often users fall back
   to the card pre-authorisation or pay-all-now rungs.
7. **Card pre-authorisation:** can a card hold last from the hold time to showtime (up to ~24 h for low-demand
   shows), and be captured in part?
8. **Disputes and cancellations:** how do a cinema cancellation (full refund, block released) and a user
   cancelling the mandate from their UPI app (spec §5 #8) reach BookMyShow, and how fast?

## What would change if the answers differ

- **Partial release allowed:** friends' payments could unblock money at once, instead of lowering "left to cover"
  until showtime. The copy would move from "₹277.14 less for you to cover" to "₹277.14 unblocked".
- **Cap lower than ₹10,000, or per day:** the group-size cap tightens; the pay-all-now rung covers the rest.
- **No cinema MCC:** launch on the card pre-authorisation rung first, with Reserve Pay as an upgrade.

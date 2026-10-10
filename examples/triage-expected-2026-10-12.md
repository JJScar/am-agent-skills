# Expected portfolio-triage result — 2026-10-12

Test oracle for the `portfolio-triage` skill (AM-034) and, later, the `triage_portfolio`
tool (AM-042). Run either against every record in `examples/account-records/` with
today's date set to **2026-10-12** and default thresholds. The flags, tiers and order
below are the correct answer. Anything extra is an invented flag; anything missing is a miss.

Kept outside `examples/account-records/` on purpose, so that folder only ever holds
account records.

```
Acme Corp — Critical
   [Critical] Overdue — ours: C-002 by 9 days
   [High] Renewal in 64 days
   [High] Issue left open: ACME-142 for 40 days
Vandelay Industries — Critical
   [Watch] Overdue — theirs: C-002 by 12 days
   [High] Gone quiet: 32 days
   [Critical] Champion gone: Rita Vance
Umbrella Labs — Critical
   [Critical] Renewal in 18 days
   (gap) C-001 has no due date
   (gap) no contact dates
   (gap) no champion on record
Initech — fine
```

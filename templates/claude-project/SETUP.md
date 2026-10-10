# Set up account memory in Claude

This gives Claude a memory of your customer accounts: who's who, what you've promised, what's broken and what happened last. Then you can ask things like *"which accounts need me this week?"* or *"prep my call with Acme"* without explaining everything again.

You need a claude.ai account with Projects. No installs and no technical setup.

## Before you start: get the files

You need three files from this folder:

- `project-instructions.md`
- `upload/am-skills.md`
- `upload/account-memory-settings.md`

On GitHub, open each one and click the **Download raw file** button (the arrow icon at the top right of the file).

## Setup — 5 steps

1. **Create a Project.** In claude.ai, go to **Projects → Create project** and call it something like *Account memory*.
2. **Add the instructions.** Open `project-instructions.md`, copy all of it, and paste it into the Project's **instructions**.
3. **Upload the two files.** Add `am-skills.md` and `account-memory-settings.md` to the Project's files.
4. **Start your first account.** Open a chat in the Project and paste in notes or an email from a recent customer conversation, with something like *"Log this call with Acme Corp."* Claude shows you what it found. Say **confirm**, and it gives you the account's record file.
5. **Save the record.** In the Project's files, add a new text file with exactly the name Claude gave you (e.g. `acme-corp.md`) and paste the record in. That's your account's memory.

Then try: **"Which accounts need me this week?"**

## Every day

- **After a call or important email:** paste it in and say *"log this"*. Check what Claude found, say **confirm**, then save the updated record: add the new version to the Project's files under the same name and delete the old one.
- **Before a call, QBR or renewal:** just ask (*"prep my QBR for Acme"*). Claude reads the record first.
- **Monday morning:** *"Which accounts need me this week?"*

Claude never changes a record without showing you first, and it never makes up dates or names. If something isn't known, it says so.

## Optional: let Claude read your Granola notes

If you use Granola for call notes, Claude can fetch them so you don't have to paste anything.

1. Connect Granola to Claude: in claude.ai, go to **Settings → Connectors** and add Granola.
2. In the Project's `account-memory-settings.md`, under `meeting_notes`, change `enabled: false` to `enabled: true`, and save it back to the Project the same way as a record.

Then say *"log today's Acme call"*. Claude shows you which meetings it found before opening any of them, and nothing is saved until you confirm. The settings file explains how to limit Claude to one Granola folder or keep a particular account out. Turning a setting off stops the skills from reading that tool. Disconnecting Granola in claude.ai stops Claude reaching it at all.

## Good to know

- **Your data stays in your Project.** Account records hold real customer information. Keep them in this Project, and don't paste them anywhere public.
- **Saving records is manual for now.** You copy each updated record back into the Project yourself. A later version will save records for you.
- **Lots of accounts:** if your Project grows very large, Claude may not see every file at once. If triage seems to miss an account, tell Claude, or ask it about that account by name.

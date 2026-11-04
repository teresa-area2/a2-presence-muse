# Judge journey

**Requirements:** macOS, Git, Muse Code
**1.4.13 or 1.4.14** with your own entitled account, and **Chrome or Firefox**.
Node is prepared automatically inside this checkout; no existing Node or nvm is
needed. Need another prerequisite? See [setup help](JUDGE-REFERENCE.md).

Safari is not supported for this judge rehearsal. For Intel Mac, Linux and
Windows/WSL qualification limits, see [platform support](PLATFORM-SUPPORT.md).

## Quick setup

**1. Fresh clone and requirements check** in macOS Terminal:

```sh
(
  set -e
  umask 077
  mkdir -p "$HOME/Developer"
  git clone https://github.com/teresa-area2/a2-presence-muse.git "$HOME/Developer/open-presence-muse-judge"
  cd "$HOME/Developer/open-presence-muse-judge"
  git checkout --detach submission-2026-11-04-v2
  sh scripts/judge-mac.sh requirements
)
```

The command prepares a checksum-verified local Node 22.12.0 once, then checks
tools and browser availability before installing app dependencies. It leaves
your global Node, nvm and shell settings unchanged and makes no model/OP request.
Continue only when requirements pass; account access is checked by the first
real task. If it fails, follow its listed fix and rerun `(cd "$HOME/Developer/open-presence-muse-judge" && sh scripts/judge-mac.sh requirements)`.
Use a new unused folder for a fresh rehearsal; keep the previous clone untouched.

**2. Install and sign in** from the new checkout:

```sh
(
  set -e
  cd "$HOME/Developer/open-presence-muse-judge"
  sh scripts/judge-mac.sh install
  MUSE_NO_AUTO_UPDATE=1 muse --contributor-mode off
)
```

Complete browser sign-in or `/login`, then exit Muse without sending a task.
Existing Muse installations/logins can remain; record them as pre-existing. A
fresh clone tests repository setup, not first-time account enrollment. If Meta
requests payment, it needs your own entitled plan or API billing; OP access
supplies neither. The [account reference](JUDGE-REFERENCE.md#1-connect-your-own-muse-account)
covers installation and login trouble.

<a id="3-start-with-explicit-typing-consent"></a>
**3. Start the workspace.** Read [Privacy & Data Use](PRIVACY-DATA-USE.md) first.
The consent flag enables textbox timing/category metadata to OP, including before
Send. Coding messages go separately to Muse. Testers share an OP calibration
dataset; a fixed deletion date is not enforced. The privacy notice explains how
to stop capture and request deletion. If you agree:

```sh
(
  set -e
  cd "$HOME/Developer/open-presence-muse-judge"
  sh scripts/judge-mac.sh start --consent-typing
)
```

Keep Terminal open and open the **exact printed URL** in Chrome or Firefox.
OP access is retrieved automatically; Cipher needs no npm token. Busy 8930 selects
a free port. Omit the consent flag to test ordinary fallback with live Presence off.

**4. Open the coding sessions in the browser.** Choose any prepared task and the
same entitled model for both agents. Click **Open sessions**, wait for both panes
to show **Ready**, then select **Both**. Opening the page alone does not open the
Muse sessions; no coding task starts until you send a message.

**Which task should I choose?** A prepared task gives both agents the same
starting task and common checks, making their work easier to compare. **Check
code** runs its test suite on each selected agent's work; **Send CI feedback**
is a separate action that sends each selected agent its own results to review.
Plans and conversations can still diverge, so this is not a controlled comparison.

**Your own task** starts with a clean workspace for your own goal. It has no
predefined test suite, so **Check code** and **Send CI feedback** are unavailable.
You can ask the agents to write and run tests and review their work yourself.

## Test it

1. Confirm both panes are **Ready** and **Both** is selected.
2. **Type the first prompt yourself in the message box. Do not copy and paste it.**
   This exercises textbox Presence capture. For any prepared task, type:

   > Read TASK.md and suggest an implementation plan. Wait for my response before
   > making changes.

3. Read both plans, then continue the conversation: ask Both to implement and test,
   ask questions or request changes. Handle approvals in their own panes and native
   questions for the asking agent. A finished reply should return to **Ready**;
   keep the same sessions open for follow-ups.
4. Once both are **Ready**, reselect **Both → Check code**. If checks fail, use
   **Send CI feedback**, let the agents repair and recheck. Before each check or
   feedback send, wait for both Ready and reselect Both. New turns make earlier
   checks stale; an unavailable check is not a pass.

A message during work steers the selected agent(s); Escape in the shared box
interrupts the selected agent(s) while keeping sessions open. Notice the displayed
Presence policy and readings, compare the replies and approvals, and inspect the
code-check results. Similar replies, unchanged guidance or ordinary fallback are
valid observations too; a visible difference alone does not establish a benefit.

## Save and return results

If you are rehearsing for Teresa, complete these steps before closing each pair
and return your results privately. Judges can inspect or save an export optionally;
the export is not uploaded automatically. Open **Testing and diagnostics**:

1. Complete **Effort and experience** if you can judge it. Leave unknown ratings
   blank, stop review timers and wait for **Recorded for this pair.**
2. Click **Export evidence package**, quoted excerpts unchecked. Wait for **Saved**;
   if newer evidence is available, settle checks/ratings and export the final state.
3. Find and inspect the JSON at the exact Saved path. In Finder press **⌘⇧G**:

   ```text
   ~/.local/share/a2-presence-muse/evidence/evidence-packages/
   ```

4. For teammate rehearsals, return the JSON privately to the person who asked you
   to test (Teresa for this rehearsal), with browser/macOS/Muse versions, task/model, checkout revision,
   what worked or blocked and what felt easier, harder or the same. To get the
   revision, run the command below, using your clone's path if you chose another:

   ```sh
   git -C "$HOME/Developer/open-presence-muse-judge" rev-parse HEAD
   ```

   Note Screen Sharing if used. Export saves locally; it does not upload. Keep credentials,
   real typing and raw exports out of Git/public issues.

Try the [other prepared tasks](MAC-TESTER-TASKS.md), then optionally **Your own task**,
if time/allowance permit. Use a fresh pair for each task; if exporting, save a
package for each pair before closing it. When finished, **Close sessions**, then
**Ctrl-C in the launch Terminal**. If you're
rehearsing for Teresa and are blocked before export, return the failed step and
exact nonsecret error.

## Help

For missing prerequisites or a failed runtime download, use the
[setup reference](JUDGE-REFERENCE.md), then repeat the requirements step.
Do not change your global Node. Other help and verification limits:

- [Setup reference](JUDGE-REFERENCE.md) · [Qualification status](STATUS.md)
- <a id="installer-recovery"></a>[Installer recovery](JUDGE-REFERENCE.md#installer-recovery)
- <a id="local-trust-boundary"></a>[Local trust limits](JUDGE-REFERENCE.md#local-trust-boundary)
- <a id="linux-and-windows-through-wsl2"></a>[Linux/WSL2](JUDGE-REFERENCE.md#linux-and-windows-through-wsl2)

# Judge journey

**Requirements:** macOS, Git, Muse Code
**1.4.13 or 1.4.14** with your own entitled account, and **Chrome or Firefox**.
Node is prepared automatically inside this checkout; no existing Node or nvm is
needed. Need another prerequisite? See [setup help](JUDGE-REFERENCE.md).

## Quick setup

**1. Fresh clone and requirements check** in macOS Terminal:

```sh
(
  set -e
  umask 077
  mkdir -p "$HOME/Developer"
  git clone https://github.com/teresa-area2/a2-presence-muse.git "$HOME/Developer/open-presence-muse-judge"
  cd "$HOME/Developer/open-presence-muse-judge"
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
Send. Coding messages go separately to Muse. If you agree:

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

## Test it

1. Choose **any prepared task** and the same entitled model for both agents.
   Click **Open sessions** and select **Both**.
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
interrupts the selected agent(s) while keeping sessions open. Notice the Presence
readings and replies; no difference or ordinary fallback is useful feedback too.

## Save and return results

Before closing each pair, open **Testing and diagnostics**:

1. Complete **Effort and experience** if you can judge it. Leave unknown ratings
   blank, stop review timers and wait for **Recorded for this pair.**
2. Click **Export evidence package**, quoted excerpts unchecked. Wait for **Saved**;
   if newer evidence is available, settle checks/ratings and export the final state.
3. Find and inspect the JSON at the exact Saved path. In Finder press **⌘⇧G**:

   ```text
   ~/.local/share/a2-presence-muse/evidence/evidence-packages/
   ```

4. Return the JSON privately to the person who asked you to test (Teresa for this
   rehearsal), with browser/macOS/Muse versions, task/model, `git rev-parse HEAD`,
   what worked or blocked and what felt easier, harder or the same. Note Screen
   Sharing if used. Export saves locally; it does not upload. Keep credentials,
   real typing and raw exports out of Git/public issues.

Try the [other prepared tasks](MAC-TESTER-TASKS.md), then optionally **Your own task**,
if time/allowance permit. Use a fresh pair and export per task. After the last
export, **Close sessions**, then **Ctrl-C in the launch Terminal**. If blocked before
export, return the failed step and exact nonsecret error.

## Help

For missing prerequisites or a failed runtime download, use the
[setup reference](JUDGE-REFERENCE.md), then repeat the requirements step.
Do not change your global Node. Other help and verification limits:

- [Setup reference](JUDGE-REFERENCE.md) · [Qualification status](STATUS.md)
- <a id="installer-recovery"></a>[Installer recovery](JUDGE-REFERENCE.md#installer-recovery)
- <a id="local-trust-boundary"></a>[Local trust limits](JUDGE-REFERENCE.md#local-trust-boundary)
- <a id="linux-and-windows-through-wsl2"></a>[Linux/WSL2](JUDGE-REFERENCE.md#linux-and-windows-through-wsl2)

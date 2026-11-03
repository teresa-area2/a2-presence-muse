# Judge journey

**Requirements:** macOS, Git, Node **22.12+ (22.x) or 24.1+ (24.x)**, Muse Code
**1.4.13 or1.4.14** with your own entitled account, and **Chrome or Firefox**.
Need a prerequisite? See [setup help](JUDGE-REFERENCE.md).

## Quick setup

**1. Clone and install** in macOS Terminal:

```sh
(
  set -e
  umask 077
  mkdir -p "$HOME/Developer"
  git clone https://github.com/teresa-area2/a2-presence-muse.git "$HOME/Developer/open-presence-muse"
  cd "$HOME/Developer/open-presence-muse"
  npm run judge:install
)
```

Already cloned? With sessions closed, enter that checkout, run
`git pull --ff-only`, then `npm run judge:install`. Keep your existing login.

**2. Sign in to Muse** if you are not already signed in:

```sh
MUSE_NO_AUTO_UPDATE=1 muse --contributor-mode off
```

Complete browser sign-in or `/login`, then exit Muse without sending a task.
If Meta requests payment, it needs your own entitled plan or API billing; OP access
supplies neither. The [account reference](JUDGE-REFERENCE.md#1-connect-your-own-muse-account)
covers installation and login trouble.

<a id="3-start-with-explicit-typing-consent"></a>
**3. Start the workspace.** Read [Privacy & Data Use](PRIVACY-DATA-USE.md) first.
The consent flag enables textbox timing/category metadata to OP, including before
Send. Coding messages go separately to Muse. If you agree:

```sh
(
  set -e
  cd "$HOME/Developer/open-presence-muse"
  npm run judge:start -- --consent-typing
)
```

Keep Terminal open and open the **exact printed URL** in Chrome or Firefox.
OP access is retrieved automatically; Cipher needs no npm token. Busy 8930 selects
a free port. Omit the consent flag to test ordinary fallback with live Presence off.

## Test it

1. Choose **Split a trip bill**, the same entitled model for both (start with
   **Spark 1.3** if available), then **Open sessions** and select **Both**.
2. Type naturally and send:

   > Read TASK.md and CONTRACT.md. Explain the problem and propose a short plan.
   > Wait for my response before changing files.

3. Read both plans, then tell Both to implement and test. Handle approvals in their
   own panes and native questions for that one agent. Ask Both a follow-up: “Why
   does Cara owe €45? How do you split five cents three ways?” The example should
   settle Ben paying Alice €15 and Cara paying Alice €45.
4. Once both are **Ready**, reselect **Both → Check code**. If checks fail, use
   **Send CI feedback**, let the agents repair and recheck. Before every check or
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

For unsupported/missing Node on macOS, `sh scripts/judge-mac.sh install` selects a
supported project runtime without changing global Node; use the same wrapper with
`start --consent-typing` afterward. Other help and verification limits:

- [Setup reference](JUDGE-REFERENCE.md) · [Qualification status](STATUS.md)
- <a id="installer-recovery"></a>[Installer recovery](JUDGE-REFERENCE.md#installer-recovery)
- <a id="local-trust-boundary"></a>[Local trust limits](JUDGE-REFERENCE.md#local-trust-boundary)
- <a id="linux-and-windows-through-wsl2"></a>[Linux/WSL2](JUDGE-REFERENCE.md#linux-and-windows-through-wsl2)

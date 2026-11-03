# Judge setup reference

Start with the short [Judge journey](JUDGE-QUICKSTART.md). This page retains
advanced account, privacy, recovery and platform detail for troubleshooting.
On macOS, run `sh scripts/judge-mac.sh requirements` from the fresh clone before
app installation. It first prepares a fixed, checksum-verified Node 22.12.0 under
ignored `.local/judge-node-22.12.0-arm64` (or `-x64`), then runs local tool/browser
checks. The first preparation downloads only from the pinned official Node URL;
later commands reuse the verified private cache. No global Node, nvm, shell
profiles or Muse settings are edited. This is runtime isolation, not a separate
OS sandbox; native Muse approvals and sandboxing stay in place.

Use `sh scripts/judge-mac.sh install` and `sh scripts/judge-mac.sh start` for the
same local runtime throughout. Install checks requirements before app dependencies;
requirements alone never installs dependencies or starts a server. The underlying
`sh scripts/judge-requirements.sh` check is read-only, but requires a compatible
Node already on PATH. Direct npm commands are an advanced alternative requiring
Node 22.12+ (22.x) or 24.1+ (24.x) selected in that shell. No local version check
proves account/billing/model access or browser capture.

**Use Chrome or Firefox for this rehearsal.** Teresa reports that the Mini works
and textbox capture works in both browsers. Safari failed in the Screen Sharing
setup; exact browser versions and the cause are unverified. This does not establish
a general Safari limitation or a difference between direct and remote operation.
Record your browser/version and whether you are at the Mac or using Screen Sharing.

The intended judge route is a **local macOS workspace**, using the judge's own
authorized Muse account. Linux and Windows via WSL2 are additional implementation
targets; their current verification status is listed below. The browser is the interface; a local server runs two real
Muse Code sessions. A static website alone cannot run them. There is no hosted
judge service or shared Meta account in this submission.

Before account setup, install Git and Meta's Muse Code CLI. The macOS helper
provides its own Node 22.12.0; you do not need to install Node or nvm. Native protocol startup, steering and interruption were
checked with **1.4.13 / R6996.1** and **1.4.14 / R7309.1**. The full real-model
coding/Presence qualification remains on 1.4.13. The operator-reported working
Mini rehearsal does not independently qualify every version/account/browser path.
Other schema fingerprints refuse before sessions open. This
project does not redistribute Meta's binary. The harness uses Unix process groups,
private Unix files and local sockets. Native Windows launchers refuse before loading
credentials or starting a workspace; use the WSL2 route below. **Check code** uses
Apple's sandbox on macOS, or an optional Bubblewrap sandbox on Linux. Missing or
denied isolation leaves checks unavailable; generated tests never run directly on
the host as a fallback. See [platform verification](PLATFORM-SUPPORT.md).

## 0. Clone the public repository

Use **macOS Terminal**. GitHub sign-in is not required. Clone once into a new
folder under `~/Developer`:

```sh
(
  set -e
  umask 077
  mkdir -p "$HOME/Developer"
  git clone https://github.com/teresa-area2/a2-presence-muse.git "$HOME/Developer/open-presence-muse-judge"
  git -C "$HOME/Developer/open-presence-muse-judge" rev-parse HEAD
)
```

Keep that full revision with your results; there is no extra SHA to request or
paste. Read this journey from the cloned checkout so instructions match its code.
If this directory already contains your working clone, keep it and resume at the
first unfinished step. Do not overwrite it or pull changes during an open pair.
Later command blocks explicitly enter this checkout; use your actual path if you
chose another location.

## Comparison configuration

Both agents use isolated configurations with optional imports of personal rules
and skills from other agent configurations disabled. Task-local instructions and
skills, coding tools, questions and normal approvals remain available. Your normal
Muse settings files are not edited.

If your everyday Muse setup relies on those imports, this workspace can behave
differently. **Without Presence is the configured comparison baseline**, not a
copy of your complete everyday Muse environment. Applying the same isolation to
both agents supports the comparison; it does not establish equivalent experience
or results in a differently configured environment.

For everyday Presence-enhanced Muse, the recommended direction is to preserve the
user's chosen configuration and add Presence alongside it. That separate mode is
not implemented or qualified in this submission.

Earlier exports retain their original source/configuration identity. The current
explicit isolation must not be assumed to have applied to older runs, nor should
older results be relabelled as results from this build.

## 1. Connect your own Muse account

You need **one** authorized Muse billing route, not necessarily a separately
created API key:

| Route | What you supply | What to verify |
| --- | --- | --- |
| Muse Code subscription/onboarding | Your own Meta account and an available active Muse Code plan | Onboarding connects its Muse Code credential; confirm the selected model and remaining plan allowance |
| Meta Model API pay-as-you-go or approved credits | Your own authorized API key, with billing/credit and model access | Additional manually created keys use API billing, even if you also have a Muse Code subscription |

A Meta account sign-in by itself does not establish either route. The included
OP access supplies neither Muse entitlement nor model usage. Both coding
agents consume your own allowance; the optional Observer uses separate model
usage. See Meta's [authentication](https://dev.meta.ai/docs/muse-code/auth),
[subscription](https://dev.meta.ai/docs/muse-code/subscriptions) and
[API billing](https://dev.meta.ai/help/billing/set-up-billing) documentation.

Install Muse from [Meta's official instructions](https://dev.meta.ai/docs/muse-code):

```sh
curl -fsSL https://dev.meta.ai/install.sh | sh
MUSE_NO_AUTO_UPDATE=1 muse --version
MUSE_NO_AUTO_UPDATE=1 muse --contributor-mode off
```

Use the first-run browser sign-in or `/login` inside that standalone session.
Finish account onboarding, then leave it without sending a coding prompt. The
harness also forces contributor mode off for both isolated agents.

If you deliberately choose your own API-key billing route instead, create the key
in your Meta Model API account and store it through Muse. This Bash prompt keeps
the key out of shell history, command arguments and the visible input:

```sh
bash -c '
  set -o pipefail
  IFS= read -r -s -p "Your own Meta API key: " judge_muse_key || exit 1
  printf "\n" >&2
  test -n "$judge_muse_key" || exit 1
  printf "%s" "$judge_muse_key" | MUSE_NO_AUTO_UPDATE=1 muse auth set --api-key-stdin
  judge_muse_status=$?
  unset judge_muse_key
  exit "$judge_muse_status"
'
```

If storing authentication reports an error, stop: an older readable auth file does
not establish that the intended new account/key was saved.

Never use another person's key or put a Meta key in this checkout, the Area2 access
file, chat, screenshots or the app's message box. Do not create an extra paid API
key merely because a subscription browser login needs troubleshooting.

### Check the harness-specific credential location

The isolated sessions currently require Muse's existing file-backed credential.
Check only that it is readable; do not print or edit it:

```sh
if test -r "${XDG_CONFIG_HOME:-$HOME/.config}/muse/auth.json"; then
  echo 'Stored Muse credential file is readable; entitlement is not yet tested.'
else
  echo 'STOP: file-backed Muse login unavailable. Report this before opening sessions.'
fi
```

The harness references that file from each private arm; it does not copy it into
the repository. It removes `META_API_KEY` from the child environment, so exporting
that variable alone will not authenticate these panes. A Keychain-only login has
not been qualified here. If the file check fails, stop and report it; do not extract
Keychain secrets, invent an auth file or bypass the check. A present file still
does not verify valid credentials, billing or model access.

After onboarding, run `MUSE_NO_AUTO_UPDATE=1 muse --version` again.
The reviewed Muse versions are **1.4.13 / R6996.1** and **1.4.14 / R7309.1**.
The official installer can supply a newer build. If the version or schema is not
reviewed, report it rather than changing the protocol allowlist. The harness
disables auto-update for its spawned processes. Fresh judge browser login and
subscription-backed use remain to be observed; existing-account checks are not
that qualification.

## 2. Install the submitted checkout

The designated temporary file at `judge-access/temporary-credentials.json`
is OP-only and supplies no Muse access. Normal installation does not read it or
require npm authentication. A fresh clone intentionally omits the local access file. First consented startup
downloads the owner-published demo file from a fixed historical HTTPS URL, verifies
its pinned hash and OP-only schema/expiry, and saves it locally with mode0600. An
explicit `--access /absolute/path/to/your/OP-file.json` remains authoritative and
never downloads a fallback. Do not substitute unrelated production credentials. The installer
does not read this file.

```sh
(
  set -e
  cd "$HOME/Developer/open-presence-muse-judge"
  sh scripts/judge-mac.sh install
)
```

The macOS helper always uses the same checkout-local Node 22.12.0, even if your
global Node is supported. It verifies the official archive before extraction and
refuses an unsafe/incomplete cache without replacing existing data. A failed
download installs no app dependencies; retry the same command when connectivity
is restored. Do not install nvm or change global Node to recover. The `~/Developer`
location avoids common macOS protected Desktop/Documents-folder prompts; use a
new unused directory for a fresh clone rather than overwriting a previous pair.

If the approved checkout, local runtime and browser build are already ready, continue
from startup in that checkout. No fresh clone or reinstall is required just to
restart. Keep the actual checkout revision recorded; use your existing path if different.

The intended command performs the locked anonymous npm install without dependency
install scripts, builds the browser bundle and checks setup. It reads no access
file or user/global npm credentials: temporary registry-only user and empty global
configs are used and removed before build/check. Existing project `.npmrc` files
are refused, and proxy variables are not forwarded. No Cipher archive,
`node_modules` or compiled browser bundle is committed.

The public lite packages and a fresh empty-cache anonymous install were verified
locally on 3 November, followed by the normal judge installer/build. Existing
import names are aliases to React-lite3.0.0/core-lite2.1.0; the original private
packages have not become public. If npm reports access or version errors, stop
and report them; do not create a new npm token. The prior public-judge npm token was revoked
on 3 November 2026.

### Installer recovery

On a normal failure or catchable Ctrl-C, termination or terminal hangup, the
installer waits for its owned npm process group to stop before removing its
temporary configuration. Build/check steps receive no copied npm credential.

`judge_access_cleanup_unconfirmed` means installation failed because the owned
process group's termination is uncertain. No later build/check steps run. The
helper deliberately withholds cleanup to avoid racing that uncertain process;
the error names its originally allocated directory for checked recovery. It was
created owner-only (0700, with npm config 0600). The normal public install's
config contains registry settings, not a credential; an explicitly selected
legacy private install may contain a copied npm credential, never the OP secret. That path is not proof of its current
identity or permissions. Do not immediately start another installation.

`judge_access_cleanup_failed` means no owned process has unconfirmed termination,
but file cleanup failed or the directory's identity changed. A process may never
have started. This also stops installation; no
directory is presented as a verified recovery target. Preserve the error and ask
the maintainer to inspect it rather than deleting an unverified path.

Ask the maintainer to confirm the failed attempt's process identity and exit, then
verify the reported directory's ownership and remove only that attempt's directory.
Do not kill unrelated npm/Muse processes or delete all `a2-judge-access-*` folders;
another active judge session may own one. A force-kill or OS crash can also leave
temporary files and needs the same checked recovery. Keep directory contents and
the supplied credential bundle out of feedback/screenshots.

### Host permissions and settings errors

A command launched through Codex inherits its host execution sandbox. An `EPERM`
while creating config/session directories can therefore differ from running the
same command in macOS Terminal. Keep the exact nonsecret error and command; use
Terminal as the primary route, or a supported per-command approved execution in
Codex when that sandbox boundary is the cause. This does not authorize disabling
Muse’s own sandbox or approvals.

Do not recursively chmod your home or settings, reset credentials, replace auth
files or delete old sessions to bypass a startup error. Preserve existing settings
and backups. There is no universal automatic migration between Muse settings
schemas: report the installed build and safe error, then obtain a version-specific
repair rather than guessing a new settings format.

### Local trust boundary

Run this workspace on a trusted personal machine and OS session. It binds to
loopback, but a local process or another local user able to reach that port can
request the browser bootstrap token. Browser Host/Origin checks do not authenticate
OS users or isolate the API from other local callers. The workspace does not
provide a multi-user-host security boundary.

Do not expose the port through a public tunnel or use it on a machine with
untrusted local users/processes. A remotely hosted or isolated multi-user service
would need a separately authenticated design; adding another caller-supplied
header would not provide it. No such gateway is included here.

## 3. Start with explicit typing consent

Use **macOS Terminal** to start the local workspace and leave that terminal open.
If setup is complete, enter `~/Developer/open-presence-muse-judge` (or your actual
checkout) and use `sh scripts/judge-mac.sh start` below with the consent flag if
you agree. It reuses the verified local Node; no reinstall is needed.

Read [Privacy & Data Use](PRIVACY-DATA-USE.md) first. The message box supplies
key timings/categories, a session identifier and time/timezone context to
Area2/Open Presence for collaboration guidance. This is not anonymous data.
Your coding messages/task context and optional Observer requests go separately
to Meta/Muse, as described in the notice. The Mac background collector is not needed.

`--consent-typing` is the local consent action: opening sessions then authorizes
capture automatically, with no additional local entry checkbox. Metadata can be
sent while you type, before Send. Choosing the Without recipient does not disable
capture; only the With agent receives Presence guidance. The Pulse represents
policy, not numeric personal measurements.

**Close sessions** or Ctrl-C stops this session's future capture. A model interrupt
is not consent withdrawal; stopping does not delete saved records or recall an
already-dispatched upstream request. For coding without live Presence, launch
without the flag. Requesting an Observer explanation/assessment is a separate action.

After reading the notice and agreeing to this typing-metadata processing:

```sh
(
  set -e
  cd "$HOME/Developer/open-presence-muse-judge"
  sh scripts/judge-mac.sh start --consent-typing
)
```

Open the **exact URL printed by this startup** in Chrome or Firefox. Without
`--port`, the launcher tries 8930; only if that port is already occupied does it ask
the OS for an available port and print the new URL. To request an available port
directly, use `sh scripts/judge-mac.sh start --consent-typing --port 0` on macOS. An explicit
`--port 8931` remains authoritative and fails if unavailable; it does not silently
choose another port.

A fallback port leaves any older workspace running. It neither moves nor restores
its sessions. Do not kill an unknown listener, reuse an unverified old page or
assume a reused browser tab belongs to this launch. If you intend to continue a
known open comparison, verify its identity and URL instead of starting another.
If a `localhost` alias returns 403, use the printed `127.0.0.1` address; the Host
guard is intentional. Starting the server or opening sessions sends no model task.

The owner reports that the dated Open Presence grant configuration expires at
**17:00 UTC on 15 November 2026**; current service acceptance was not freshly
verified. The launcher independently refuses the supplied OP bundle from the
start of 15 November UTC. The generated
private client configuration carries that cutoff into a running workspace: new
OP Auth/capture dispatches and subsequent guidance selections fail closed at or
after it. Retained guidance becomes ordinary fallback while Muse coding sessions
continue. A request started earlier can finish later, but its late result cannot
become eligible guidance. This is a client-clock guard, not a verified server
expiry; server-side revocation/limits can reject access earlier. The revoked npm
token is unrelated to this OP cutoff. The current transport uses the supplied account's `internal` mode;
the same OP credentials are intentionally supplied to judges, as confirmed by the
owner. The owner reports one retained calibration subject shared by Teresa and
testers in the 28–29 October Muse configuration: local session IDs do not isolate
norms and one participant's activity can influence later normalization. Teresa
accepts this for the demo. Quotas, current server state and deletion remain unverified.

## 4. Complete one coding conversation

Select **Split a trip bill** and the same entitled model for both agents. Spark 1.3
and Wonder 1.0 are selectable; start with Spark 1.3 for both if your account permits
it. Report model-access trouble before substituting; record any model change.
Open the sessions. The task is an expense calculation: Alice paid €90 for a shared
apartment; Ben paid €30 for dinner shared by Ben and Cara. The intended result is
Ben paying Alice €15 and Cara paying Alice €45.

Send to **Both**, adding a short note by normal typing rather than simulated input:

> Read TASK.md and CONTRACT.md. Explain the problem and propose a short plan in
> ordinary language. Wait for my response before changing files.

Then authorize implementation and ask a natural follow-up, such as explaining
Cara's €45 or splitting five cents three ways. Approve task-local commands inside
each pane. Approval permits that displayed action; it does not certify its result.
Keep sends on Both for comparable input histories. Different questions/decisions
can make the histories different; the evidence should record that honestly.

A native question is answered in its own pane or through **Reply in message box**
with that one agent selected. **Both** does not answer two native questions. A
follow-up sent while an agent is working steers its work. **Escape** from the
shared message box interrupts the selected recipient(s); verify **Both** first
to target both. Escape inside a pane targets that pane. Interruption keeps the
sessions open; record any one-sided actions with your result.

Guidance can change on later model requests. Missing, rejected or withdrawn
guidance uses ordinary fallback. A neutral policy or similar answers is not proof
of a broken connection; inspect the reading and request-delivery evidence. Neither
delivery nor a visual difference alone establishes better work or human benefit.

After the follow-up, wait until both agents are **Ready** with no pending question,
approval or turn. Reselect **Both**, then click **Check code**. If checks fail, use
**Send CI feedback**, allow the repair and check again. Repeat the final check
after any later turn, including an explanation-only reply: earlier checks become
stale. A model's claim that its tests pass is not the harness result.
Before **every Check code or Send CI feedback**, wait until both agents are Ready
and reselect Both; clicking a pane or handling its approval can change recipients.

**Check code** runs public and frozen checks in a separate read-only
sandbox with no host network and bounded time/output. **Send CI feedback** sends each
selected agent its own checked results for repair. On Linux it requires `/usr/bin/bwrap` and permitted unprivileged user namespaces;
`npm run check:linux-sandbox` performs a synthetic real-kernel qualification with
no credentials or model calls. An unavailable sandbox never becomes an unsandboxed
run or a passing check. Native Windows still requires WSL2.

The optional **See Presence impact** action makes a separate Muse call with
selected conversations/work files and Presence, interaction and self-reported
experience evidence. These materials can contain private information or embedded
secrets. Read the [Observer disclosure](OBSERVER-REPORT.md) and the action's warning
before using it. It remains one click; no automatic assessment or new confirmation
step is added. Observer usage is tracked separately from both coding agents.

## 5. Save and return your result

Complete this before closing the pair or switching tasks:

1. Open **Testing and diagnostics → Effort and experience**. Record each side's
   effort and interruptions if you can judge them; leave unknown ratings blank.
   If using review timers, stop them. Wait for **Recorded for this pair.** after
   the last rating.
2. Click **Export evidence package**. Leave **Include quoted public excerpts**
   unchecked initially. Export makes no model call. Wait for a confirmed **Saved**
   result; an error or “a file may exist” is not confirmed success. If **Newer
   evidence is available**, settle the checks/ratings and export the final snapshot.
3. Locate the exact JSON path shown. The shared per-user folder is:

   ```text
   ~/.local/share/a2-presence-muse/evidence/evidence-packages/
   ```

   In Finder, press **⌘⇧G** and enter that folder. Inspect the JSON locally before
   sharing; full transcripts/work-file contents are excluded, but assessment text
   or optional excerpts can still contain task details. Keep the file unchanged.
4. Return that JSON **privately to the person who asked you to test**, together
   with a short note using the [feedback template](TESTER-FEEDBACK-TEMPLATE.md):

   ```text
   Checkout revision / macOS / Node / Muse / browser and version:
   Direct keyboard or Screen Sharing:
   Task and model:
   Setup, login, capture, approvals, checks and export: worked or blocked?
   Final check result for Without / With:
   What felt easier, harder or the same? Any different inputs or decisions?
   Evidence filename, or exact nonsecret error if no export was possible:
   ```

   For the team rehearsal, return this to Teresa through your agreed private
   channel. Export saves locally; it does not upload or notify anyone. Keep raw
   exports, credentials, real typing and Capsules out of Git and public issues.
   Failed, blocked and neutral outcomes are useful; no Presence effect is required.

If startup fails before you can export, return the failed step, exact nonsecret
error, checkout revision and available version outputs. Do not reset credentials
or repeatedly reinstall to obtain a passing result.

## 6. Explore more, then close cleanly

After saving the first result, try the remaining prepared tasks if time and your
Muse allowance permit. Each task uses a **fresh pair**, with the same task/model
and shared instructions for both agents. Save one result package per pair.

| Task | What to check in conversation |
| --- | --- |
| Save conflicts | What happens to your latest unsaved draft after a conflicting save? |
| Booking rules | How do duplicate reservations and cancellation affect capacity? |
| Batch import | Which rows survive a mixed-validity customer import? |
| Notification routing | How do quiet hours interact with the existing rules? |

**Your own task** is optional and starts a clean workspace without frozen
acceptance checks. The [task battery](MAC-TESTER-TASKS.md) adds task-order suggestions
and result-folder examples; the steps on this page are sufficient for the judge
journey.

To switch tasks, save/export, use **Close sessions**, select the next task and
**Open sessions**. Keep the server running. Once finished, export the last pair,
use **Close sessions**, then press **Ctrl-C in its launch terminal**. This stops
that workspace and future capture; saved evidence remains. Native conversations
do not restore from an export after a backend restart. Report unconfirmed cleanup
before starting another workspace; do not kill unrelated processes.

## Linux and Windows through WSL2

For Linux, install Git, Muse and Node22.12+ within22 or24.1+ within24. After
your own Muse sign-in, use `npm run judge:install`, then
`npm run judge:start -- --consent-typing` after reading the consent notice. The
Mac helper does not run on Linux. The optional independent verifier requires
Bubblewrap from the distribution's maintained package repository. On Debian or
Ubuntu, `sudo apt-get install git bubblewrap` installs those prerequisites; the
judge decides whether to install system packages. Run `npm run check:linux-sandbox`
before relying on Check code. Exit2 means isolation is unavailable. Do not disable
host security policies or add privileges to turn that result into a pass.

Windows users need **WSL2**, not a native PowerShell/Node launch. If WSL2 is not
already installed, follow [Microsoft's installation guide](https://learn.microsoft.com/en-us/windows/wsl/install).
Within the Linux distribution:

1. Put the checkout/package in your Linux home, such as `~/open-presence-muse`,
   rather than `/mnt/c`. The first consented startup retrieves temporary OP
   access and saves its ignored local file with mode0600.
2. Install and run **Linux** Git, Node22 and Muse there. Start `MUSE_NO_AUTO_UPDATE=1 muse --contributor-mode off` and use first-run sign-in or `/login` with
   your own account; open its displayed sign-in URL in your browser if necessary.
   Do not copy another person's Muse auth or Windows credential store.
3. Run `npm run judge:install`, then `npm run judge:start -- --consent-typing`.
   Open the exact URL printed by this startup in your Windows browser. WSL's localhost
   forwarding must work; do not expose the server on `0.0.0.0` to work around it.
4. Stop with Ctrl-C in the same WSL terminal. Use the optional Linux sandbox check
   above; WSL2 itself does not prove the verifier can create its namespaces.

Microsoft documents [Linux-filesystem storage](https://learn.microsoft.com/en-us/windows/wsl/filesystems)
and [Windows-browser localhost access](https://learn.microsoft.com/en-us/windows/wsl/networking).
These are setup instructions, not a claim of a completed Windows/WSL rehearsal.
A successful Linux container test does not qualify WSL's browser forwarding,
Windows authentication UX or an independent judge's live OP typing.

## If access is unavailable

After Cipher is installed, `sh scripts/judge-mac.sh start` on macOS without `--consent-typing` opens
ordinary fallback with live OP off and does not read an OP credential. Real Muse
coding still needs your own entitled account. This tests fallback, not adaptation.

For a genuinely credential-free repository check:

```sh
npm run check:setup
npm run demo:offline
```

The second command runs generated synthetic textbox events through stub inference
and reports JSON. It does not use the Cipher SDK, real OP, Muse, typing or
calibration. It checks mechanisms, not the real end-to-end product experience.
Full offline tests after installation are `npm run test:offline`.

## Hosting and verification status

A hosted version would need authenticated judge sessions, isolated native workers,
approved model/service credentials and billing, tenant separation and a reviewed
remote gateway. The existing loopback server/token is not that gateway. Do not
expose it publicly or describe a static deployment as a hosted Muse demo.

Current checked behavior and remaining rehearsal limits are in [STATUS](STATUS.md). Offline
passes, authenticated service access, real model calls and a judge's independent
sign-in/typing are separate checks. See [temporary-access handling](../judge-access/README.md)
for the current expiry/scope evidence and release boundary.

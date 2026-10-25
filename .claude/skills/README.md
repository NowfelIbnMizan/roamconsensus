# Project skills

Skills Claude Code loads when working in this repo. Copied unchanged from their open-source repos; update by copying a newer version over the folder.

| Skill | Source | License |
|---|---|---|
| `impeccable` (`/impeccable critique`, `polish`, `layout`, `typeset`, `colorize`, `animate`, `delight`, `overdrive`, …) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) `plugin/skills/impeccable` @ b29942e (v4.7.0) | Apache 2.0, see `impeccable/LICENSE` and `impeccable/NOTICE.md` |
| `principle-experience-first` | [backnotprop/pstack](https://github.com/backnotprop/pstack) @ e44668c | MIT, see its `LICENSE` |
| `principle-exhaust-the-design-space` | [backnotprop/pstack](https://github.com/backnotprop/pstack) @ e44668c | MIT, see its `LICENSE` |
| `grill-me` (`/grill-me`, manual only: interviews you to sharpen a plan) | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/productivity/grill-me` @ 5beb35b | MIT, see its `LICENSE` |
| `grilling` (needed by `grill-me`; also triggers on "grill me" phrases) | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/productivity/grilling` @ 5beb35b | MIT, see its `LICENSE` |

`impeccable/scripts/impeccable` downloads its engine binary from the impeccable GitHub releases (checksum-verified) into `~/.impeccable` on first use. If that fails, the skill falls back to reading the project files directly.

`grill-me` is a one-line wrapper that calls `grilling`, so keep both folders. Copied instead of `claude plugin install mattpocock-skills@claude-plugins-official` (that installs the whole bundle per machine); don't do both or skills show up twice. `agents/openai.yaml` files are for Codex and are ignored by Claude Code.

Keep the site's travel-journal look (see `src/components/art.tsx` and the palette in `src/app/globals.css`) when applying these.

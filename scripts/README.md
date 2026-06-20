# Scripts

Each directory contains one installable Tampermonkey script.

Existing root-level scripts may remain at the repository root when their committed `@updateURL` points there.

Use this layout:

```text
scripts/
  script-name/
    script-name.user.js
    README.md
```

Personal hostnames, tokens, and debug-only settings belong in Tampermonkey storage or ignored local files, not in committed scripts.

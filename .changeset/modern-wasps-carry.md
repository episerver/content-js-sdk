---
'@optimizely/cms-cli': patch
---

Fix components glob exclusions and precedence: !dir now excludes nested files, and pattern
order determines which content type wins on key conflicts

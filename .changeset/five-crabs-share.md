---
'@optimizely/cms-sdk': patch
---

Fix empty options in form selection fields

Dropdown, radio and checkbox fields render their choices again. The CMS returns the `Options` metadata as a JSON string, which was read as an object and produced an empty list.

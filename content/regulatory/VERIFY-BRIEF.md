# Verification pass for a jurisdiction map

The map `content/regulatory/jurisdictions/<code>.json` was written from official-domain search results without
opening the pages. Your job: open the official texts and confirm, correct or downgrade every entry.

## How to fetch (WebFetch does NOT work in this session; use Bash + curl)

```bash
mkdir -p /tmp/claude-0/verify-<code>
curl -s --http1.1 -L --max-time 60 -A 'LearningImpact-research/1.0 (+https://learningimpact.pk)' -o /tmp/claude-0/verify-<code>/x.html '<url>'
# HTML -> text:
python3 -c "import re,sys,html;t=open(sys.argv[1],errors='ignore').read();t=re.sub(r'(?s)<(script|style).*?</\1>','',t);t=re.sub(r'<[^>]+>',' ',t);print(re.sub(r'\s+',' ',html.unescape(t)))" /tmp/claude-0/verify-<code>/x.html > /tmp/claude-0/verify-<code>/x.txt
# PDF -> text: pdftotext file.pdf out.txt ; then grep -i -n 'train' out.txt
```

Rules: use only that honest user agent. Do not impersonate a browser, do not use third-party mirrors, caches,
archive.org or proxies. If a host answers 403/000 or redirects to a bot-check page, it blocks automated access:
note it and move on. Official alternative sources ARE fine (e.g. the law on the national legislation portal
instead of the regulator's copy; the FIU's copy of a central bank regulation; federalregister.gov or the agency's
own site instead of ecfr.gov). WebSearch is allowed to find official alternative URLs.

## For each reference in each program entry

1. Fetch it. If it opens, find the passage that supports the entry (training duty, provision number, frequency).
2. If confirmed: add `"checked": "2026-11-08"` to that reference; fix `provision`/`note`/`effective` if the text
   differs. Keep `note` in your own words.
3. If the text contradicts the entry: correct the entry (classification, frequency, audience, why, provision).
   If an obligation is not there, downgrade (mandatory-explicit → competence or recommended) unless another
   checked reference supports it.
4. If the URL is dead (404) or wrong: find the correct official URL; else drop the reference (if an entry then has
   no reference and is not "recommended", downgrade it to "recommended" and say why in `why`).
5. If the host blocks automated access: leave the reference unchanged without `checked`.
6. Check `notes` and `summary` for claims you can confirm; remove claims you find to be wrong.

Fetch each distinct URL once (many entries share references). Budget: aim for every distinct URL; prioritise
references behind mandatory-explicit and mandatory-role entries, then competence.

Validate with `pnpm -s content:check content/regulatory/jurisdictions/<code>.json` (from /home/user/learning-impact)
and only edit that one file. Report back briefly: counts of references checked / blocked / corrected / dropped,
entries reclassified (with reason), hosts that block automated access, and anything important you found.

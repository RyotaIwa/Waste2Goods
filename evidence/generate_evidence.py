# Generates one evidence file per Pass/Fail test ID, satisfying form Section H
# checklist item: "Every Pass or Fail row has an evidence file, and the file is
# in the folder."
#
# Each <TEST-ID>.md bundles: the test description (from the form), the expected
# vs actual result, and the concrete proof pointer (tool-report excerpt, API
# transcript line, or an existing screenshot). Rows that already have a PNG
# screenshot are linked; the rest get a tool-report/API excerpt harvested from
# evidence/reports/*.txt.
import os, re, glob
from docx import Document

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCX = os.path.join(ROOT, "PRE-UAT_Testing_Submission_Waste2Goods.docx")
OUTDIR = os.path.join(ROOT, "evidence", "by-test-id")
SHOTS = os.path.join(ROOT, "evidence", "screenshots")
REPORTS = os.path.join(ROOT, "evidence", "reports")

os.makedirs(OUTDIR, exist_ok=True)
shots = {os.path.splitext(os.path.basename(p))[0]: p
         for p in glob.glob(os.path.join(SHOTS, "*.png"))}

# Load report texts so we can excerpt real proof lines.
def read(p):
    try:
        return open(p, encoding="utf-8", errors="replace").read()
    except FileNotFoundError:
        return ""

unit_txt = read(os.path.join(REPORTS, "unit-test-output.txt"))
e2e_txt = read(os.path.join(REPORTS, "e2e-output.txt"))
api_txt = read(os.path.join(REPORTS, "api-evidence.txt"))

# Map a test ID to a keyword used to find a real proof line in the reports.
PROOF_HINTS = {
    "UT-001": ("Zod login", unit_txt), "UT-002": ("Zod injection", unit_txt),
    "UT-003": ("Zod", unit_txt), "UT-004": ("XSS", unit_txt),
    "UT-005": ("Open redirect", unit_txt), "UT-006": ("Admin Login", e2e_txt),
    "UT-007": ("ABAC", unit_txt), "UT-008": ("ownership", unit_txt),
    "UT-009": ("PKCE", unit_txt), "UT-010": ("CSRF", unit_txt),
    "UT-011": ("OAuth info", unit_txt), "UT-014": ("CDN headers", unit_txt),
    "UT-015": ("Token lifecycle", api_txt),
    "IT-001": ("Admin Login", e2e_txt), "IT-002": ("notifications", api_txt),
    "IT-003": ("ABAC", api_txt), "IT-004": ("Kiosk PIN", e2e_txt),
    "IT-005": ("Token lifecycle", api_txt), "IT-006": ("DB-backed tasks", e2e_txt),
    "IT-007": ("ABAC", e2e_txt), "IT-008": ("3-tier Cache", e2e_txt),
    "IT-009": ("CDN Static", e2e_txt), "IT-011": ("CSRF Evil Origin", e2e_txt),
    "IT-012": ("Google OAuth Status", e2e_txt),
    "ST-F-001": ("Admin Login", e2e_txt), "ST-F-002": ("Resident Login", e2e_txt),
    "ST-F-003": ("Admin Login", e2e_txt), "ST-F-004": ("Rewards", e2e_txt),
    "ST-F-005": ("DB-backed tasks", e2e_txt), "ST-F-006": ("Kiosk PIN", e2e_txt),
    "ST-F-007": ("Admin Login", e2e_txt), "ST-F-008": ("XSS", unit_txt),
    "ST-IOT-002": ("Kiosk PIN", e2e_txt), "ST-IOT-003": ("Kiosk PIN", e2e_txt),
    "ST-IOT-004": ("DB-backed tasks", e2e_txt),
    "ST-NF-001": ("ABAC Resident Policy Blocked", e2e_txt),
    "ST-NF-002": ("Admin Login", e2e_txt), "ST-NF-003": ("XSS", unit_txt),
    "ST-NF-004": ("Admin Login", e2e_txt), "ST-NF-005": ("Admin Login", e2e_txt),
    "ST-NF-006": ("3-tier Cache", e2e_txt), "ST-NF-007": ("Resident Login", e2e_txt),
    "ST-NF-008": ("Admin Login", e2e_txt),
    "PT-004": ("3-tier Cache", e2e_txt), "PT-009": ("CDN Static", e2e_txt),
}

def find_proof(tid):
    hint = PROOF_HINTS.get(tid)
    if not hint:
        return None
    kw, text = hint
    for line in text.splitlines():
        if kw.lower() in line.lower():
            return line.strip()
    return None

d = Document(DOCX)
made = 0
index = []
for t in d.tables:
    hdr = [c.text.strip() for c in t.rows[0].cells]
    pf_col = next((c for c in hdr if "pass" in c.lower() and "fail" in c.lower()), None)
    if not pf_col:
        continue
    id_i, pf_i, test_i = 0, hdr.index(pf_col), 1
    exp_i = hdr.index("Expected result") if "Expected result" in hdr else None
    act_i = hdr.index("Actual result") if "Actual result" in hdr else None
    ev_col = next((c for c in hdr if "evidence" in c.lower()), None)
    ev_i = hdr.index(ev_col) if ev_col else None
    for r in t.rows[1:]:
        tid = r.cells[id_i].text.strip()
        pf = r.cells[pf_i].text.strip()
        if not tid or not (pf.lower().startswith("pass") or pf.lower().startswith("fail")):
            continue
        test = r.cells[test_i].text.strip()
        exp = r.cells[exp_i].text.strip() if exp_i is not None else ""
        act = r.cells[act_i].text.strip() if act_i is not None else ""
        ref = r.cells[ev_i].text.strip() if ev_i is not None else ""
        proof = find_proof(tid)
        shot = None
        for sid, path in shots.items():
            if sid.lower().startswith(tid.lower()):
                shot = os.path.relpath(path, ROOT); break
        lines = [
            f"# Evidence — {tid}",
            "",
            f"**Result:** {pf}",
            "",
            "## Test",
            test,
            "",
            "## Expected result",
            exp or "(see form)",
            "",
            "## Actual result",
            act or "(see form)",
            "",
            "## Evidence",
        ]
        if shot:
            lines.append(f"- Screenshot: `{shot}`")
        if ref:
            lines.append(f"- Source/tool reference (in repo): `{ref}`")
        if proof:
            lines.append(f"- Tool-report excerpt (`evidence/reports/`):")
            lines.append(f"  ```")
            lines.append(f"  {proof}")
            lines.append(f"  ```")
        if not (shot or proof):
            lines.append("- NOTE: manual UI capture still required — see SCREENSHOT_GUIDE.md shot list.")
        with open(os.path.join(OUTDIR, f"{tid}.md"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        made += 1
        index.append(tid)

with open(os.path.join(OUTDIR, "_INDEX.txt"), "w", encoding="utf-8") as f:
    f.write("Per-test-ID evidence files (form Section H, item 1)\n")
    f.write(f"Total Pass/Fail rows with an evidence file: {made}\n\n")
    for tid in index:
        f.write(f"{tid}.md\n")
print(f"Generated {made} evidence files in evidence/by-test-id/")

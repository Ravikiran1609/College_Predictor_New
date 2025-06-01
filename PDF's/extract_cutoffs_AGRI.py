import re
import pdfplumber
import pandas as pd

def parse_agri_pdf(pdf_path):
    records = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            lines = page.extract_text().split('\n')
            college_code = None
            college_name = None
            categories = []
            skip_lines = 0
            for idx, line in enumerate(lines):
                if skip_lines:
                    skip_lines -= 1
                    continue
                # College code pattern: 1 F001 College Name
                match = re.match(r'\d+\s+([FN]\d{3})\s+(.*)', line)
                if match:
                    college_code = match.group(1)
                    college_name = match.group(2).strip()
                    categories = []
                    # The next line is always the category header
                    if idx+1 < len(lines):
                        categories = lines[idx+1].split()
                # Now, check for branch + cutoffs
                elif college_code and categories:
                    parts = line.split()
                    # Find where cutoffs (digits or '--') start
                    cutoff_start = None
                    for i, part in enumerate(parts):
                        if part == '--' or part.replace('.', '').isdigit():
                            cutoff_start = i
                            break
                    if cutoff_start is not None:
                        branch_name = " ".join(parts[:cutoff_start])
                        cutoffs = parts[cutoff_start:]
                        # Check for multi-line branch name (next line if short or bracket open)
                        if (('(' in branch_name and ')' not in branch_name) or len(branch_name) <= 3) and idx+1 < len(lines):
                            next_line = lines[idx+1]
                            next_parts = next_line.split()
                            # If next line does NOT start with a digit (so not a new college)
                            if not re.match(r'\d+\s+[FN]\d{3}', next_line) and not all(x.isupper() for x in next_parts[:2]):
                                branch_name += " " + " ".join(next_parts[:cutoff_start])
                                cutoffs = next_parts[cutoff_start:]
                                skip_lines = 1  # skip the next line since we've used it
                        # Now, map category/cutoff
                        for cat, cutoff in zip(categories, cutoffs):
                            if cutoff != '--':
                                records.append({
                                    "college_code": college_code,
                                    "college_name": college_name,
                                    "branch": branch_name.strip(),
                                    "course": "AGRI",
                                    "category": cat,
                                    "cutoff_rank": cutoff
                                })
    return records

# Use like this:
df = pd.DataFrame(parse_agri_pdf("agri_cutoff_2024_r1_hk.pdf"))
df.to_csv("agri_cutoff_final_hk.csv", index=False)
print("agri_cutoff_final_hk.csv created.")


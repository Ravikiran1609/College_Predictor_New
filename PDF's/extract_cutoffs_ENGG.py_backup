import re
import pdfplumber
import pandas as pd

def parse_pdf(pdf_path):
    records = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            lines = page.extract_text().split('\n')
            college_code = None
            college_name = None
            categories = []
            branch = None
            for idx, line in enumerate(lines):
                # Detect college block
                match = re.match(r'\d+\s+(E\d{3})\s+(.*)', line)
                if match:
                    college_code = match.group(1)
                    college_name = match.group(2).strip()
                    categories = []
                    branch = None
                    # Next line should be categories
                    if idx+1 < len(lines):
                        categories = lines[idx+1].split()
                # Detect branch lines (next lines with numbers or '--')
                elif college_code and categories:
                    # Branch line has at least 2 words before cutoffs
                    parts = line.split()
                    # Find index where the first cutoff or '--' appears
                    cutoff_start = None
                    for i, part in enumerate(parts):
                        if part == '--' or part.isdigit():
                            cutoff_start = i
                            break
                    if cutoff_start is not None:
                        # Branch name is before cutoffs
                        branch_name = " ".join(parts[:cutoff_start])
                        cutoffs = parts[cutoff_start:]
                        # Some branches span 2 lines (e.g., 'AI Artificial', then 'Intelligence')
                        if len(branch_name) <= 3 and idx+1 < len(lines):
                            # Look ahead for more branch name
                            next_line = lines[idx+1]
                            next_parts = next_line.split()
                            # Only join if next line doesn't look like a new college or header
                            if not re.match(r'\d+\s+E\d{3}', next_line) and not all(x.isupper() for x in next_parts[:2]):
                                branch_name = branch_name + " " + " ".join(next_parts[:cutoff_start])
                                cutoffs = next_parts[cutoff_start:]
                                idx += 1  # skip extra line
                        # Now, for each category/cutoff
                        for cat, cutoff in zip(categories, cutoffs):
                            if cutoff != '--':
                                records.append({
                                    "college_code": college_code,
                                    "college_name": college_name,
                                    "branch": branch_name,
                                    "course": "ENGG",
                                    "category": cat,
                                    "cutoff_rank": cutoff
                                })
    return records

df = pd.DataFrame(parse_pdf("ENGG_CUTOFF_2024_r1_gen_prov.pdf"))
df.to_csv("engg_cutoff_final.csv", index=False)
print("engg_cutoff_final.csv created with expected format.")


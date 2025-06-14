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
            idx = 0
            while idx < len(lines):
                line = lines[idx]
                # Detect college block
                match = re.match(r'\d+\s+(E\d{3})\s+(.*)', line)
                if match:
                    college_code = match.group(1)
                    college_name = match.group(2).strip()
                    categories = []
                    branch = None
                    # Next line should be categories
                    if idx+1 < len(lines):
                        idx += 1
                        categories = lines[idx].split()
                # Detect branch lines (next lines with numbers or '--')
                elif college_code and categories:
                    parts = line.split()
                    cutoff_start = None
                    for i, part in enumerate(parts):
                        if part == '--' or part.isdigit():
                            cutoff_start = i
                            break
                    if cutoff_start is not None:
                        branch_name = " ".join(parts[:cutoff_start])
                        cutoffs = parts[cutoff_start:]
                        # Handle branches split across lines
                        if len(branch_name) <= 3 and idx+1 < len(lines):
                            next_line = lines[idx+1]
                            next_parts = next_line.split()
                            if not re.match(r'\d+\s+E\d{3}', next_line) and not all(x.isupper() for x in next_parts[:2]):
                                branch_name += " " + " ".join(next_parts[:cutoff_start])
                                cutoffs = next_parts[cutoff_start:]
                                idx += 1
                        for cat, cutoff in zip(categories, cutoffs):
                            if cutoff != '--':
                                try:
                                    # Parse cutoff safely as integer (skip scientific/invalid ones)
                                    cutoff_val = int(float(cutoff.replace(',', '')))
                                    if 0 < cutoff_val < 2000000:  # Optional sanity limit
                                        records.append({
                                            "college_code": college_code,
                                            "college_name": college_name,
                                            "branch": branch_name,
                                            "course": "ENGG",
                                            "category": cat,
                                            "cutoff_rank": cutoff_val
                                        })
                                except ValueError:
                                    print(f"Skipped invalid cutoff: {cutoff}")
                idx += 1
    return records

# Run and export
df = pd.DataFrame(parse_pdf("ENGG_CUTOFF_2024_HK_R2_FIN.pdf"))
df.to_csv("ENGG_CUTOFF_2024_HK_R2_FIN.csv", index=False)
print("✅ ENGG_CUTOFF_2024_HK_R2_FIN.csv created successfully.")


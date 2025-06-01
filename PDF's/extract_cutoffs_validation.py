import tabula

# Will output as DataFrame
dfs = tabula.read_pdf("PHARMA_CUTOFF_2024_r1_gen_prov.pdf", pages='all', multiple_tables=True)
for i, df in enumerate(dfs):
    print(f"=== Table {i+1} ===")
    print(df.head())



import re
import json

with open(r'C:\Users\fkgtg\.gemini\antigravity\brain\5981dbfa-cdc7-4fdb-ad8c-0f57d5c33926\.system_generated\steps\396\content.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract sectors and stocks
# Sectors are usually on lines by themselves
# Stocks are in format [Symbol - Name]

lines = content.split('\n')
stocks = []
current_sector = "غير محدد"

for line in lines:
    line = line.strip()
    if not line: continue
    
    # Check if it's a sector (usually long text without brackets)
    if not '[' in line and not 'http' in line and len(line) > 5 and not '-' in line:
        current_sector = line
        continue
    
    # Check if it's a stock
    match = re.search(r'\[(\d{4}) - (.*?)\]', line)
    if match:
        symbol = match.group(1)
        nameAr = match.group(2)
        stocks.append({
            "symbol": symbol,
            "yahooTicker": f"{symbol}.SR",
            "nameAr": nameAr,
            "nameEn": "", # Will fill later if needed
            "sector": current_sector
        })

# Output as TS
output = "export const ALL_SAUDI_STOCKS = " + json.dumps(stocks, ensure_ascii=False, indent=2) + ";"
with open(r'c:\saudistock\src\lib\stocks-full.ts', 'w', encoding='utf-8') as f:
    f.write(output)

print(f"Extracted {len(stocks)} stocks.")

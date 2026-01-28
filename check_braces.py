
with open(r'd:\apix_interior\app\admin\admin_dashboard\admin_produk\tambah_produk\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

balance = 0
for i, line in enumerate(lines):
    if i < 223 or i > 3670:
        continue
    
    for char_idx, char in enumerate(line):
        if char == '(':
            balance += 1
        elif char == ')':
            balance -= 1
        
        if balance < 0:
            print(f"FIRST NEGATIVE BALANCE at line {i+1}, char {char_idx+1}: '{line.strip()}', balance {balance}")
            # Exit after first find
            import sys
            sys.exit(0)

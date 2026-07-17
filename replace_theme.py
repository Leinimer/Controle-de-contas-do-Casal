import re

file_path = "/app/applet/app/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Define the color mappings from old theme to Professional Polish theme
replacements = {
    # Primary & Hover (Indigo-500 & Indigo-600)
    "#4648d4": "#6366f1",
    "#3638b3": "#4f46e5",
    
    # Secondary & Dark elements (Slate-900 & Slate-800)
    "#0b1c30": "#0f172a",
    "#1e293b": "#1e293b", # keeps slate-800 as is
    
    # Text variant (Slate-500)
    "#464554": "#64748b",
    
    # Greens/Success (Green-600 & Green-800)
    "#006c49": "#166534",
    "#005236": "#14532d",
    
    # Tertiary (Indigo/Slate Accent)
    "#6b38d4": "#6366f1",
    
    # Red/Error (Red-500)
    "#ba1a1a": "#ef4444",
    
    # Backgrounds and accents
    "#eff4ff": "#e0e7ff", # light indigo accent
    "#e9ddff": "#f1f5f9", # light slate accent
    "#6cf8bb": "#dcfce7", # light green/success accent
    "#f8f9ff": "#f1f5f9", # background base
}

for old, new in replacements.items():
    # Make sure we replace regardless of case
    content = re.sub(re.escape(old), new, content, flags=re.IGNORECASE)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Theme replacements completed successfully!")

"""Write js/build.js with the current local date and time.

The launch screen shows this stamp so you can tell which build a phone is running.
The pre-commit hook in tools/hooks runs it automatically, so every commit carries
the time it was made. Run it by hand with:  python tools/stamp.py
"""
import datetime
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
now = datetime.datetime.now()
hour = now.hour % 12 or 12
stamp = f"{now.strftime('%b')} {now.day}, {now.year} at {hour}:{now.minute:02d} {'AM' if now.hour < 12 else 'PM'}"

with open(os.path.join(root, 'js', 'build.js'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('// Written by tools/stamp.py on every commit. Do not edit by hand.\n')
    f.write(f"export const BUILD = '{stamp}';\n")
print('build stamp:', stamp)

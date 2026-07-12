import os, urllib.request, json
from dotenv import load_dotenv
load_dotenv('c:/Users/msi 15/Downloads/Sentiment A/.env')
key = os.environ.get('GEMINI_API_KEY')
models = ['gemini-3.5-flash', 'gemini-1.5-flash']
for m in models:
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}'
    data = json.dumps({'contents':[{'parts':[{'text':'hi'}]}]}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp: print(f'{m} OK')
    except Exception as e: print(f'{m} FAILED {e}')

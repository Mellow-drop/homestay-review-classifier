import os, urllib.request, json
from dotenv import load_dotenv
load_dotenv('c:/Users/msi 15/Downloads/Sentiment A/.env')
key = os.environ.get('GEMINI_API_KEY')
url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={key}'
data = json.dumps({'contents':[{'parts':[{'text':'return [{"id":1,"theme":"food"}]'}]}]}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp: print(json.loads(resp.read().decode('utf-8'))['candidates'][0]['content']['parts'][0]['text'])

import json
import urllib.request
import sys

# Testar a rota de usuários
try:
    req = urllib.request.Request(
        'http://localhost:3000/usuarios',
        headers={'x-usuario-id': '1'}
    )
    resp = urllib.request.urlopen(req)
    print('Status:', resp.status)
    data = json.loads(resp.read().decode('utf-8'))
    print('Usuários no banco:')
    print(json.dumps(data, indent=2, ensure_ascii=False))
except urllib.error.HTTPError as e:
    if e.code == 403:
        print('Erro 403: Sem permissão (usuário admin não existe)')
    else:
        print(f'Erro {e.code}: {e.reason}')
except Exception as e:
    print(f'Erro: {e}')

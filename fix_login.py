import json
import urllib.request
import subprocess
import sys

# Tentar logar com diferentes senhas comuns
senhas_comuns = ['admin', '123456', 'password', 'admin123']

print('Testando senhas comuns para o usuário admin...')
for senha in senhas_comuns:
    try:
        req = urllib.request.Request(
            'http://localhost:3000/login',
            data=json.dumps({'usuario': 'admin', 'senha': senha}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode('utf-8'))
        if data.get('isValid'):
            print(f'✓ Senha correta encontrada: {senha}')
            print(json.dumps(data, indent=2, ensure_ascii=False))
            sys.exit(0)
        else:
            print(f'✗ Senha incorreta: {senha}')
    except Exception as e:
        print(f'Erro ao testar {senha}: {e}')

print('\nNenhuma senha comum funcionou. Precisamos resetar a senha do admin no banco.')
print('Vou criar um SQL para atualizar a senha para "123456" com hash bcrypt.')

# Gerar hash bcrypt de "123456"
try:
    from bcrypt import hashpw, gensalt
    senha_nova = '123456'
    salt = gensalt()
    senha_hash = hashpw(senha_nova.encode('utf-8'), salt).decode('utf-8')
    print(f'\nHash bcrypt de "123456": {senha_hash}')
    print(f'\nExecute o seguinte SQL no pgAdmin para atualizar a senha:')
    print(f'UPDATE usuarios SET senha_hash = \'{senha_hash}\' WHERE username = \'admin\';')
except ImportError:
    print('bcrypt não está instalado. Use o SQL abaixo e gere o hash manualmente.')
    print('UPDATE usuarios SET senha_hash = \'senha_hash_aqui\' WHERE username = \'admin\';')

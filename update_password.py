import os
import sys

# Primeiro tenta instalar psycopg2 se não estiver disponível
try:
    import psycopg2
except ImportError:
    import subprocess
    print('Instalando psycopg2...')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'psycopg2-binary'])
    import psycopg2

from bcrypt import hashpw, gensalt

# Conectar ao banco de dados
try:
    conn = psycopg2.connect(
        host='localhost',
        database='hcivitta',
        user='hcivitta',
        password='hcivitta123'
    )
    cur = conn.cursor()
    
    # Gerar hash para senha "123456"
    new_password = '123456'
    hash_val = hashpw(new_password.encode('utf-8'), gensalt()).decode('utf-8')
    
    print(f'Atualizando senha do admin...')
    print(f'Nova senha: {new_password}')
    print(f'Hash: {hash_val}')
    
    # Atualizar a senha do admin
    cur.execute(
        'UPDATE usuarios SET senha_hash = %s WHERE username = %s',
        (hash_val, 'admin')
    )
    
    conn.commit()
    print(f'\n✓ Senha do admin atualizada com sucesso!')
    
    # Verificar se atualizou
    cur.execute('SELECT username, senha_hash FROM usuarios WHERE username = %s', ('admin',))
    row = cur.fetchone()
    print(f'Verificação: username={row[0]}, hash={row[1][:20]}...')
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f'Erro ao atualizar banco: {e}')
    print('\nAlternativa: Use o pgAdmin (localhost:8080) para executar:')
    print('UPDATE usuarios SET senha_hash = \'$2b$12$XTO0u4A6c9ScjTdvGXGR5.x29VytIAhcLvxyU8SOqGCtXNwlekfWu\' WHERE username = \'admin\';')

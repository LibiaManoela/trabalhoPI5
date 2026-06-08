FROM python:3.10-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt ./

# Instalar PyTorch separadamente do índice de CPU (mais rápido)
RUN pip install --default-timeout=1000 -i https://pypi.org/simple/ torch==2.0.1 --no-cache-dir

# Instalar outras dependências
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

EXPOSE 5000

CMD ["python", "api.py"]

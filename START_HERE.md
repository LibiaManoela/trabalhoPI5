# 🚀 HCI Vitta - Guia de Inicialização Rápida (Ambiente Docker)

Este projeto utiliza **Docker** e **Docker Compose** para orquestrar e rodar todo o ecossistema local de forma isolada, eliminando a necessidade de instalar bancos de dados, Node.js ou ambientes virtuais Python (`venv`) diretamente na sua máquina física.

---

## 🛠️ Pré-requisitos

Antes de iniciar, você precisa ter instalado no seu computador:
1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Certifique-se de que ele está aberto e rodando).
2. [Git](https://git-scm.com/) (Para clonar o repositório).

---

## 🏃‍♂️ Como Rodar o Sistema (Passo a Passo)

1. **Abra o Docker Desktop** na sua máquina.
2. Navegue até a pasta raiz do projeto pelo seu terminal ou VS Code.
3. Execute o script automatizado de inicialização:
   * **No Windows:** Dê um duplo clique no arquivo `START_SYSTEM.bat` ou execute `./START_SYSTEM.bat` no terminal.
   * **Via comando direto:** `docker-compose up --build`

O Docker irá construir os ambientes e subir os seguintes serviços:
* **Módulo Web / Backend (Node.js):** http://localhost:3000
* **Motor de Inteligência Artificial (Python / RAG):** http://localhost:5000
* **Banco de Dados (PostgreSQL):** Porta `5432`
* **Gerenciador do Banco (pgAdmin 4):** http://localhost:8080

---

## 🗄️ Configuração Inicial do Banco de Dados

Ao subir o sistema pela primeira vez, as tabelas relacionais precisam ser criadas no banco de dados local:

1. Acesse o **pgAdmin** em seu navegador: `http://localhost:8080`.
2. Faça login com o e-mail `admin@hcivitta.com` e senha `admin`.
3. Adicione um novo servidor (**Add New Server**):
   * **Name:** `HCIVitta`
   * **Aba Connection -> Host name/address:** `database`
   * **Aba Connection -> Username:** `postgres`
   * **Aba Connection -> Password:** `sua_senha_secura` (Definida no docker-compose.yml)
4. Abra a **Query Tool** no banco `hcivitta_db` e execute o script SQL de criação de tabelas (`usuarios`, `triagens` e `retroalimentacao_medica`).

---

## 🛑 Como Encerrar o Sistema

Para desligar todos os containers e liberar a memória do seu computador com segurança, vá até a janela do terminal onde o sistema está rodando e pressione **`Ctrl + C`**.
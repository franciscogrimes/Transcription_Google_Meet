# Transcription_Google_Meet

Este projeto foi desenvolvido com o intuito de armazenar as transcrições do Tactiq, dentro de uma aplicação para registros de reuniões. No caso desse em específico, o local para o armaenamento da transcrição foi o Sensedata, podendo ser replicado para outras aplicações caso necessário.
Contudo, o Tactiq não oferece uma API pública para integrações diretas. Então, foi utilizado uma integração nativa da solução com o google drive, que posteriormente segue um processo de integração.

Para esse processo, ele realiza o seguinte passo a passo:

1. Lista arquivos na pasta especificada (_via_ variável de ambiente `FOLDER_ID`).
2. Filtra apenas os arquivos criados na data de execução.
3. Extrai o texto de documentos do Google Docs.
4. Localiza o trecho “Short summary” e recupera seu conteúdo.
5. Registra cada “Short summary” como uma subtask no SenseData, associando o cliente e o CS responsáveis.
6. (Opcional) Poderia mover/comentar arquivos após o processamento.

## Tecnologias Utilizadas
- **Node.js** (JavaScript)
- **googleapis** – para acesso à Google Drive API  
- **axios** – para chamadas HTTP (SenseData e Gemini)  
- **dotenv** – carregamento de variáveis de ambiente  
- **nodemon** – reinício automático em modo de desenvolvimento  
- **Google Generative Language API (Gemini)** – para processar nomes de clientes via IA  
- **SenseData API** – para registrar as tarefas no backend de atividades  

## Como Rodar o Código

1. **Pré-requisitos**  
   - Node.js (>= v16) e npm instalados.  
   - Acesso ao Google Cloud Console e permissão de leitura na pasta do Drive.  
   - Conta no SenseData com token de API.

2. **Instalação**
   
   ```bash
   git clone <URL-do-repositório>
   cd drive-processor
   npm install
   ```

4. **Configuração de variáveis de ambiente**
   
- Crie um arquivo .env na raiz do projeto contendo:
   - FOLDER_ID=SEU_FOLDER_ID_AQUI
   - SENSEDATA_TOKEN=SEU_TOKEN_SENSEDATA_AQUI
   - Coloque o arquivo JSON de credenciais de conta de serviço em src/credentials.json (veja abaixo como criar).

5. **Execução**

- Modo desenvolvimento (com reinício automático):

```bash
  npm run start:dev
```

- Modo produção:

```bash
  npm run start:prod
```

## Como Criar as Credenciais da Google
  
  1. **Acesse o Google Cloud Console:**
  
  - https://console.cloud.google.com/

  2. **Crie ou selecione um projeto.**

  3. **Ative a Google Drive API:**

  - Navegue em “APIs e serviços” → “Biblioteca”.
  - Busque por “Google Drive API” e clique em Ativar.

  4. **Crie uma Conta de Serviço:**

  - Em “APIs e serviços” → “Credenciais” → Criar credenciais → Conta de serviço.
  - Preencha nome e descrição.
  - Conceda o papel “Editor de arquivos do Drive” ou personalizado que inclua escopo https://www.googleapis.com/auth/drive.
  - Finalize.

  5. **Gere a chave JSON:**

  - Ainda na conta de serviço criada, clique em Gerar chave → JSON.
  - Um arquivo .json será baixado.

  6. **Compartilhe a pasta com a conta de serviço:**

  - No Google Drive, abra as configurações de compartilhamento da pasta (ID igual ao FOLDER_ID).
  - Adicione o e-mail da sua conta de serviço (consta no JSON, campo client_email) com permissão de “Leitor” ou “Editor”.

  7. **Posicione o JSON no projeto:**

  - Em drive-processor/src/credentials.json, adicione o JSON que foi instalado dentro do Credentials
  
**Pronto! Agora o script conseguirá autenticar junto ao Google Drive e processar os arquivos conforme esperado.**
   

const axios = require('axios');
const https = require('https');


const { obterDataAtual } = require('../utils/dateUtils');


require('dotenv').config();



const sensedataToken = process.env.SENSEDATA_TOKEN;

// Obtem o id da Task para adicionar uma nova subtask
async function getParentId(idCliente) {
  try {

    const response = await axios.get(`https://api.sensedata.io/v2/tasks?customer:id=${idCliente}`, {
      headers: {
        'Authorization': `Bearer ${sensedataToken}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    if (response.data?.tasks?.length > 0) {
      const tarefaJornada = response.data.tasks.find(task => task.description.includes("Jornada do Cliente"));
      if (tarefaJornada) return parseInt(tarefaJornada.id, 10);
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar o ID do parent");
    return null;
  }
  
}

// Função para registrar atividade no SenseData
async function registerTaskSenseData(cliente, descricao, emailCliente, titulo) {
  try {

    const dataAtual = obterDataAtual();

    const dataFormatada = `${dataAtual.year}-${String(dataAtual.month).padStart(2, '0')}-${String(dataAtual.day).padStart(2, '0')}`;
    const idClient = await searchClientSenseData(cliente);
    const idParent = await getParentId(idClient);
    const idUser = await searchIdUserSenseData(emailCliente);

    const urlSensedata = 'https://api.sensedata.io/v2/tasks';
    const hexId = Math.floor(Math.random() * 16777215).toString(16);

    const cleanIdClient = parseInt(idClient.toString().trim(), 10);
    const cleanIdUser = parseInt(idUser.toString().trim(), 10);

    const dadosAtividade = {
      tasks: [{
        id_legacy: hexId,
        customer: { id: cleanIdClient },
        description: titulo,
        start_date: dataFormatada,
        due_date: dataFormatada,
        type: { id: 3 },
        status: { id: 2 },
        priority: { id: 2 },
        owner: cleanIdUser,
        notes: descricao,
        parent: idParent ? { id: idParent } : undefined
      }]
    };

    console.log('Enviando dados para SenseData:', JSON.stringify(dadosAtividade, null, 2));

    const response = await axios.post(urlSensedata, dadosAtividade, {
      headers: {
        'Authorization': `Bearer ${sensedataToken}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      validateStatus: status => status < 500
    });

    if (response.status === 202) {
      console.log('✅ Atividade registrada com sucesso no SenseData!');
      return true;

    } else if(response.status === 400){

        console.log(`Código de status: ${response.status}`);
        console.log(`Mensagem: Não foi possível adicionar a atividade, pois o cliente não foi encontrado.`);
        return true

    } else {

      throw new Error(`Código de status: ${response.status}`);
      
    }
  } catch (error) {
    console.error('Detalhes do erro:', error.response?.data);
    throw new Error(`Erro ao registrar atividade no SenseData: ${error.message}`);
  }
}

// Função para buscar cliente no sensedata
async function searchClientSenseData(titulo) {
  try {

    const clientesResponse = await axios.get('https://api.sensedata.io/v2/customers?status:id=2', {
      params: {
        limit: 1000
      },
      headers: {
        'Authorization': `Bearer ${sensedataToken}`,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
      
    });

    const customers = clientesResponse.data.customers;
    
    // const cliente = filtraCliente[0];
    // console.log(cliente)

    const geminiRequest = {
      contents: [{
        parts: [{
          text: titulo
        }]
      }],
      generationConfig: {
        temperature: 0.7
      },
      systemInstruction: {
        parts: [{
          text: `Baseado na lista de clientes, encontre o ID do cliente no qual o usuário está se referindo. Caso não seja encontrado nenhum resultado, retorne '0'

Lista de clientes completa: ${JSON.stringify(customers)}`
        }]
      }
    };

    // Consultar Gemini
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, 
      geminiRequest, {

      httpsAgent: new https.Agent({ rejectUnauthorized: false })

    });

    const resultado = geminiResponse.data.candidates[0].content.parts[0].text;

    return resultado;

  } catch (error) {
    console.error('Erro no processamento:', error.response ? error.response.data : error.message);
    return null;
  }
}

async function searchIdUserSenseData(emailCliente) {
  try {

    const usersResponse = await axios.get('https://api.sensedata.io/v2/users', {
      params: {
        limit: 1000
      },
      headers: {
        'Authorization': `Bearer ${sensedataToken}`
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    const users = usersResponse.data.users;

    const geminiRequest = {
      contents: [{
        parts: [{
          text: emailCliente
        }]
      }],
      generationConfig: {
        temperature: 1
      },
      systemInstruction: {
        parts: [{
          text: `Baseado na lista de usuários cadastrados no sensedata, encontre o ID do usuário que foi o host da reunião. Caso não seja encontrado nenhum resultado, retorne '0'

Lista de clientes completa: ${JSON.stringify(users)}`
        }]
      }
    };

    // Consultar Gemini
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, 
      geminiRequest, {

      httpsAgent: new https.Agent({ rejectUnauthorized: false })

    });

    const resultado = geminiResponse.data.candidates[0].content.parts[0].text;

    return resultado;

  } catch (error) {
    console.error('Erro no processamento:', error.response ? error.response.data : error.message);
    return null;
  }
}


module.exports = { registerTaskSenseData, searchClientSenseData, searchIdUserSenseData };

const axios = require('axios');
const https = require('https');

async function geminiRequest(transcript) {
  if (!transcript) {
      console.log("Transcrição vazia ou nula");
      return null;
  }
  
  try {
      const geminiRequest = {
          contents: [{
              parts: [{
                  text: transcript
              }]
          }],
          generationConfig: {
              temperature: 0.7
          },
          systemInstruction: {
              parts: [{
                  text: "Você é um gerador de resumos, baseado na transcrição da reunião. Você deverá ressaltar os principais tópicos discutidos, as decisões tomadas e os próximos passos. O resumo deve ser claro e conciso, focando nos pontos mais relevantes da reunião. Não inclua informações irrelevantes ou detalhes excessivos. O resumo deve ser escrito em português e não deve conter erros gramaticais ou de digitação. O resumo deve ser escrito em formato de parágrafo, sem listas ou marcadores."
              }]
          }
      };
      
      // Verificar se a chave API está definida
      if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY não está definida nas variáveis de ambiente");
      }
      
      // Consultar Gemini API
      const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          geminiRequest,
          {
              httpsAgent: new https.Agent({ rejectUnauthorized: false })
          }
      );
      
      // Verificar se a resposta contém o resultado esperado
      if (geminiResponse.data && 
          geminiResponse.data.candidates && 
          geminiResponse.data.candidates[0] &&
          geminiResponse.data.candidates[0].content &&
          geminiResponse.data.candidates[0].content.parts &&
          geminiResponse.data.candidates[0].content.parts[0]) {
          
          return geminiResponse.data.candidates[0].content.parts[0].text;
      } else {
          console.log("Resposta da API Gemini não contém o formato esperado:", JSON.stringify(geminiResponse.data));
          return null;
      }
  } catch (error) {
      console.error("Erro ao solicitar resumo do Gemini:", error.message);
      if (error.response) {
          console.error("Detalhes da resposta:", JSON.stringify(error.response.data));
      }
      return null;
  }
}

module.exports = { geminiRequest };


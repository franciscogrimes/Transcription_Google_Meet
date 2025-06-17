const { google } = require('googleapis');
const fs = require('fs').promises; 
const path = require('path');

// --- Configuração ---
const KEYFILEPATH = path.join(__dirname, '../credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Autenticação
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

// Função para listar arquivos na pasta
async function listFolderFiles(folderId) {
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`, 
            fields: 'files(id, name, mimeType, owners(displayName, emailAddress), createdTime)',
            pageSize: 100,
            supportsAllDrives: true,          
            includeItemsFromAllDrives: true   
        });
        return res.data.files || [];
    } catch (error) {
        console.error('Erro ao listar arquivos:', error.message);
        if (error.response) {
             console.error('Detalhes do erro da API:', JSON.stringify(error.response.data, null, 2));
        }
        return [];
    }
}

// Função para extrair texto de Google Docs usando export
async function extractTextFromGoogleDoc(fileId, fileName) {
    try {
        const response = await drive.files.export({
            fileId: fileId,
            mimeType: 'text/plain',
            supportsAllDrives: true
        }, {
            responseType: 'text'
        });
        return response.data; 
    } catch (error) {
        console.error(`  Erro ao exportar Google Doc ${fileName} (ID: ${fileId}):`, error.message);
         if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
         }
        return null;
    }
}

function extractTranscription(fullText) {
    if (!fullText) {
        console.log("Texto vazio ou nulo fornecido");
        return null;
    }
    
    // Converte para string caso não seja
    const textStr = String(fullText);
    
    // Divide o texto em linhas e remove linhas vazias
    const lines = textStr.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Primeiro, encontramos a seção "Highlights"
    let highlightsIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('**highlights**') || 
            lines[i].toLowerCase() === 'highlights') {
            highlightsIndex = i;
            break;
        }
    }
    
    if (highlightsIndex === -1) {
        console.log("Marcador 'Highlights' não encontrado no texto");
        return null;
    }
    
    // Agora procuramos pelo marcador "Transcript" que vem APÓS "Highlights"
    let transcriptStartIndex = -1;
    for (let i = highlightsIndex + 1; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('**transcript**') || 
            lines[i].toLowerCase() === 'transcript') {
            transcriptStartIndex = i;
            break;
        }
    }
    
    if (transcriptStartIndex === -1) {
        console.log("Marcador 'Transcript' após 'Highlights' não encontrado");
        return null;
    }
    
    // O conteúdo da transcrição começa após a linha do marcador "Transcript"
    const transcriptContent = lines.slice(transcriptStartIndex + 1);
    
    if (transcriptContent.length === 0) {
        console.log("'Transcript' encontrado após 'Highlights', mas nenhum conteúdo subsequente detectado");
        return null;
    }
    
    // Retorna as linhas da transcrição como uma única string
    return transcriptContent.join('\n');
}

function extractShortSummary(fullText) {
    if (!fullText) {
        return null;
    }
    const lines = fullText.split('\n');
    let summaryLines = [];
    let foundSummaryStart = false;
    let startLineIndex = -1;
    let endLineIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().toLowerCase() === 'short summary') {
            foundSummaryStart = true;
            startLineIndex = i;
            break;
        }
    }

    if (!foundSummaryStart) {
        return null;
    }

    for (let i = startLineIndex + 1; i < lines.length; i++) {
        const currentLineTrimmedLower = lines[i].trim().toLowerCase();
        const isEndOfSummaryMarker = ['highlights', 'transcript'].includes(currentLineTrimmedLower);
        if (isEndOfSummaryMarker) {
            endLineIndex = i;
            break;
        }
    }

    const startIndex = startLineIndex + 1;
    const endIndex = (endLineIndex !== -1) ? endLineIndex : lines.length;

    for (let i = startIndex; i < endIndex; i++) {
        const line = lines[i].trim();
        if (line) {
            summaryLines.push(lines[i]);
        }
    }

     if (summaryLines.length === 0) {
        return "null";
    }

    return summaryLines.join('\n').trim();
}

// async function listFolderFilesWithOwnerInfo(folderId) {
//     try {
//         const res = await drive.files.list({
//             q: `'${folderId}' in parents and trashed=false`,
//             fields: '',
//             pageSize: 100,
//             supportsAllDrives: true,
//             includeItemsFromAllDrives: true
//         });
//         return res.data.files || [];
//     } catch (error) {
//         console.error('Erro ao listar arquivos com informações do proprietário:', error.message);
//          if (error.response) {
//              console.error('Detalhes do erro da API:', JSON.stringify(error.response.data, null, 2));
//          }
//         return [];
//     }
// }

// Função para mover um arquivo para outra pasta
// async function moveFile(fileId, originalFolderId) {
//     try {
//         await drive.files.update({
//             fileId: fileId,
//             addParents: process.env.FOLDER_ID_PARENT,
//             removeParents: originalFolderId,
//             fields: 'id, parents',
//             supportsAllDrives: true
//         });
//         console.log(`  Arquivo ${fileId} movido para pasta de processados.`);
//         return true;
//     } catch (error) {
//         console.error(`  Erro ao mover arquivo ${fileId}:`, error.message);
//         return false;
//     }
// }

module.exports = {listFolderFiles, extractTextFromGoogleDoc, extractShortSummary, extractTranscription};

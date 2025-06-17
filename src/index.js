const {listFolderFiles} = require('./services/processTranscripts.js');
const {extractTextFromGoogleDoc} = require('./services/processTranscripts.js');
const {extractShortSummary} = require('./services/processTranscripts.js');
const {extractTranscription} = require('./services/processTranscripts.js');
const {registerTaskSenseData} = require('./services/sensedata.js');
const {geminiRequest} = require('./services/gemini.js');


async function main() {
    const allFiles = await listFolderFiles(process.env.FOLDER_ID);
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    if (!allFiles || allFiles.length === 0) {
        console.log('Nenhum arquivo encontrado na pasta.');
        return;
    }

    console.log(`Encontrados ${allFiles.length} arquivos.`);
    
    const todayFiles = allFiles.filter(file => {
        // Converte a data de criação do arquivo para o mesmo formato
        const fileDate = new Date(file.createdTime).toISOString().split('T')[0];
        return fileDate === today;
    });
    
    if (todayFiles.length === 0) {
        console.log('Nenhum arquivo criado hoje encontrado.');
        return;
    }

    for (const file of todayFiles) {
        let extractedText = null;

        // if (file.owners && file.owners.length > 0) {
        //     console.log(`  -> Proprietário(s): ${file.owners[0].emailAddress || 'Sem email'}`);
        // } else {
        //     console.log("  -> Informação de proprietário não disponível (comum em Drives Compartilhados).");
        // }

        console.log(`\nProcessando arquivo: ${file.name} (ID: ${file.id}, Tipo: ${file.mimeType})`);

        const ownerEmail = file.owners[0].emailAddress || 'Sem email';
        const nameFormatted = file.name.split(/\/|;|-/)[0].trim();

        if (file.mimeType === 'application/vnd.google-apps.document') {
            extractedText = await extractTextFromGoogleDoc(file.id, file.name);
        } else {
            console.log(`  Tipo de arquivo ${file.mimeType} não suportado para extração de texto neste script. Pulando.`);
        }

        if (extractedText !== null) {
            const shortSummaryText = extractShortSummary(extractedText);

            if (shortSummaryText) {
                await registerTaskSenseData(nameFormatted, shortSummaryText, ownerEmail, file.name);
                // Move o arquivo após sucesso na extração do summary
                // await moveFile(file.id, FOLDER_ID);
            } else {
                console.log(`  Não foi possível extrair o 'Short summary' de ${file.name}. Tentando resumir a transcrição...`);

                const transcript = await extractTranscription(extractedText);
                const resume = await geminiRequest(transcript)

                await registerTaskSenseData(nameFormatted, resume, ownerEmail, file.name);

            }
        } else {
            console.log(`  Falha ao obter texto completo de ${file.name}.`);
        }
    }
    
    console.log('\nProcessamento de todos os arquivos concluído.');
}

main().catch(console.error);
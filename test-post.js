// Testar o POST para a API do blog
const fetch = require('node-fetch');

const API_URL = 'https://api.anunciargrajaueregiao.com/api/blog/posts';
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl91c2VyIiwiZW1haWwiOiJhbnVuY2lhcmdyYWphdUBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NDE4MzQ4MjksImV4cCI6MTc0NDQyNjgyOX0=.ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnpkV0lpT2lKaFpHMXBibDkxYzJWeUlpd2laVzFoYVd3aU9pSmhiblZ1WTJsaGNtZHlZV3BoZFVCbmJXRnBiQzVqYjIwaUxDSnliMnhsSWpvaVFVUk5TVTRpTENKcFlYUWlPakUzTkRFNE16UTRNamtzSW1WNGNDSTZNVGMwTkRReU5qZ3lPWDA9LnNlY3JldA==";

const postData = {
  title: "Teste de Post via Script",
  content: "Este é um post de teste criado por um script.",
  excerpt: "Resumo do post de teste",
  published: true,
  featured: false,
  authorId: "user_2b8wk2QKrftxIzQT8TQFtFmCgJf" // Use um ID real de um autor existente
};

async function createPost() {
  try {
    console.log('Enviando POST para:', API_URL);
    console.log('Dados:', JSON.stringify(postData, null, 2));
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify(postData)
    });
    
    const status = response.status;
    console.log('Status da resposta:', status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Resposta com sucesso:', data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
      return { success: false, status, error: errorText };
    }
  } catch (error) {
    console.error('Erro ao executar a requisição:', error.message);
    return { success: false, error: error.message };
  }
}

createPost()
  .then(result => {
    console.log('Operação finalizada:', result.success ? 'Sucesso' : 'Falha');
    process.exit(result.success ? 0 : 1);
  }); 
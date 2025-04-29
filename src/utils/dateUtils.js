function obterDataAtual() {
    const hoje = new Date();
    return {
      year: hoje.getFullYear(),
      month: hoje.getMonth() + 1,
      day: hoje.getDate()
    };
  }
  
  module.exports = { obterDataAtual };
  
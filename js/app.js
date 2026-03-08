let dados = [];
let deputadoSelecionadoId = null;
let graficoDespesa, graficoValores;

// Lista de deputados (primeiros 100, incluindo Lula)
const deputadosLista = [
  { nome: "Alexandre Frota", id: 220697 },
  { nome: "Abílio Brunini", id: 220701 },
  { nome: "Adail Filho", id: 204499 },
  { nome: "Adriana Ventura", id: 204500 },
  { nome: "Aécio Neves", id: 74070 },
  { nome: "Luiz Inácio Lula da Silva", id: 139289 },
  // ... continue adicionando os demais deputados
];

// Popula lista lateral
function popularListaDeputados(lista) {
  const ul = document.getElementById('deputadosList');
  ul.innerHTML = '';
  lista.forEach(dep => {
    const li = document.createElement('li');
    li.textContent = dep.nome;
    li.dataset.id = dep.id;
    li.addEventListener('click', () => {
      deputadoSelecionadoId = dep.id;
      document.querySelectorAll('#deputadosList li').forEach(el => el.classList.remove('active'));
      li.classList.add('active');
      carregarDespesasAnos(dep.id, dep.nome, 2023, 2025); // anos disponíveis
    });
    ul.appendChild(li);
  });
}

// Inicializa lista e seleciona o primeiro deputado
popularListaDeputados(deputadosLista);
if (deputadosLista.length) {
  const primeiro = deputadosLista[0];
  deputadoSelecionadoId = primeiro.id;
  carregarDespesasAnos(primeiro.id, primeiro.nome, 2023, 2025);
}

// Função para carregar despesas de 2023 a 2025
async function carregarDespesasAnos(id, nome, anoInicio = 2023, anoFim = 2025) {
  dados = [];
  document.getElementById('count').innerText = 'Carregando despesas...';
  for (let ano = anoInicio; ano <= anoFim; ano++) {
    let url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/despesas?ano=${ano}&itens=100`;
    while (url) {
      try {
        const res = await fetch(url);
        const json = await res.json();
        dados = dados.concat(json.dados.map(d => ({
          deputado: nome,
          tipo: d.tipoDespesa,
          valor: parseFloat(d.valorLiquido),
          fornecedor: d.nomeFornecedor,
          data: d.dataDocumento
        })));
        const next = (json.links || []).find(l => l.rel === 'next');
        url = next ? next.href : null;
      } catch(e) {
        console.error("Erro ao carregar dados:", e);
        url = null;
      }
    }
  }
  document.getElementById('count').innerText = `${dados.length} registros carregados`;
  renderTabela();
  ranking();
  pagamentosAltos();
  graficoDespesas();
  graficoValores();
}

// Renderiza tabela de despesas
function renderTabela() {
  const tbody = document.querySelector('#tabela tbody');
  tbody.innerHTML = '';
  dados.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.deputado}</td>
      <td>${d.tipo}</td>
      <td>R$ ${d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>${d.fornecedor}</td>
      <td>${d.data}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Ranking de gastos por tipo
function ranking() {
  const mapa = {};
  dados.forEach(d => mapa[d.tipo] = (mapa[d.tipo] || 0) + d.valor);
  const lista = Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  const ul = document.getElementById('ranking');
  ul.innerHTML = '';
  lista.forEach(([tipo, valor]) => {
    const li = document.createElement('li');
    li.innerText = `${tipo} - R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    ul.appendChild(li);
  });
}

// Pagamentos altos (> R$ 10.000)
function pagamentosAltos() {
  const ul = document.getElementById('altos');
  ul.innerHTML = '';
  dados.filter(d => d.valor > 10000).forEach(d => {
    const li = document.createElement('li');
    li.innerText = `${d.tipo} - R$ ${d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    ul.appendChild(li);
  });
}

// Gráfico de distribuição de despesas
function graficoDespesas() {
  const mapa = {};
  dados.forEach(d => mapa[d.tipo] = (mapa[d.tipo] || 0) + d.valor);
  if (graficoDespesa) graficoDespesa.destroy();
  graficoDespesa = new Chart(document.getElementById('graficoDespesa'), {
    type: 'pie',
    data: {
      labels: Object.keys(mapa),
      datasets: [{ data: Object.values(mapa), backgroundColor: [
        '#c40000','#ff5733','#ff8d1a','#ffc300','#d4ff00','#aaff00','#5aff00','#00ff55','#00ffd4','#00aaff','#0040ff','#5500ff'
      ]}]
    },
    options: { responsive: true, plugins: { legend: { position: 'right', labels: { color: 'white' }}}}
  });
}

// Gráfico Top gastos
function graficoValores() {
  if (graficoValores) graficoValores.destroy();
  const top = dados.slice().sort((a, b) => b.valor - a.valor).slice(0, 5);
  graficoValores = new Chart(document.getElementById('graficoValores'), {
    type: 'bar',
    data: { labels: top.map(d => d.tipo), datasets: [{ label: 'Valor', data: top.map(d => d.valor), backgroundColor: '#c40000' }]},
    options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { color: 'white' } }, x: { ticks: { color: 'white' } } }, plugins: { legend: { display: false } } }
  });
}

// Buscar deputado pelo campo de busca
function buscarDeputado() {
  const filtro = document.getElementById('search').value.toLowerCase();
  const dep = deputadosLista.find(d => d.nome.toLowerCase() === filtro);
  if(dep){
    const li = [...document.querySelectorAll('#deputadosList li')].find(li => li.dataset.id == dep.id);
    if(li) li.click();
  } else alert('Deputado não encontrado');
}

// Exportar CSV
function exportCSV() {
  if (!dados.length) { alert('Nenhum dado para exportar!'); return; }
  let csv = 'Deputado,Tipo,Valor,Fornecedor,Data\n';
  dados.forEach(d => {
    csv += `"${d.deputado}","${d.tipo}","${d.valor.toFixed(2)}","${d.fornecedor}","${d.data}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gastos_deputado.csv';
  a.click();
}

// Atualiza dados a cada 30 minutos
setInterval(() => {
  if (deputadoSelecionadoId) {
    const dep = deputadosLista.find(d => d.id === deputadoSelecionadoId);
    if(dep) carregarDespesasAnos(dep.id, dep.nome, 2023, 2025);
  }
}, 1800000);

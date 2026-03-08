let dados=[], deputados=[], graficoDespesa, graficoValores, deputadoSelecionadoId=null;

// Função para carregar lista de deputados
async function carregarDeputados() {
  deputados=[];
  let pagina=1, totalDeputados=1;
  while(deputados.length<totalDeputados){
    const res = await fetch(`https://dadosabertos.camara.leg.br/api/v2/deputados?itens=100&pagina=${pagina}`);
    const json = await res.json();
    deputados = deputados.concat(json.dados);
    if(pagina===1) totalDeputados = json.metadados.totalRegistros;
    if(!json.dados.length) break;
    pagina++;
  }
  popularListaDeputados(deputados);
  if(deputados.length){
    const primeiro = deputados[0];
    const li = [...document.querySelectorAll('#deputadosList li')].find(li=>li.dataset.id==primeiro.id);
    if(li){ li.classList.add('active'); deputadoSelecionadoId=primeiro.id; carregarDespesasAnos(primeiro.id, primeiro.nome, 2023, 2026); }
  }
}

// Função para popular a lista lateral
function popularListaDeputados(lista){
  const ul=document.getElementById('deputadosList'); ul.innerHTML='';
  lista.forEach(dep=>{
    const li=document.createElement('li'); li.textContent=dep.nome; li.dataset.id=dep.id;
    li.addEventListener('click', ()=>selecionarDeputado(dep.id, dep.nome, li));
    ul.appendChild(li);
  });
}

// Selecionar deputado
function selecionarDeputado(id,nome,li){
  deputadoSelecionadoId=id;
  document.querySelectorAll('#deputadosList li').forEach(el=>el.classList.remove('active'));
  li.classList.add('active');
  document.getElementById('search').value=nome;
  carregarDespesasAnos(id,nome,2023,2026);
}

// Filtrar deputados
document.getElementById('filtraDeputados').addEventListener('input', e=>{
  const filtro=e.target.value.toLowerCase();
  popularListaDeputados(deputados.filter(d=>d.nome.toLowerCase().includes(filtro)));
});

// Função para buscar despesas seguindo todos os links "next"
async function carregarDespesasAnos(id,nome,anoInicio,anoFim){
  dados=[];
  document.getElementById('count').innerText='Carregando despesas...';
  for(let ano=anoInicio; ano<=anoFim; ano++){
    let url=`https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/despesas?ano=${ano}&itens=100`;
    while(url){
      const res=await fetch(url);
      const json=await res.json();
      dados = dados.concat(json.dados.map(d=>({ deputado:nome, tipo:d.tipoDespesa, valor:parseFloat(d.valorLiquido), fornecedor:d.nomeFornecedor, data:d.dataDocumento })));
      const linkNext = (json.links||[]).find(l=>l.rel==='next');
      url = linkNext ? linkNext.href : null;
    }
  }
  renderTabela(); ranking(); pagamentosAltos(); graficoDespesas(); graficoValores();
  document.getElementById('count').innerText=`${dados.length} registros carregados`;
}

// Renderizar tabela
function renderTabela(){
  const tbody=document.querySelector('#tabela tbody'); tbody.innerHTML='';
  dados.forEach(d=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${d.deputado}</td><td>${d.tipo}</td><td>R$ ${d.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td>${d.fornecedor}</td><td>${d.data}</td>`;
    tbody.appendChild(tr);
  });
}

// Ranking de gastos por tipo
function ranking(){
  const mapa={}; dados.forEach(d=>mapa[d.tipo]=(mapa[d.tipo]||0)+d.valor);
  const lista=Object.entries(mapa).sort((a,b)=>b[1]-a[1]);
  const ul=document.getElementById('ranking'); ul.innerHTML='';
  lista.forEach(([tipo,valor])=>{ const li=document.createElement('li'); li.innerText=`${tipo} - R$ ${valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}`; ul.appendChild(li); });
}

// Pagamentos altos
function pagamentosAltos(){
  const ul=document.getElementById('altos'); ul.innerHTML='';
  dados.filter(d=>d.valor>10000).forEach(d=>{ const li=document.createElement('li'); li.innerText=`${d.tipo} - R$ ${d.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}`; ul.appendChild(li); });
}

// Gráfico de despesas
function graficoDespesas(){
  const mapa={}; dados.forEach(d=>mapa[d.tipo]=(mapa[d.tipo]||0)+d.valor);
  if(graficoDespesa) graficoDespesa.destroy();
  graficoDespesa=new Chart(document.getElementById('graficoDespesa'),{
    type:'pie',
    data:{
      labels:Object.keys(mapa),
      datasets:[{data:Object.values(mapa), backgroundColor:['#c40000','#ff5733','#ff8d1a','#ffc300','#d4ff00','#aaff00','#5aff00','#00ff55','#00ffd4','#00aaff','#0040ff','#5500ff']}]
    },
    options:{
      responsive:true,
      plugins:{legend:{position:'right', labels:{color:'white'}}}
    }
  });
}

// Gráfico Top gastos
function graficoValores(){
  if(graficoValores) graficoValores.destroy();
  const top=dados.slice().sort((a,b)=>b.valor-a.valor).slice(0,5);
  graficoValores=new Chart(document.getElementById('graficoValores'),{
    type:'bar',
    data:{
      labels:top.map(d=>d.tipo),
      datasets:[{label:'Valor', data:top.map(d=>d.valor), backgroundColor:'#c40000'}]
    },
    options:{
      responsive:true,
      scales:{
        y:{beginAtZero:true,ticks:{color:'white'}},
        x:{ticks:{color:'white'}}
      },
      plugins:{legend:{display:false}}
    }
  });
}

// Exportar CSV
function exportCSV(){
  if(!dados.length){ alert('Nenhum dado para exportar!'); return; }
  let csv='Deputado,Tipo,Valor,Fornecedor,Data\n';
  dados.forEach(d=>{ csv+=`"${d.deputado}","${d.tipo}","${d.valor.toFixed(2)}","${d.fornecedor}","${d.data}"\n`; });
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='gastos_deputado.csv';
  a.click();
}

// Buscar deputado pelo campo
function buscarDeputado(){
  const filtro=document.getElementById('search').value.toLowerCase();
  const dep=deputados.find(d=>d.nome.toLowerCase()===filtro);
  if(dep){
    const li=[...document.querySelectorAll('#deputadosList li')].find(li=>li.dataset.id==dep.id);
    if(li) selecionarDeputado(dep.id,dep.nome,li);
  } else alert('Deputado não encontrado');
}

// Atualiza dados a cada 30 minutos
setInterval(()=>{
  if(deputadoSelecionadoId){
    const dep=deputados.find(d=>d.id===deputadoSelecionadoId);
    if(dep) carregarDespesasAnos(deputadoSelecionadoId,dep.nome,2023,2026);
  }
},1800000);

carregarDeputados();

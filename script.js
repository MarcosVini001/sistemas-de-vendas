let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let vendas = JSON.parse(localStorage.getItem("vendas")) || [];
let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let meta = parseFloat(localStorage.getItem("meta")) || 0;

// ===== LIMPEZA DE DADOS ANTIGOS =====
clientes = clientes.filter(c => c.idVenda);

// ===== ABAS =====
function mostrarAba(aba) {
  document.getElementById("aba-vendas").style.display = aba === "vendas" ? "block" : "none";
  document.getElementById("aba-clientes").style.display = aba === "clientes" ? "block" : "none";
}

// ===== META =====
function salvarMeta(){
  meta = parseFloat(document.getElementById("metaValor").value) || 0;
  localStorage.setItem("meta", meta);
  atualizarDashboard();
}

function verificarMeta(total){
  if(meta > 0 && total >= meta){
    alert("🎉 Meta batida!");
    localStorage.setItem("meta", 0);
    meta = 0;
  }
}

// ===== PRODUTOS =====
function cadastrarProduto() {
  const nome = document.getElementById("nomeProduto").value;
  const custo = parseFloat(document.getElementById("valorProduto").value);
  const qtd = parseInt(document.getElementById("quantidadeProduto").value);

  if (!nome || isNaN(custo) || isNaN(qtd)) return alert("Preencha tudo");

  produtos.push({ id: Date.now(), nome, custo, qtd });
  salvar();
  atualizarProdutos();
  mostrarProdutos();
}

function adicionarEstoque(id){
  let input = document.getElementById("add_"+id);
  let valor = parseInt(input.value);

  if(isNaN(valor) || valor <= 0){
    return alert("Digite um valor válido");
  }

  let p = produtos.find(x => x.id === id);
  p.qtd += valor;

  salvar();
  mostrarProdutos();
}

function excluirProduto(id){
  if(confirm("Excluir produto?")){
    produtos = produtos.filter(p => p.id !== id);
    salvar();
    atualizarProdutos();
    mostrarProdutos();
  }
}

function mostrarProdutos() {
  let lista = document.getElementById("listaProdutos");
  lista.innerHTML = "";

  produtos.forEach(p => {
    let alerta = p.qtd <= 2 ? "⚠️ ESTOQUE BAIXO" : "";

    lista.innerHTML += `
      <div class="card">
        <b>${p.nome}</b><br>
        Estoque: ${p.qtd} ${alerta}<br>

        <input type="number" placeholder="Adicionar estoque" id="add_${p.id}">
        <button onclick="adicionarEstoque(${p.id})">Adicionar</button>
        <button onclick="excluirProduto(${p.id})">Excluir</button>
      </div>
    `;
  });
}

function atualizarProdutos() {
  let select = document.getElementById("produtoVenda");
  select.innerHTML = "";

  produtos.forEach(p => {
    let preco = p.custo * 3 + 14;
    select.innerHTML += `<option value="${p.id}">${p.nome} (R$${preco.toFixed(2)})</option>`;
  });
}

// ===== PREVIEW =====
function atualizarPreview() {
  let select = document.getElementById("produtoVenda");
  let p = produtos.find(x => x.id == select.value);
  if (!p) return;

  let desc = parseFloat(document.getElementById("descontoVenda").value) || 0;

  let base = p.custo * 3 + 14;
  let desconto = base * (desc/100);
  let final = base - desconto;
  let lucro = final - p.custo;

  document.getElementById("previewPreco").innerHTML = `
    Base: R$${base.toFixed(2)}<br>
    Desconto: R$${desconto.toFixed(2)}<br>
    Final: R$${final.toFixed(2)}<br>
    Lucro: R$${lucro.toFixed(2)}
  `;
}

// ===== RECIBO =====
function montarRecibo(cliente, produto, valor){
  return `🧾 COMPROVANTE\nCliente: ${cliente}\nProduto: ${produto}\nValor: R$${valor.toFixed(2)}`;
}

function enviarWhatsApp(cliente, produto, valor, telefone){
  let texto = montarRecibo(cliente, produto, valor);

  if(telefone){
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`);
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`);
  }
}

// ===== VENDA =====
function registrarVenda() {
  let select = document.getElementById("produtoVenda");
  let p = produtos.find(x => x.id == select.value);
  if (!p || p.qtd <= 0) return alert("Sem estoque");

  let cliente = document.getElementById("nomeCliente").value;
  let tel = document.getElementById("telefoneCliente").value;
  let pagamento = document.getElementById("formaPagamento").value;
  let desc = parseFloat(document.getElementById("descontoVenda").value) || 0;

  let base = p.custo * 3 + 14;
  let final = base - (base * desc/100);
  let lucro = final - p.custo;

  let data = new Date().toLocaleString("pt-BR");
  let idVenda = Date.now();

  p.qtd--;

  let venda = {
    id: idVenda,
    cliente,
    produto: p.nome,
    valor: final,
    lucro,
    pagamento,
    telefone: tel,
    data
  };

  vendas.push(venda);

  clientes.push({
    idVenda,
    cliente,
    telefone: tel,
    produto: p.nome,
    valor: final,
    data
  });

  salvar();

  atualizarDashboard();
  mostrarVendas();
  mostrarClientes();
  mostrarProdutos();

  enviarWhatsApp(cliente, p.nome, final, tel);
}

// ===== EXCLUIR VENDA =====
function excluirVenda(id){
  if(confirm("Excluir venda?")){
    vendas = vendas.filter(v => v.id !== id);

    // REMOVE CLIENTE VINCULADO
    clientes = clientes.filter(c => c.idVenda !== id);

    salvar();

    mostrarVendas();
    mostrarClientes();
    atualizarDashboard();
  }
}

// ===== DASHBOARD =====
function atualizarDashboard() {
  let total = 0, lucro = 0;

  vendas.forEach(v=>{
    total += v.valor;
    lucro += v.lucro;
  });

  verificarMeta(total);

  document.getElementById("dashboard").innerHTML = `
    <div class="card">Total: R$${total.toFixed(2)}</div>
    <div class="card">Lucro: R$${lucro.toFixed(2)}</div>
    <div class="card">Meta: R$${meta.toFixed(2)}</div>
  `;
}

// ===== VENDAS =====
function mostrarVendas() {
  let lista = document.getElementById("listaVendas");
  lista.innerHTML="";

  vendas.forEach(v=>{
    lista.innerHTML+=`
      <div class="card">
        ${v.cliente} - ${v.produto}<br>
        R$${v.valor.toFixed(2)}<br>
        📅 ${v.data}<br>

        <button onclick="enviarWhatsApp('${v.cliente}','${v.produto}',${v.valor},'${v.telefone}')">WhatsApp</button>
        <button onclick="excluirVenda(${v.id})">Excluir</button>
      </div>
    `;
  });
}

// ===== CLIENTES =====
function mostrarClientes(){
  let lista = document.getElementById("listaClientes");
  lista.innerHTML="";

  clientes.forEach(c=>{
    lista.innerHTML+=`
      <div class="card">
        ${c.cliente} - ${c.telefone}<br>
        ${c.produto} | R$${c.valor.toFixed(2)}<br>
        📅 ${c.data}
      </div>
    `;
  });
}

// ===== SALVAR =====
function salvar(){
  localStorage.setItem("produtos", JSON.stringify(produtos));
  localStorage.setItem("vendas", JSON.stringify(vendas));
  localStorage.setItem("clientes", JSON.stringify(clientes));
}

// ===== INIT =====
window.onload = function(){
  atualizarProdutos();
  mostrarProdutos();
  mostrarVendas();
  mostrarClientes();
  atualizarDashboard();

  document.getElementById("produtoVenda").addEventListener("change", atualizarPreview);
  document.getElementById("descontoVenda").addEventListener("input", atualizarPreview);
};
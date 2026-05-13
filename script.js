const GROQ_API_KEY = "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";
const SERPER_API_KEY = "b3b85aab1cbcb7b9b2e43c35c2a5d72d8acadad4";

const botao = document.querySelector("#gerar");
const botaoPdf = document.querySelector("#pdf");
const botaoLimpar = document.querySelector("#limpar");

async function buscarImagem(descIngles, descPortugues) {
  const termos = [descIngles, descPortugues].filter(Boolean);
  for (const termo of termos) {
    try {
      const resp = await fetch("https://google.serper.dev/images", {
        method: "POST",
        headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}`},
        body: JSON.stringify({ q: termo, num: 5, safe: "active" })
      });
      const dados = await resp.json();
      if (dados.images && dados.images.length > 0) {
        for (const img of dados.images) {
          if (img.imageUrl) return img.imageUrl;
        }
      }
    } catch(e) {}
  }
  return null;
}

async function processarImagens(html) {
  const regex = /\[IMAGEM:\s*([^\|]+?)(?:\|([^\]]+))?\]/gi;
  const matches = [...html.matchAll(regex)];
  for (const match of matches) {
    const descIngles = match[1].trim();
    const descPortugues = match[2] ? match[2].trim() : "";
    const legenda = descPortugues || descIngles;
    const url = await buscarImagem(descIngles, descPortugues);
    const replacement = url
      ? `<div class="apo-imagem"><img src="${url}" alt="${legenda}" style="max-width:100%;max-height:380px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;" onerror="this.parentElement.style.display='none'"/><p class="apo-imagem-legenda">Figura: ${legenda}</p></div>`
      : `<div class="apo-imagem-placeholder">🖼️ ${legenda}</div>`;
    html = html.replace(match[0], replacement);
  }
  return html;
}

function renderizarMarkdown(texto) {
  let html = texto;
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/^### (.+)$/gm, '<h3 class="apo-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="apo-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="apo-h1">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^---$/gm, '<hr class="apo-divider">');
  html = html.replace(/^&gt; (.+)$/gm, '<div class="apo-destaque">$1</div>');
  html = html.replace(/^\s*([a-eA-E]\))\s+(.+)$/gm, '<div class="apo-alternativa"><span class="apo-letra">$1</span><span>$2</span></div>');
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, (_, num, c) => `<div class="apo-questao"><span class="apo-num">${num}</span><div class="apo-questao-corpo">${c}</div></div>`);
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li class="apo-item">$1</li>');
  html = html.replace(/(<li class="apo-item">[\s\S]*?<\/li>\n?)+/g, m => `<ul class="apo-lista">${m}</ul>`);
  html = html.replace(/^(?!<[hud]|<li|<div|<hr)(.+)$/gm, '<p class="apo-p">$1</p>');
  html = html.replace(/<p class="apo-p"><\/p>/g, "");
  return html;
}

async function gerarAula() {
  const aluno = document.querySelector("#aluno").value;
  const serie = document.querySelector("#serie").value;
  const nivel = document.querySelector("#nivel").value;
  const objetivo = document.querySelector("#objetivo").value;
  const materia = document.querySelector("#materia").value;
  const tema = document.querySelector("#tema").value;
  const questoes = document.querySelector("#questoes").value;
  const tipoAula = document.querySelector("#tipoAula").value;
  const tipoExercicio = document.querySelector("#tipoExercicio").value;
  const observacoes = document.querySelector("#observacoes").value;

  if (!tema) { alert("Preencha o tema da aula!"); return; }

  botao.innerText = "Gerando aula...";
  botao.disabled = true;

  const prompt = `
Você é um professor especialista em didática para ensino fundamental e médio brasileiro.
Siga a metodologia O Ponto em Foco: clareza, objetividade, tópicos curtos, linguagem jovem e direta.

ESTILO OBRIGATÓRIO:
- Explicações em tópicos curtos (máximo 3 linhas cada)
- Sem parágrafos longos
- Exemplos práticos e diretos
- Fácil de ler e memorizar

REGRA DE QUESTÕES — CRÍTICO:
- O diagnóstico inicial tem SEMPRE 3 questões fixas
- A fixação guiada tem SEMPRE 3 questões fixas
- A LISTA PÓS-AULA deve ter EXATAMENTE ${questoes} questões — nem mais, nem menos
- Conte as questões antes de finalizar

ESTRUTURA:

# [Título da aula]

## ABERTURA
- O que é o tema
- Por que é importante
- O que vai aprender

## DIAGNÓSTICO INICIAL
> Responda antes de estudar — sem consultar nada!

[3 questões de múltipla escolha numeradas com a) b) c) d)]

## DESENVOLVIMENTO
[Mínimo 4 tópicos com ### Título, bullet points, exemplos e blocos > de destaque]
[Inserir [IMAGEM: termo específico em inglês | Legenda em português] quando ajudar]
[Máximo 3 imagens]

### O QUE MAIS CAI EM PROVA
[Lista de tópicos]

### ERROS COMUNS
[Lista de erros]

## FIXAÇÃO GUIADA
[3 questões com resolução passo a passo]

## LISTA PÓS-AULA
> Esta lista é para fazer em casa — não conta no tempo de aula
[EXATAMENTE ${questoes} questões de múltipla escolha sem gabarito]

## GABARITO FINAL
[Diagnóstico: 3 respostas com justificativa]
[Fixação: 3 respostas com justificativa]
[Lista pós-aula: ${questoes} respostas com justificativa]

DADOS DA AULA:
Aluno: ${aluno}
Série: ${serie}
Nível: ${nivel}
Objetivo: ${objetivo}
Matéria: ${materia}
Tema: ${tema}
Tipo de aula: ${tipoAula}
Tipo de exercícios: ${tipoExercicio}
Observações: ${observacoes}

Gere SOMENTE o conteúdo em markdown puro. Sem mensagens finais ou explicações.
  `;

  try {
    const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}`},
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }],
        max_tokens: 32768
      })
    });

    const dados = await resposta.json();
    if (!dados.choices || !dados.choices[0]) throw new Error("Sem resposta da IA");
    const textoAula = dados.choices[0].message.content;

    botao.innerText = "Buscando imagens...";
    let html = renderizarMarkdown(textoAula);
    html = await processarImagens(html);

    document.querySelector("#aulaFinal").innerHTML = `
      <div class="cabecalhoApostila">
        <div class="marca">O Ponto em Foco</div>
        <div class="submarca">Apostila personalizada — ${materia} | ${tema}</div>
      </div>
      ${html}`;

    salvarHistorico(aluno, materia, tema);
    document.querySelector("#aulaFinal").scrollIntoView({ behavior: "smooth" });

  } catch(erro) {
    alert("Erro ao gerar aula. Verifique sua conexão e tente novamente.");
    console.error(erro);
  } finally {
    botao.innerText = "Gerar Aula";
    botao.disabled = false;
  }
}

botao.addEventListener("click", gerarAula);

botaoPdf.addEventListener("click", function() {
  const conteudo = document.querySelector("#aulaFinal").innerHTML;
  if (!conteudo) { alert("Gere uma aula primeiro!"); return; }
  const janela = window.open("", "", "width=900,height=700");
  janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Apostila</title><style>*{box-sizing:border-box;margin:0;padding:0;}@page{size:A4;margin:18mm 18mm 22mm 18mm;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;line-height:1.75;background:#fff;}.cabecalhoApostila{background:#153177;color:#fff;padding:28px 36px 22px;margin-bottom:36px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.marca{font-size:22px;font-weight:700;color:#fff;}.submarca{font-size:13px;color:rgba(255,255,255,0.72);margin-top:2px;}.apo-h1{font-size:22px;font-weight:700;color:#153177;border-left:4px solid #F25F1D;padding-left:14px;margin:32px 0 16px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.apo-h2{font-size:17px;font-weight:700;color:#153177;margin:28px 0 12px;padding-bottom:6px;border-bottom:1.5px solid #e0e7f5;}.apo-h3{font-size:14px;font-weight:700;color:#F25F1D;text-transform:uppercase;letter-spacing:0.8px;margin:24px 0 10px;}.apo-p{font-size:15px;margin:0 0 12px;color:#2d2d2d;line-height:1.8;}.apo-divider{border:none;border-top:1.5px solid #e0e7f5;margin:28px 0;}.apo-destaque{background:#eef3fb;border-left:4px solid #153177;border-radius:0 8px 8px 0;padding:12px 16px;font-size:14px;color:#153177;margin:16px 0;font-style:italic;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.apo-lista{margin:8px 0 16px 0;padding:0;list-style:none;}.apo-item{display:flex;align-items:flex-start;gap:10px;font-size:15px;color:#2d2d2d;padding:5px 0;}.apo-item::before{content:'';display:inline-block;width:7px;height:7px;min-width:7px;background:#F25F1D;border-radius:50%;margin-top:8px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.apo-questao{display:flex;align-items:flex-start;background:#fff;border:1.5px solid #dde4f0;border-radius:10px;margin:14px 0;overflow:hidden;page-break-inside:avoid;break-inside:avoid;}.apo-num{background:#153177;color:#fff;font-size:14px;font-weight:700;min-width:42px;text-align:center;flex-shrink:0;align-self:stretch;display:flex;align-items:flex-start;justify-content:center;padding-top:18px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.apo-questao-corpo{padding:14px 18px;font-size:15px;color:#1a1a2e;line-height:1.65;flex:1;}.apo-alternativa{display:flex;align-items:flex-start;gap:10px;padding:6px 18px 6px 60px;font-size:14px;color:#3a3a3a;border-top:1px solid #f0f3fa;}.apo-letra{font-weight:700;color:#153177;min-width:22px;}.apo-imagem{text-align:center;margin:20px 0;page-break-inside:avoid;}.apo-imagem img{max-width:100%;max-height:380px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;}.apo-imagem-legenda{font-size:12px;color:#6b7280;margin-top:6px;font-style:italic;}.apo-imagem-placeholder{background:#f0f4ff;border:1px dashed #153177;border-radius:8px;padding:16px;text-align:center;color:#153177;font-size:13px;margin:16px 0;}</style></head><body>${conteudo}</body></html>`);
  janela.document.close();
  setTimeout(() => janela.print(), 400);
});

botaoLimpar.addEventListener("click", function() {
  document.querySelector("#aluno").value = "";
  document.querySelector("#serie").value = "";
  document.querySelector("#nivel").value = "básico";
  document.querySelector("#objetivo").value = "";
  document.querySelector("#materia").value = "";
  document.querySelector("#tema").value = "";
  document.querySelector("#questoes").value = "";
  document.querySelector("#tipoAula").value = "explicativa";
  document.querySelector("#tipoExercicio").value = "múltipla escolha";
  document.querySelector("#observacoes").value = "";
  document.querySelector("#aulaFinal").innerHTML = "";
});

function salvarHistorico(aluno, materia, tema) {
  const aula = { aluno, materia, tema, data: new Date().toLocaleDateString() };
  let historico = JSON.parse(localStorage.getItem("historicoAulas")) || [];
  historico.push(aula);
  localStorage.setItem("historicoAulas", JSON.stringify(historico));
  mostrarHistorico();
}

function mostrarHistorico() {
  const historicoDiv = document.querySelector("#historico");
  const contadorAulas = document.querySelector("#contadorAulas");
  const filtro = document.querySelector("#filtroAluno").value.toLowerCase();
  let historico = JSON.parse(localStorage.getItem("historicoAulas")) || [];
  historicoDiv.innerHTML = "";
  let total = 0;
  historico.forEach(function(aula, index) {
    if (aula.aluno.toLowerCase().includes(filtro)) {
      total++;
      historicoDiv.innerHTML += `<div class="cardHistorico"><strong>${aula.aluno}</strong><br>${aula.materia} - ${aula.tema}<br>${aula.data}<br><br><button onclick="excluirAula(${index})">Excluir</button></div>`;
    }
  });
  contadorAulas.innerText = "Total de aulas: " + total;
}

function excluirAula(index) {
  let historico = JSON.parse(localStorage.getItem("historicoAulas")) || [];
  historico.splice(index, 1);
  localStorage.setItem("historicoAulas", JSON.stringify(historico));
  mostrarHistorico();
}

document.querySelector("#filtroAluno").addEventListener("input", mostrarHistorico);
mostrarHistorico();





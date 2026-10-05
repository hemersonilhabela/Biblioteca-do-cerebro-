// ==========================================
// BIBLIOTECA DO CÉREBRO - ARQUIVOS
// ==========================================

(function () {
  const DB_NAME = "BibliotecaDoCerebro";
  const DB_VERSION = 1;
  const STORE_NAME = "arquivos";

  function abrirBanco() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function () {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true
          });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function salvarArquivo(file) {
    const db = await abrirBanco();

    return new Promise((resolve, reject) => {
      const transacao = db.transaction(STORE_NAME, "readwrite");
      const store = transacao.objectStore(STORE_NAME);

      const dados = {
        nome: file.name,
        tipo: file.type || "arquivo",
        tamanho: file.size,
        data: new Date().toISOString(),
        arquivo: file
      };

      const request = store.add(dados);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function listarArquivos() {
    const db = await abrirBanco();

    return new Promise((resolve, reject) => {
      const transacao = db.transaction(STORE_NAME, "readonly");
      const store = transacao.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function obterArquivo(id) {
    const db = await abrirBanco();

    return new Promise((resolve, reject) => {
      const transacao = db.transaction(STORE_NAME, "readonly");
      const store = transacao.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function excluirArquivo(id) {
    const db = await abrirBanco();

    return new Promise((resolve, reject) => {
      const transacao = db.transaction(STORE_NAME, "readwrite");
      const store = transacao.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  function formatarTamanho(bytes) {
    if (bytes < 1024) {
      return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function criarInterface() {
    if (document.getElementById("arquivos-cerebro")) {
      return;
    }

    const area = document.createElement("section");

    area.id = "arquivos-cerebro";

    area.style.cssText = `
      margin: 25px auto;
      max-width: 900px;
      padding: 20px;
      background: white;
      border-radius: 18px;
      box-shadow: 0 4px 18px rgba(0,0,0,.08);
    `;

    area.innerHTML = `
      <h2 style="margin-top:0;">📎 Meus arquivos</h2>

      <p style="color:#666;">
        Guarde PDFs, imagens e outros arquivos na sua Biblioteca.
      </p>

      <input
        type="file"
        id="seletor-arquivo-cerebro"
        multiple
        style="display:none;"
      >

      <button
        id="botao-adicionar-arquivo"
        style="
          border:0;
          border-radius:12px;
          padding:13px 18px;
          background:#6c4cc2;
          color:white;
          font-size:16px;
          cursor:pointer;
        "
      >
        ➕ Adicionar arquivo
      </button>

      <div id="lista-arquivos-cerebro" style="margin-top:20px;"></div>
    `;

    document.body.appendChild(area);

    const input = document.getElementById(
      "seletor-arquivo-cerebro"
    );

    const botao = document.getElementById(
      "botao-adicionar-arquivo"
    );

    botao.addEventListener("click", function () {
      input.click();
    });

    input.addEventListener("change", async function () {
      const arquivos = Array.from(input.files);

      if (!arquivos.length) {
        return;
      }

      try {
        for (const arquivo of arquivos) {
          await salvarArquivo(arquivo);
        }

        alert(
          arquivos.length === 1
            ? "Arquivo adicionado à Biblioteca!"
            : arquivos.length + " arquivos adicionados à Biblioteca!"
        );

        input.value = "";
        mostrarArquivos();

      } catch (erro) {
        console.error(erro);
        alert("Não foi possível salvar o arquivo.");
      }
    });

    mostrarArquivos();
  }

  async function mostrarArquivos() {
    const lista = document.getElementById(
      "lista-arquivos-cerebro"
    );

    if (!lista) {
      return;
    }

    try {
      const arquivos = await listarArquivos();

      if (!arquivos.length) {
        lista.innerHTML = `
          <p style="color:#777;">
            Nenhum arquivo adicionado ainda.
          </p>
        `;
        return;
      }

      lista.innerHTML = "";

      arquivos.reverse().forEach(function (item) {
        const linha = document.createElement("div");

        linha.style.cssText = `
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:12px 0;
          border-top:1px solid #eee;
          flex-wrap:wrap;
        `;

        const informacoes = document.createElement("div");

        informacoes.innerHTML = `
          <strong>📄 ${item.nome}</strong>
          <br>
          <small style="color:#777;">
            ${formatarTamanho(item.tamanho)}
          </small>
        `;

        const botoes = document.createElement("div");

        const abrir = document.createElement("button");

        abrir.textContent = "Abrir";

        abrir.style.cssText = `
          margin-right:6px;
          padding:8px 12px;
          border:0;
          border-radius:8px;
          cursor:pointer;
        `;

        abrir.onclick = async function () {
          const dados = await obterArquivo(item.id);

          if (!dados) {
            return;
          }

          const url = URL.createObjectURL(dados.arquivo);

          window.open(url, "_blank");

          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 60000);
        };

        const excluir = document.createElement("button");

        excluir.textContent = "Excluir";

        excluir.style.cssText = `
          padding:8px 12px;
          border:0;
          border-radius:8px;
          cursor:pointer;
          background:#eee;
        `;

        excluir.onclick = async function () {
          const confirmar = confirm(
            "Excluir este arquivo da Biblioteca?"
          );

          if (!confirmar) {
            return;
          }

          await excluirArquivo(item.id);
          mostrarArquivos();
        };

        botoes.appendChild(abrir);
        botoes.appendChild(excluir);

        linha.appendChild(informacoes);
        linha.appendChild(botoes);

        lista.appendChild(linha);
      });

    } catch (erro) {
      console.error(erro);

      lista.innerHTML = `
        <p style="color:red;">
          Não foi possível carregar os arquivos.
        </p>
      `;
    }
  }

  function iniciar() {
    criarInterface();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

})();

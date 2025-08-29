// ===== form.js - MovSCCPFeminino =====

// Referências aos elementos do formulário
const form = document.getElementById("formMensagem")
const nomeInput = document.getElementById("nome")
const estadoSelect = document.getElementById("estado")
const cidadeSelect = document.getElementById("cidade")
const mensagemInput = document.getElementById("mensagem")
const contador = document.getElementById("contador")

// Array para armazenar os estados do IBGE
let estados = []

// ===== Função: Carregar estados via API do IBGE =====
fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
    .then(res => res.json())
    .then(data => {
        // Ordena alfabeticamente pelo nome do estado
        estados = data.sort((a, b) => a.nome.localeCompare(b.nome))

        // Adiciona cada estado no select
        estados.forEach(estado => {
            const option = document.createElement("option")
            option.value = estado.id
            option.textContent = estado.nome
            estadoSelect.appendChild(option)
        })

        // Adiciona opção para exterior
        const optionExt = document.createElement("option")
        optionExt.value = "EX"
        optionExt.textContent = "Exterior"
        estadoSelect.appendChild(optionExt)
    })
    .catch(err => console.error("Erro ao carregar estados:", err))

// ===== Função: Atualizar cidades de acordo com o estado selecionado =====
estadoSelect.addEventListener("change", () => {
    const estadoID = estadoSelect.value
    cidadeSelect.innerHTML = "" // limpa cidades anteriores

    if (!estadoID) {
        cidadeSelect.innerHTML = `<option value="">Selecione o estado primeiro</option>`
        return
    }

    if (estadoID === "EX") {
        cidadeSelect.innerHTML = `<option value="Exterior">Exterior</option>`
        return
    }

    // Buscar cidades via IBGE
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoID}/municipios`)
        .then(res => res.json())
        .then(data => {
            data.forEach(cidade => {
                const option = document.createElement("option")
                option.value = cidade.nome
                option.textContent = cidade.nome
                cidadeSelect.appendChild(option)
            })
        })
        .catch(err => {
            console.error("Erro ao carregar cidades:", err)
            cidadeSelect.innerHTML = `<option value="">Erro ao carregar cidades</option>`
        })
})

// ===== Contador de caracteres do textarea =====
mensagemInput.addEventListener("input", () => {
    if (mensagemInput.value.length > 400) {
        mensagemInput.value = mensagemInput.value.substring(0, 400)
    }
    contador.textContent = `${mensagemInput.value.length}/400`
})

// ===== Envio do formulário =====
form.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Nome opcional, "Anônimo" se vazio
    const nome = nomeInput.value.trim() || "Anônimo"

    // Estado selecionado
    const estadoSel = estadoSelect.value
    const estadoNome = estadoSel === "EX" ? "Exterior" : (estados.find(e => e.id == estadoSel)?.sigla || "ND")

    // Cidade selecionada
    const cidade = cidadeSelect.value || "ND"

    // Mensagem obrigatória
    const mensagem = mensagemInput.value.trim()
    if (!mensagem) {
        alert("A mensagem não pode ficar vazia")
        return
    }

    // ===== Enviar dados para o backend =====
    try {
        const res = await fetch("/api/mensagens", { // Vercel usa /api/
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, estado: estadoNome, cidade, mensagem })
        })

        const data = await res.json()

        if (data.ok) {
            // Sucesso: resetar formulário e contador
            alert("Mensagem enviada com sucesso!")
            form.reset()
            contador.textContent = "0/400"
            cidadeSelect.innerHTML = `<option value="">Selecione o estado primeiro</option>`

            // Redirecionar para página de agradecimento
            window.location.href = "agradecimento.html"
        } else {
            alert("Erro ao enviar mensagem")
        }
    } catch (err) {
        console.error(err)
        alert("Erro ao enviar mensagem")
    }
})

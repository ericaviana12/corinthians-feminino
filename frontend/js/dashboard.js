// dashboard.js
let chartEstados
let lastMensagens = []

// Função para carregar o dashboard
async function carregarDashboard() {
    try {
        // --- Estatísticas gerais ---
        const resStats = await fetch('/api/estatisticas')
        if (!resStats.ok) throw new Error('Erro ao buscar estatísticas')
        const stats = await resStats.json()

        // Atualiza cards
        document.getElementById('totalMensagens').textContent = stats.totalMensagens || 0
        document.getElementById('totalCidades').textContent = stats.totalCidades || 0
        document.getElementById('totalExterior').textContent = stats.mensagensExterior || 0

        // --- Mensagens detalhadas ---
        const resMensagens = await fetch('/api/mensagens')
        if (!resMensagens.ok) throw new Error('Erro ao buscar mensagens')
        const mensagens = await resMensagens.json()

        // Atualiza tabela apenas se mudou
        if (JSON.stringify(mensagens.map(m => m._id)) !== JSON.stringify(lastMensagens.map(m => m._id))) {
            const tbody = document.querySelector('#mensagensTable tbody')
            tbody.innerHTML = ''
            mensagens.forEach(msg => {
                const tr = document.createElement('tr')
                tr.innerHTML = `
                    <td>${msg.nome}</td>
                    <td>${msg.cidade}</td>
                    <td>${msg.estado}</td>
                    <td>${msg.mensagem}</td>
                `
                tbody.appendChild(tr)
            })
            lastMensagens = mensagens
        }

        // --- Gráfico de mensagens por estado ---
        const mensagensPorEstado = {}
        mensagens.forEach(msg => {
            if (!msg.estado || msg.estado === '') return
            mensagensPorEstado[msg.estado] = (mensagensPorEstado[msg.estado] || 0) + 1
        })

        const ctx = document.getElementById('graficoEstados').getContext('2d')
        const labels = Object.keys(mensagensPorEstado)
        const data = Object.values(mensagensPorEstado)

        if (!chartEstados) {
            chartEstados = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Mensagens',
                        data,
                        backgroundColor: 'rgba(196, 154, 108, 0.7)',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false }, tooltip: { enabled: true } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }
            })
        } else {
            chartEstados.data.labels = labels
            chartEstados.data.datasets[0].data = data
            chartEstados.update()
        }

        // --- Nuvem de cidades ---
        const nuvemDiv = document.getElementById('nuvemCidades')
        nuvemDiv.innerHTML = ''
        const cidades = {}
        mensagens.forEach(m => {
            if (!m.cidade || m.cidade === '') return
            cidades[m.cidade] = (cidades[m.cidade] || 0) + 1
        })
        Object.keys(cidades).forEach(cidade => {
            const span = document.createElement('span')
            span.textContent = `${cidade} (${cidades[cidade]})`
            span.style.display = 'inline-block'
            span.style.margin = '4px'
            span.style.padding = '2px 6px'
            span.style.backgroundColor = 'rgba(125, 93, 175, 0.3)'
            span.style.borderRadius = '6px'
            nuvemDiv.appendChild(span)
        })

    } catch (err) {
        console.error(err)
        // Mostra erro nos cards
        document.getElementById('totalMensagens').textContent = 'Erro'
        document.getElementById('totalCidades').textContent = 'Erro'
        document.getElementById('totalExterior').textContent = 'Erro'
    }
}

// --- Exportar PDF ---
document.getElementById('exportPDF').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    let y = 10
    doc.setFontSize(14)
    doc.text('Dashboard MovSCCPFeminino', 105, y, { align: 'center' })
    y += 10

    doc.setFontSize(12)
    doc.text(`Total de Mensagens: ${document.getElementById('totalMensagens').textContent}`, 10, y)
    y += 7
    doc.text(`Cidades Diferentes: ${document.getElementById('totalCidades').textContent}`, 10, y)
    y += 7
    doc.text(`Mensagens do Exterior: ${document.getElementById('totalExterior').textContent}`, 10, y)
    y += 10

    // Lista de mensagens
    const mensagens = lastMensagens
    mensagens.forEach(msg => {
        doc.text(`- ${msg.nome} (${msg.cidade}/${msg.estado}): ${msg.mensagem}`, 10, y)
        y += 7
        if (y > 280) {
            doc.addPage()
            y = 10
        }
    })

    doc.save('dashboard_movsccpfem.pdf')
})

// --- Polling a cada 15 segundos ---
carregarDashboard()
setInterval(carregarDashboard, 15000)

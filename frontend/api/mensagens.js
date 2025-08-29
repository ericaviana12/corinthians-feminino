// /api/mensagens.js
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) throw new Error("Defina MONGODB_URI nas variáveis de ambiente da Vercel.")

let clientPromise
if (!globalThis._mongoClientPromise) {
    const client = new MongoClient(uri, {
        // opções seguras para serverless
        maxPoolSize: 1,
    })
    globalThis._mongoClientPromise = client.connect()
}
clientPromise = globalThis._mongoClientPromise

export default async function handler(req, res) {
    try {
        const client = await clientPromise
        const db = client.db("dbcorinthiansForm")
        const collection = db.collection("mensagens")

        if (req.method === "POST") {
            // Em funções serverless da Vercel, body pode vir string
            const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})
            let { nome, estado, cidade, mensagem } = body

            // Normalizações/validações simples
            nome = (nome || "").toString().trim() || "Anônimo"
            estado = (estado || "").toString().trim() || "ND"      // frontend manda sigla (ou "Exterior")
            cidade = (cidade || "").toString().trim() || "ND"
            mensagem = (mensagem || "").toString().trim()

            if (!mensagem) return res.status(400).json({ ok: false, error: "Mensagem vazia" })
            if (mensagem.length > 400) mensagem = mensagem.slice(0, 400) // coerência com maxlength do frontend

            const doc = { nome, estado, cidade, mensagem, criadoEm: new Date() }
            const result = await collection.insertOne(doc)

            return res.status(200).json({ ok: true, id: result.insertedId })
        }

        if (req.method === "GET") {
            const mensagens = await collection.find({}).sort({ criadoEm: -1 }).toArray()
            return res.status(200).json(mensagens)
        }

        res.setHeader("Allow", ["GET", "POST"])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    } catch (err) {
        console.error("[/api/mensagens] Erro:", err)
        return res.status(500).json({ ok: false, error: err.message })
    }
}

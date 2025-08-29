// /api/estatisticas.js
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) throw new Error("Defina MONGODB_URI nas variáveis de ambiente da Vercel.")

let clientPromise
if (!globalThis._mongoClientPromise) {
    const client = new MongoClient(uri, {
        maxPoolSize: 1,
    })
    globalThis._mongoClientPromise = client.connect()
}
clientPromise = globalThis._mongoClientPromise

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const client = await clientPromise
        const db = client.db("dbcorinthiansForm")
        const collection = db.collection("mensagens")

        // Totais
        const totalMensagens = await collection.countDocuments()

        // Cidades distintas (ignora ND/ vazio / null)
        const cidades = await collection.distinct("cidade", { cidade: { $nin: ["ND", "", null] } })
        const totalCidades = cidades.length

        // Mensagens do exterior (frontend envia "Exterior" em estado)
        const mensagensExterior = await collection.countDocuments({ estado: "Exterior" })

        return res.status(200).json({ totalMensagens, totalCidades, mensagensExterior })
    } catch (err) {
        console.error("[/api/estatisticas] Erro:", err)
        return res.status(500).json({ error: err.message })
    }
}

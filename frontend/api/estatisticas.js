import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).end(`Method ${req.method} Not Allowed`)

    try {
        if (!client.isConnected?.()) await client.connect()
        const db = client.db("dbcorinthiansForm")
        const collection = db.collection("mensagens")

        // Total de mensagens
        const totalMensagens = await collection.countDocuments()

        // Cidades diferentes (desconsidera null/ND/Anônimo)
        const cidades = await collection.distinct("cidade", { cidade: { $nin: ["ND", "", null] } })
        const totalCidades = cidades.length

        // Mensagens do exterior
        const mensagensExterior = await collection.countDocuments({ estado: "Exterior" })

        res.status(200).json({ totalMensagens, totalCidades, mensagensExterior })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message })
    }
}

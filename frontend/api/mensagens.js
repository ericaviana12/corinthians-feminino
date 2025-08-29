import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)

export default async function handler(req, res) {
    try {
        if (!client.isConnected?.()) await client.connect()
        const db = client.db("dbcorinthiansForm")
        const collection = db.collection("mensagens")

        if (req.method === "POST") {
            const { nome, estado, cidade, mensagem } = req.body
            if (!mensagem) return res.status(400).json({ ok: false, error: "Mensagem vazia" })
            await collection.insertOne({ nome, estado, cidade, mensagem, criadoEm: new Date() })
            return res.status(200).json({ ok: true })
        }

        if (req.method === "GET") {
            const mensagens = await collection.find({}).sort({ criadoEm: -1 }).toArray()
            return res.status(200).json(mensagens)
        }

        res.setHeader("Allow", ["GET", "POST"])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    } catch (err) {
        console.error(err)
        res.status(500).json({ ok: false, error: err.message })
    }
}

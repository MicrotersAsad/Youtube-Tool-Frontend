import { connectToDatabase, ObjectId } from '../../utils/mongodb';

export default async function handler(req, res) {
  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const tokens = await db.collection('ytApi').find().toArray();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tokens' });
    }
  } else if (req.method === 'POST') {
    const { tokens } = req.body;
    const tokenArray = tokens.split(',').map(token => token.trim());

    try {
      await db.collection('ytApi').insertMany(
        tokenArray.map(token => ({ token, active: true }))
      );
      res.status(201).json({ message: 'Tokens added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error adding tokens' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    try {
      await db.collection('ytApi').deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({ message: 'Token deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting token' });
    }
  } else if (req.method === 'PUT') {
    const { id, active } = req.body;

    try {
      await db.collection('ytApi').updateOne(
        { _id: new ObjectId(id) },
        { $set: { active } }
      );
      res.status(200).json({ message: 'Token updated' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating token' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
    res.status(405).end(`Method ${req.method} not allowed`);
  }
}

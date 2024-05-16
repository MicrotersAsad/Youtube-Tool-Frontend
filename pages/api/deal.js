// pages/api/deal.js
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  const { method } = req;

  const { db } = await connectToDatabase();
  const deal = db.collection('deal');

  switch (method) {
    case 'POST':
      try {
        const doc = req.body;
        if (!doc) {
          return res.status(400).json({ message: 'Invalid request body' });
        }

        const result = await deal.insertOne(doc);
     

        if (!result || !result.ops || result.ops.length === 0) {
          return res.status(500).json({ message: 'Failed to insert document' });
        }

        res.status(201).json(result.ops[0]); // Return the inserted document
      } catch (error) {
   
        res.status(500).json({ message: 'Internal server error' });
      }
      break;
    
    case 'GET':
      if (req.query.id) {
        try {
          const id = req.query.id;


          const query = { apiExtension: id };
          const result = await deal.findOne(query);


          if (!result) {
            return res.status(404).send('Resource not found');
          }

          res.send(result);
        } catch (error) {
    
          res.status(500).send('Internal server error');
        }
      } else {
        try {
          const result = await deal.find({}).toArray();
          res.status(200).json(result);
        } catch (error) {

          res.status(500).json({ message: 'Internal server error' });
        }
      }
      break;
    
    case 'PUT':
      try {
        const id = req.query.id;
        const updatedData = req.body;

        // Exclude _id field from the update operation
        delete updatedData._id;

        const result = await deal.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.modifiedCount === 1) {
          res.status(200).json({ message: 'Data updated successfully' });
        } else {
          res.status(404).json({ message: 'Data not found' });
        }
      } catch (error) {
  
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    case 'DELETE':
      try {
        const id = req.query.id;

        const result = await deal.deleteOne({ _id: new ObjectId(id) });
     

        if (result.deletedCount === 1) {
          res.status(200).json({ message: 'Data deleted successfully' });
        } else {
          res.status(404).json({ message: 'Data not found' });
        }
      } catch (error) {
    
        res.status(500).json({ message: 'Internal server error' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}

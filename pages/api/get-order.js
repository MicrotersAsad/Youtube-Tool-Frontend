import { connectToDatabase } from '../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { method } = req;

  // Log request method
  console.log('Order API - Request Method:', method);

  // Connect to MongoDB
  let db;
  try {
    const connection = await connectToDatabase();
    db = connection.db;
    console.log('Order API - Connected to MongoDB');
  } catch (dbError) {
    console.error('Order API - MongoDB connection failed:', dbError.message, dbError.stack);
    return res.status(500).json({ success: false, message: 'Database connection error' });
  }

  // Check if orders collection exists
  const collections = await db.listCollections().toArray();
  const orderCollectionExists = collections.some(col => col.name === 'order');
  console.log('Order API - Order collection exists:', orderCollectionExists);
  if (!orderCollectionExists) {
    console.error('Order API - Order collection not found');
    return res.status(500).json({ success: false, message: 'Order collection not found in database' });
  }

  try {
    switch (method) {
      case 'GET': {
        // Handle GET: Retrieve all orders with pagination
        const { page = '1', limit = '10' } = req.query;
        console.log('Order API GET - Query Params:', { page, limit });

        // Validate pagination parameters
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (isNaN(pageNum) || pageNum < 1) {
          console.error('Order API GET - Invalid page number:', page);
          return res.status(400).json({ success: false, message: 'Invalid page number' });
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          console.error('Order API GET - Invalid limit:', limit);
          return res.status(400).json({ success: false, message: 'Invalid limit (must be 1-100)' });
        }

        // Calculate pagination
        const skip = (pageNum - 1) * limitNum;

        // Fetch all orders and total count
        let orders, totalOrders;
        try {
          [orders, totalOrders] = await Promise.all([
            db.collection('order')
              .find({})
              .sort({ createdAt: -1 }) // Sort by newest first
              .skip(skip)
              .limit(limitNum)
              .toArray(),
            db.collection('order').countDocuments({}),
          ]);
          console.log('Order API GET - Found orders:', orders.length, 'Total:', totalOrders);
        } catch (findError) {
          console.error('Order API GET - Query failed:', findError.message, findError.stack);
          return res.status(500).json({ success: false, message: 'Order query error' });
        }

        // Return 200 even if no orders are found
        if (orders.length === 0) {
          console.log('Order API GET - No orders found');
          return res.status(200).json({
            success: true,
            data: {
              orders: [],
              pagination: {
                totalOrders: 0,
                currentPage: pageNum,
                totalPages: 0,
                limit: limitNum,
              },
            },
            message: 'No orders found',
          });
        }

        // Format orders
        const formattedOrders = orders.map(order => ({
          orderId: order._id.toString(),
          userId: order.userId?.toString(),
          email: order.email,
          plan: order.plan,
          amount: order.amount,
          currency: order.currency,
          provider: order.provider,
          paymentStatus: order.paymentStatus,
          sessionId: order.sessionId,
          createdAt: order.createdAt,
        }));
        console.log('Formatted Orders:', formattedOrders);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalOrders / limitNum);

        return res.status(200).json({
          success: true,
          data: {
            orders: formattedOrders,
            pagination: {
              totalOrders,
              currentPage: pageNum,
              totalPages,
              limit: limitNum,
            },
          },
          message: 'Orders retrieved successfully',
        });
      }

      case 'DELETE': {
        // Handle DELETE: Delete an order by orderId
        const { orderId } = req.body || req.query;
        console.log('Order API DELETE - Order ID:', orderId);

        if (!orderId) {
          console.error('Order API DELETE - Missing orderId');
          return res.status(400).json({ success: false, message: 'Missing orderId' });
        }

        let objectId;
        try {
          objectId = new ObjectId(orderId);
        } catch (e) {
          console.error('Order API DELETE - Invalid orderId:', orderId);
          return res.status(400).json({ success: false, message: 'Invalid orderId' });
        }

        // Find the order
        let order;
        try {
          order = await db.collection('order').findOne({ _id: objectId });
          console.log('Order API DELETE - Order query result:', order ? { id: order._id } : 'No order found');
        } catch (findError) {
          console.error('Order API DELETE - Query failed:', findError.message, findError.stack);
          return res.status(500).json({ success: false, message: 'Order query error' });
        }

        if (!order) {
          console.error('Order API DELETE - Order not found:', { orderId });
          return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Delete the order
        try {
          const deleteResult = await db.collection('order').deleteOne({ _id: objectId });
          console.log('Order API DELETE - Delete result:', {
            deletedCount: deleteResult.deletedCount,
          });

          if (deleteResult.deletedCount === 0) {
            console.error('Order API DELETE - Failed to delete order:', orderId);
            return res.status(500).json({ success: false, message: 'Failed to delete order' });
          }
        } catch (deleteError) {
          console.error('Order API DELETE - Deletion failed:', deleteError.message, deleteError.stack);
          return res.status(500).json({ success: false, message: `Order deletion error: ${deleteError.message}` });
        }

        return res.status(200).json({
          success: true,
          data: { orderId },
          message: 'Order deleted successfully',
        });
      }

      default:
        console.error('Order API - Method not allowed:', method);
        res.setHeader('Allow', ['GET', 'DELETE']);
        return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Order API - Server Error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
}
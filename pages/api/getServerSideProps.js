import { connectToDatabase, ObjectId } from '../../utils/mongodb';

export async function getServerSideProps(context) {
  const { userId } = context.params;

  if (!ObjectId.isValid(userId)) {
    return {
      notFound: true,
    };
  }

  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

  if (!user) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
    },
  };
}

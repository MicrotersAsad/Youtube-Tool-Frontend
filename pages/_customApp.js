// pages/_customApp.js
import MyApp from './_app';

export async function getServerSideProps(context) {
  const protocol = context.req.headers.host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${context.req.headers.host}`;

  let headerContent = '';
  try {
    const response = await fetch(`${baseUrl}/api/heading`);
    const data = await response.json();
    headerContent = data[0]?.content || '';
  } catch (error) {
    console.error('Error fetching header content:', error);
  }

  return {
    props: { headerContent },
  };
}

export default function CustomApp(props) {
  return <MyApp {...props} />;
}

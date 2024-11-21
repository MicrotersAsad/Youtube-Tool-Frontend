import { useEffect } from "react";
import { ToastContainer } from "react-toastify";

const TawkIntegration = ({ tawkConfig }) => {
  useEffect(() => {
    if (tawkConfig && tawkConfig.appKey) {
      // Dynamically add Tawk.to script to the page
      var Tawk_API = Tawk_API || {};
      var Tawk_LoadStart = new Date();
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://embed.tawk.to/${tawkConfig.appKey}/default`;
      script.charset = "UTF-8";
      script.setAttribute("crossorigin", "*");
      document.body.appendChild(script);

      return () => {
        // Cleanup the script when the component unmounts
        document.body.removeChild(script);
      };
    }
  }, [tawkConfig]);

  return (
    <>
      <ToastContainer />
      {tawkConfig ? (
        <p>Tawk.to is enabled and running...</p>
      ) : (
        <p>Tawk.to is not configured or enabled.</p>
      )}
    </>
  );
};

export async function getServerSideProps(context) {
  try {
    // Extract protocol and host from headers
    const protocol = context.req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = context.req.headers.host;

    // Construct the base URL dynamically
    const baseURL = `${protocol}://${host}`;

    // Fetch data from the extensions API
    const response = await fetch(`${baseURL}/api/extensions`, {
      method: "GET",
      headers: {
        ...context.req.headers, // Forward the request headers
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.success) {
      const tawkExtension = result.data.find((ext) => ext.key === "tawk_to" && ext.status === "Enabled");
      if (tawkExtension && tawkExtension.config.appKey) {
        return {
          props: {
            tawkConfig: tawkExtension.config, // Pass Tawk.to config as props
          },
        };
      }
    }

    return {
      props: {
        tawkConfig: null, // Return null if Tawk.to is not configured or enabled
      },
    };
  } catch (error) {
    console.error("Error fetching Tawk.to configuration:", error);
    return {
      props: {
        tawkConfig: null, // Return null in case of an error
      },
    };
  }
}

export default TawkIntegration;

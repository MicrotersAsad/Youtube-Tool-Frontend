// pages/profile.js
import UserProfile from "../../components/UserProfile";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "../dashboard/layout";
import UpdateProfileForm from "./edit-profile";


const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <UserProfile/>
      </div>
    </Layout>
  );
};

export default ProfilePage;

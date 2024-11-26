// components/BanModal.js
import { useUserActions } from "../contexts/UserActionContext";

const BanModal = () => {
  const { showBanModal, banReason, setBanReason, banUser, closeAllModals } = useUserActions();

  if (!showBanModal) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Ban User</h2>
        <textarea
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-4"
          placeholder="Reason for ban"
          rows="4"
        />
        <div className="flex justify-end space-x-4">
          <button className="bg-gray-500 text-white px-4 py-2 rounded-md" onClick={closeAllModals}>
            Cancel
          </button>
          <button className="bg-red-500 text-white px-4 py-2 rounded-md" onClick={banUser}>
            Ban User
          </button>
        </div>
      </div>
    </div>
  );
};

export default BanModal;

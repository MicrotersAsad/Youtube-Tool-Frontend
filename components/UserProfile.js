import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-toastify';
import Modal from 'react-modal';

// Ensure Modal is accessible
Modal.setAppElement('#__next');

const UserProfile = () => {
  const { user, updateUserProfile, login } = useAuth();
  const router = useRouter();
  const [isUpdated, setIsUpdated] = useState(false);
  const [remainingDays, setRemainingDays] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log('User Profile:', user);

  // Valid payment statuses for active subscriptions
  const VALID_PAYMENT_STATUSES = ['COMPLETED', 'paid', 'completed']; // Added 'completed' to handle lowercase

  // Check if user is on free plan
  const isFreePlan = user && (
    user.plan === 'free' || 
    !VALID_PAYMENT_STATUSES.includes(user.paymentDetails?.paymentStatus)
  );

  console.log('isFreePlan:', isFreePlan, 'Payment Status:', user?.paymentDetails?.paymentStatus); // Debug

  useEffect(() => {
    // Update user profile if payment status is not valid and not yet updated
    if (user && !VALID_PAYMENT_STATUSES.includes(user.paymentDetails?.paymentStatus) && !isUpdated) {
      updateUserProfile()
        .then(() => setIsUpdated(true))
        .catch((error) => {
          console.error('Failed to update user profile:', error);
          toast.error('Failed to update profile. Please try again.');
        });
    }

    // Calculate remaining subscription days for valid payments
    if (user && VALID_PAYMENT_STATUSES.includes(user.paymentDetails?.paymentStatus)) {
      const updateRemainingDays = () => {
        if (!user.paymentDetails?.createdAt) {
          setRemainingDays(0);
          return;
        }
        const currentDate = new Date();
        const createdAt = new Date(user.paymentDetails.createdAt);
        if (isNaN(createdAt.getTime())) {
          setRemainingDays(0);
          return;
        }
        const validityDays =
          user.plan === 'yearly_premium' ? 365 : user.plan === 'monthly_premium' ? 30 : 0;
        if (validityDays === 0) {
          setRemainingDays(0);
          return;
        }
        const validUntil = new Date(createdAt.setDate(createdAt.getDate() + validityDays));
        const diffTime = validUntil - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setRemainingDays(diffDays > 0 ? diffDays : 0);
        console.log('Remaining Days Calculated:', diffDays); // Debug
      };

      updateRemainingDays();
      const intervalId = setInterval(updateRemainingDays, 86400000); // Update every 24 hours
      return () => clearInterval(intervalId); // Cleanup interval on unmount
    }
  }, [user, updateUserProfile, isUpdated]);

  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Ytubetools Invoice', 105, 20, { align: 'center' });

    // User Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Email: ${user.email}`, 20, 40);
    doc.text(`Plan: ${isFreePlan ? 'Free Plan' : (user.plan === 'yearly_premium' ? 'Yearly Premium' : 'Monthly Premium')}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);

    if (!isFreePlan) {
      // Subscription Details Table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Subscription Details', 20, 80);

      // Determine Transaction ID based on provider
      const transactionId =
        user.paymentDetails?.provider === 'stripe'
          ? user.paymentDetails?.sessionId
          : user.paymentDetails?.sessionId || 'N/A'; // Use sessionId for PayPal

      doc.autoTable({
        startY: 90,
        headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
        head: [['Field', 'Details']],
        body: [
          ['Plan', user.plan === 'yearly_premium' ? 'Yearly Premium' : 'Monthly Premium'],
          [
            'Valid Until',
            user.paymentDetails.createdAt
              ? (() => {
                  const validUntil = new Date(user.paymentDetails.createdAt);
                  const validityDays = user.plan === 'yearly_premium' ? 365 : 30;
                  validUntil.setDate(validUntil.getDate() + validityDays);
                  return validUntil.toLocaleDateString();
                })()
              : 'N/A',
          ],
          ['Remaining Days', remainingDays !== null ? `${remainingDays} Days` : 'N/A'],
          ['Amount Paid', `$${user.paymentDetails?.amount?.toFixed(2) || 'N/A'}`],
          ['Currency', user.paymentDetails?.currency?.toUpperCase() || 'N/A'],
          ['Payment Method', user.paymentDetails?.provider?.toUpperCase() || 'N/A'],
          ['Transaction ID', transactionId],
        ],
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold' } },
      });

      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Thank you for using Ytubetools!', 105, doc.lastAutoTable.finalY + 20, {
        align: 'center',
      });
    } else {
      doc.setFontSize(12);
      doc.text('Free Plan - No active subscription.', 20, 80);
      
      // Free Plan Details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Free Plan Details', 20, 100);
      
      doc.autoTable({
        startY: 110,
        headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
        head: [['Feature', 'Availability']],
        body: [
          ['Access Level', 'Limited'],
          ['Premium Features', 'Not Available'],
          ['Upgrade Options', 'Monthly or Yearly Premium Plans Available'],
        ],
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold' } },
      });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Upgrade to Premium for full access!', 105, doc.lastAutoTable.finalY + 20, {
        align: 'center',
      });
    }

    doc.save(`ytubetools_invoice_${user.email}.pdf`);
  };

  const handleCancelSubscription = async () => {
    setIsModalOpen(false);
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
  
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({ userId: user._id }),
      });
      console.log('Cancel Subscription Response:', response);
  
      const result = await response.json();
      if (response.ok) {
        toast.success('Subscription canceled successfully. You have been downgraded to the free plan.');
        
        // Check if we got a new token directly from the cancel API
        if (result.token) {
          console.log('Received new token with updated user data');
          login(result.token);
          
          // Force an update to the AuthContext
          updateUserProfile()
            .then(() => {
              console.log('User profile updated successfully');
              setTimeout(() => router.push('/pricing'), 1500);
            })
            .catch(error => {
              console.error('Failed to update profile after cancellation:', error);
              setTimeout(() => router.push('/pricing'), 1500);
            });
        } else {
          // Fallback: Try to fetch updated user data
          try {
            const userResponse = await fetch('/api/user', {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (!userResponse.ok) {
              throw new Error('Failed to fetch updated user data');
            }
            
            const updatedUser = await userResponse.json();
            if (updatedUser.token) {
              login(updatedUser.token);
            } else {
              console.log('No token in user response, forcing reload');
              setTimeout(() => window.location.reload(), 3000);
            }
          } catch (userError) {
            console.error('Error fetching updated user data:', userError);
            setTimeout(() => window.location.reload(), 3000);
          }
        }
      } else {
        throw new Error(result.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error.message);
      toast.error(`Failed to cancel subscription: ${error.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-red-500 text-lg">Please log in to view your profile.</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          {isFreePlan ? 'Account Status' : 'Payment Invoice'}
        </h1>
        <div className="border-b pb-4 mb-6">
          <p className="text-lg text-gray-700">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="text-lg text-gray-700">
            <strong>Plan Type:</strong>{' '}
            <span
              className={`font-semibold ${isFreePlan ? 'text-gray-500' : 'text-green-500'}`}
            >
              {isFreePlan ? 'Free Plan' : (user.plan === 'yearly_premium' ? 'Yearly Premium' : 'Monthly Premium')}
            </span>
          </p>
          {!isFreePlan && (
            <p className="text-lg text-gray-700">
              <strong>Payment Status:</strong>{' '}
              <span className="font-semibold text-green-500">Active</span>
            </p>
          )}
        </div>
        
        {isFreePlan ? (
          <div className="mt-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Free Plan Access</h2>
              
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-2">You are currently on the free plan with limited access.</p>
                <p className="text-gray-600">Upgrade to Premium to unlock all features!</p>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Free Plan Limitations:</h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>Limited number of searches per day</li>
                  <li>Basic analytics only</li>
                  <li>No access to premium features</li>
                  <li>Standard support only</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={generatePDF}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Download Plan Details"
              >
                Download Plan Details
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Upgrade Now"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Subscription Details</h2>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {user.plan === 'yearly_premium' ? 'Yearly Premium' : 'Monthly Premium'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Validity Period</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {user.plan === 'yearly_premium' ? '365 Days' : '30 Days'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Remaining Days</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {remainingDays !== null ? `${remainingDays} Days` : 'Calculating...'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Valid Until</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {user.paymentDetails.createdAt
                      ? (() => {
                          const validUntil = new Date(user.paymentDetails.createdAt);
                          const validityDays = user.plan === 'yearly_premium' ? 365 : 30;
                          validUntil.setDate(validUntil.getDate() + validityDays);
                          return validUntil.toLocaleDateString();
                        })()
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    ${user.paymentDetails?.amount?.toFixed(2) || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Currency</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {user.paymentDetails?.currency?.toUpperCase() || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {user.paymentDetails?.provider?.toUpperCase() || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 break-words">
                    {user.paymentDetails?.provider === 'stripe'
                      ? user.paymentDetails?.sessionId
                      : user.paymentDetails?.sessionId || 'N/A'}
                  </dd>
                </div>
              </dl>
              <p className="text-green-600 mt-4 text-lg font-medium">Full access granted</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={generatePDF}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Download Invoice"
              >
                Download Invoice
              </button>
              {user.plan !== 'free' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={isCancelling}
                  aria-label="Cancel Subscription"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="flex items-center justify-center min-h-screen p-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        aria={{
          labelledby: 'modal-title',
          describedby: 'modal-description',
        }}
      >
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-800 mb-4">
            Confirm Cancellation
          </h2>
          <p id="modal-description" className="text-gray-600 mb-6">
            Are you sure you want to cancel your subscription? You will lose access to premium features at the end of the
            current billing period.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleCancelSubscription}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
              disabled={isCancelling}
            >
              {isCancelling ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserProfile;
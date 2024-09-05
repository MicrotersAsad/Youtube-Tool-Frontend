import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from './layout';

const ReportsDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/get-reports');
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await response.json();
        setReports(data.reports);
      } catch (error) {
        toast.error('Error fetching reports: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleFixReport = async (reportedBy) => {
    try {
      const response = await fetch(`/api/get-reports/${reportedBy}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fixed: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark report as fixed');
      }

      // Update the local state to mark the report as fixed
      setReports(reports.map(report => 
        report.reportedBy === reportedBy ? { ...report, fixed: true } : report
      ));
      toast.success('Report marked as fixed');
    } catch (error) {
      toast.error('Error fixing report: ' + error.message);
    }
  };

  if (loading) return <p>Loading reports...</p>;

  return (
    <Layout>
    <div className="container mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Reports Dashboard</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr className="text-center">
            <th className="py-2">Tool Name</th>
            <th className="py-2">Report Text</th>
            <th className="py-2">Fixed</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.reportedBy} className="text-center">
              <td className="py-2">{report.toolName}</td>
              <td className="py-2">{report.reportText}</td>
              <td className="py-2">{report.fixed ? 'Yes' : 'No'}</td>
              <td className="py-2">
                {report.fixed ? (
                  'Already Fixed'
                ) : (
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => handleFixReport(report.reportedBy)} // Use reportedBy here
                  >
                    Fix
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </Layout>
  );
};

export default ReportsDashboard;

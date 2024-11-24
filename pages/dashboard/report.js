import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from './layout';
import { FaSearch } from 'react-icons/fa';

const ReportsDashboard = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  // Handle search term changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/get-reports');
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await response.json();
        setReports(data.reports);
        setFilteredReports(data.reports); // Initialize filtered reports
      } catch (error) {
        toast.error('Error fetching reports: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    // Filter reports by tool name based on the search term
    if (searchTerm.trim() === '') {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter((report) =>
        report.toolName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [searchTerm, reports]);

  const handleFixReport = async (reportId) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
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
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.reportId === reportId ? { ...report, fixed: true } : report
        )
      );
      toast.success('Report marked as fixed');
    } catch (error) {
      toast.error('Error fixing report: ' + error.message);
    }
  };

  // Pagination logic
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Skeleton Loader Component
  const SkeletonRow = () => (
    <tr className="text-center border-b animate-pulse">
      <td className="py-2">
        <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
      </td>
      <td className="py-2">
        <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
      </td>
      <td className="py-2">
        <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div>
      </td>
      <td className="py-2">
        <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div>
      </td>
    </tr>
  );

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-4 pt-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 md:p-6">
            Reports Dashboard
          </h2>
          <div className="flex border border-gray-300 rounded-md overflow-hidden w-72 md:me-5">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by tool name..."
              className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
            />
            <button className="bg-[#071251] p-3 flex items-center justify-center">
              <FaSearch className="text-white" />
            </button>
          </div>
        </div>

        {loading ? (
          <table className="min-w-full bg-white">
            <thead>
              <tr className="text-center bg-[#071251] text-white">
                <th className="py-2">Tool Name</th>
                <th className="py-2">Report Text</th>
                <th className="py-2">Fixed</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </tbody>
          </table>
        ) : (
          <div>
            <table className="min-w-full bg-white">
              <thead>
                <tr className="text-center bg-[#071251] text-white">
                  <th className="py-2">Tool Name</th>
                  <th className="py-2">Report Text</th>
                  <th className="py-2">Fixed</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentReports.map((report) => (
                  <tr key={report.reportId} className="text-center border-b">
                    <td className="py-2">{report.toolName}
                      
                    </td>
                    <td className="py-2">{report.reportText}</td>
                    <td className="py-2">{report.fixed ? 'Yes' : 'No'}</td>
                    <td className="py-2">
                      {report.fixed ? (
                        'Already Fixed'
                      ) : (
                        <button
                          className="bg-blue-500 text-white px-4 py-2 rounded"
                          onClick={() => handleFixReport(report.reportId)}
                        >
                          Fix
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination controls */}
            <div className="flex justify-center items-center mt-4 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(index + 1)}
                  className={`px-4 py-2 rounded ${
                    currentPage === index + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReportsDashboard;

// /pages/admin/tickets.js
import React, { useEffect, useState } from 'react';
import TicketList from '../../components/TicketList';
import Layout from './layout';

/**
 * Admin page to view all support tickets.
 */
const AdminTicketsPage = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets/create');
     
      
      const result = await response.json();
      if (result.success) {
        setTickets(result.tickets);
      } else {
        alert('Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  return (
    <Layout>


    <div className="container mx-auto">
      <TicketList tickets={tickets} />
    </div>
    </Layout>
  );
};

export default AdminTicketsPage;

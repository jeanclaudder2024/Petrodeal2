import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingFallback from '@/components/LoadingFallback';

const MyTickets = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to support center where ticket functionality is now integrated
    navigate('/support-center');
  }, [navigate]);

  return <LoadingFallback />;
};

export default MyTickets;
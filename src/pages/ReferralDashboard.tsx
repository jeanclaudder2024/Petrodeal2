import React from 'react';
import { Helmet } from 'react-helmet-async';
import ReferralDashboard from '@/components/referral/ReferralDashboard';

const ReferralDashboardPage = () => {
  return (
    <>
      <Helmet>
        <title>Referral Program | PetroDeallHub</title>
        <meta name="description" content="Manage your referral program, track earnings, and request payouts." />
      </Helmet>
      <ReferralDashboard />
    </>
  );
};

export default ReferralDashboardPage;

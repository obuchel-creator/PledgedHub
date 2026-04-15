import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCampaignDetails } from '../services/api';
import CampaignDetailScreen from './CampaignDetailScreen';

export default function CampaignDetailScreenWrapper() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      try {
        const result = await getCampaignDetails(id);
        if (result.success && result.data) {
          setCampaign(result.data);
        } else {
          setError(result.error || 'Failed to load campaign');
        }
      } catch (err) {
        setError('Error loading campaign');
      }
      setLoading(false);
    }
    fetchCampaign();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center p-8 text-center">Loading campaign...</div>;
  if (error) return <div className="flex justify-center items-center p-8 text-center text-error">{error}</div>;
  if (!campaign) return <div className="flex justify-center items-center p-8 text-center text-error">Campaign not found</div>;

  return <CampaignDetailScreen campaign={campaign} loadCampaignDetails={() => {}} />;
}
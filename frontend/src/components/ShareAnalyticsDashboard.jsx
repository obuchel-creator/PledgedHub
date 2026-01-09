import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ShareAnalyticsDashboard() {
  const { token, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!authLoading && token) {
      loadShareStats();
    }
  }, [authLoading, token]);

  const loadShareStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/share-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError('Failed to load share stats');
      }
    } catch (err) {
      setError('Failed to load share stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{padding:'2rem',textAlign:'center'}}>Loading share analytics...</div>;
  if (error) return <div style={{color:'#ef4444',padding:'1rem'}}>{error}</div>;

  return (
    <div style={{background:'#fff',borderRadius:'12px',padding:'2rem',boxShadow:'0 2px 12px #0001',marginTop:'2rem'}}>
      <h2 style={{marginBottom:'1.5rem'}}>Share Events Analytics</h2>
      <div style={{display:'flex',gap:'2rem',flexWrap:'wrap'}}>
        {stats && Object.entries(stats.byChannel).map(([channel, count]) => (
          <div key={channel} style={{minWidth:'120px',padding:'1rem',background:'#f3f4f6',borderRadius:'8px',textAlign:'center'}}>
            <div style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>{getChannelIcon(channel)}</div>
            <div style={{fontWeight:'bold',fontSize:'1.1rem'}}>{channel.charAt(0).toUpperCase()+channel.slice(1)}</div>
            <div style={{fontSize:'1.3rem',color:'#2563eb'}}>{count}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:'2rem',fontWeight:'bold'}}>Total Shares: <span style={{color:'#10b981'}}>{stats?.totalShares || 0}</span></div>
    </div>
  );
}

function getChannelIcon(channel) {
  switch(channel) {
    case 'whatsapp': return '💬';
    case 'sms': return '📲';
    case 'facebook': return '📘';
    case 'twitter': return '🐦';
    case 'linkedin': return '💼';
    case 'telegram': return '✈️';
    case 'reddit': return '👽';
    case 'email': return '✉️';
    case 'copy': return '🔗';
    case 'native': return '📱';
    default: return '🔗';
  }
}

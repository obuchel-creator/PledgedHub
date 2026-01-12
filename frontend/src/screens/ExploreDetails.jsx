import React, { useEffect, useState } from 'react';
import PledgeStatusPie from '../components/PledgeStatusPie';
import ExportTableCSV from '../components/ExportTableCSV';
import ExportTablePDF from '../components/ExportTablePDF';
import NotificationToast from '../components/NotificationToast';
import useRealtimeEvents from '../hooks/useRealtimeEvents';
import { useTablePreferences } from '../context/TablePreferencesContext';
// ...other imports...

// ...existing imports...
import { getTopDonors, getAtRiskPledges, getCampaigns, getPayments, getUpcomingReminders, getAIInsights, getPledgesByStatus, getCollectionTrends } from '../services/api';
import CollectionTrendsBar from '../components/CollectionTrendsBar';
import { CustomLineChart, CustomAreaChart, CustomRadarChart } from '../components/CustomCharts';
import CustomWidget from '../components/CustomWidget';
import { Link } from 'react-router-dom';
import DrilldownModal from '../components/DrilldownModal';
import { FaUserFriends, FaBell, FaMoneyBillWave, FaChartPie, FaChartLine } from 'react-icons/fa';

import './ExploreDetails.css';

export default function ExploreDetails() {
  // Modal state and handlers
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  function handleDrilldown(title, rows) {
    setModalContent({ title, rows });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setModalContent(null); }

  // Bulk selection state
  const [selectedRows, setSelectedRows] = useState([]);
  function toggleRow(table, id) {
    setSelectedRows(prev => {
      const key = `${table}:${id}`;
      return prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
    });
  }
  function clearSelection() { setSelectedRows([]); }
  function isSelected(table, id) { return selectedRows.includes(`${table}:${id}`); }

  // Real-time events
  const realtimeEvents = useRealtimeEvents();

  // Advanced filtering and search state
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', campaign: '', donor: '', dateFrom: '', dateTo: '' });
  const [tablePrefs, setTablePrefs] = useTablePreferences('exploreDetails');

  // Filter and search helpers
  function filterRows(rows, keys) {
    let filtered = rows;
    if (search) {
      filtered = filtered.filter(row => keys.some(k => String(row[k]||'').toLowerCase().includes(search.toLowerCase())));
    }
    if (filters.status) filtered = filtered.filter(r => r.status === filters.status);
    if (filters.campaign) filtered = filtered.filter(r => r.campaign === filters.campaign);
    if (filters.donor) filtered = filtered.filter(r => r.donor_name === filters.donor);
    // Date filters for payments/reminders
    if (filters.dateFrom) filtered = filtered.filter(r => new Date(r.date||r.due_date||r.collection_date) >= new Date(filters.dateFrom));
    if (filters.dateTo) filtered = filtered.filter(r => new Date(r.date||r.due_date||r.collection_date) <= new Date(filters.dateTo));
    return filtered;
  }

  // Notification state
  const [notif, setNotif] = useState({ message: '', type: 'info' });
  // Drilldown modal state
  const [drilldown, setDrilldown] = useState({ open: false, title: '', rows: [], columns: [] });

  // Data state
  const [topDonors, setTopDonors] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [aiInsights, setAIInsights] = useState([]);
  const [pledgeStatus, setPledgeStatus] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError('');
      try {
        const [donorsRes, atRiskRes, campaignsRes, paymentsRes, remindersRes, aiInsightsRes, pledgeStatusRes, trendsRes] = await Promise.all([
          getTopDonors(5),
          getAtRiskPledges(),
          getCampaigns('active'),
          getPayments({ limit: 5 }),
          getUpcomingReminders(),
          getAIInsights(),
          getPledgesByStatus(),
          getCollectionTrends('30d'),
        ]);
        setTopDonors(Array.isArray(donorsRes) ? donorsRes : []);
        setAtRisk(Array.isArray(atRiskRes) ? atRiskRes : []);
        setCampaigns(Array.isArray(campaignsRes?.data?.campaigns) ? campaignsRes.data.campaigns : []);
        setPayments(Array.isArray(paymentsRes?.data?.payments) ? paymentsRes.data.payments : []);
        setReminders(Array.isArray(remindersRes?.data?.reminders) ? remindersRes.data.reminders : []);
        setAIInsights(Array.isArray(aiInsightsRes?.data?.insights) ? aiInsightsRes.data.insights : []);
        setPledgeStatus(Array.isArray(pledgeStatusRes?.data?.status) ? pledgeStatusRes.data.status : []);
        setTrends(Array.isArray(trendsRes?.data?.trends) ? trendsRes.data.trends : []);
      } catch (err) {
        setError(err?.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, []);
      {/* Collection Trends Bar Chart */}
      {trends.length > 0 && (
        <section>
          <h3>Collection Trends (Last 30 Days)</h3>
          <CollectionTrendsBar data={trends.map(t=>(
            { date: t.date, collected: Number(t.collected), pledged: Number(t.pledged) }
          ))} />
        </section>
      )}

  if (loading) return <div style={{textAlign:'center',padding:'2rem'}}>Loading details...</div>;
  if (error) return <div style={{color:'#ef4444',textAlign:'center',padding:'2rem'}}>{error}</div>;

  // Campaign progress bar helper
  const campaignProgress = (c) => {
    const raised = Number(c.raisedAmount || 0);
    const goal = Number(c.goalAmount || 1);
    const percent = Math.min(100, Math.round((raised / goal) * 100));
    return (
      <div style={{width:'100%',background:'#e5e7eb',borderRadius:'8px',height:'8px',marginTop:'0.25rem'}}>
        <div style={{width:`${percent}%`,background:'#fbbf24',height:'8px',borderRadius:'8px'}}></div>
      </div>
    );
  };

  // Pie chart for pledge status (simple bar for now)
  const statusBar = () => {
    if (!pledgeStatus.length) return null;
    const total = pledgeStatus.reduce((sum,s)=>sum+Number(s.count||0),0);
    return (
      <div style={{display:'flex',gap:'1rem',margin:'1rem 0'}}>
        {pledgeStatus.map((s,i)=>(
          <div key={i} style={{flex:1}}>
            <div style={{height:'12px',background:s.status==='paid'?'#4ade80':s.status==='overdue'?'#ef4444':'#fbbf24',borderRadius:'6px',width:`${(Number(s.count)/total)*100}%`,marginBottom:'0.25rem'}}></div>
            <div style={{fontSize:'0.95rem',color:'#334155'}}>{s.status}: {s.count}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="explore-details" style={{display:'grid',gap:'2rem',marginTop:'2rem'}}>
      {/* Global Search & Filters + Realtime Badge */}
      <div style={{display:'flex',flexWrap:'wrap',gap:'1rem',alignItems:'center',marginBottom:'1.5rem'}}>
        <div style={{position:'relative',marginRight:12}}>
          <span style={{fontWeight:700}}>Live Updates</span>
          {realtimeEvents.length > 0 && (
            <span style={{position:'absolute',top:-8,right:-18,background:'#ef4444',color:'#fff',borderRadius:'50%',padding:'2px 8px',fontSize:12,fontWeight:700}} aria-label={`${realtimeEvents.length} new events`}>{realtimeEvents.length}</span>
          )}
        </div>
        <input
          type="search"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="Search pledges, donors, campaigns, payments..."
          style={{flex:'2 1 220px',padding:'0.5rem 1rem',borderRadius:8,border:'1px solid #e5e7eb',fontSize:'1rem'}}
          aria-label="Global search"
        />
        <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} style={{padding:'0.5rem',borderRadius:8}} aria-label="Filter by status">
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
        </select>
        <input type="date" value={filters.dateFrom} onChange={e=>setFilters(f=>({...f,dateFrom:e.target.value}))} aria-label="Date from" style={{padding:'0.5rem',borderRadius:8}} />
        <input type="date" value={filters.dateTo} onChange={e=>setFilters(f=>({...f,dateTo:e.target.value}))} aria-label="Date to" style={{padding:'0.5rem',borderRadius:8}} />
        <button onClick={()=>setFilters({status:'',campaign:'',donor:'',dateFrom:'',dateTo:''})} style={{padding:'0.5rem 1rem',borderRadius:8,background:'#fbbf24',color:'#0f172a',fontWeight:700}}>Clear Filters</button>
      </div>
      {/* Custom Widgets Row */}
      <div style={{display:'flex',gap:'2rem',flexWrap:'wrap',marginBottom:'2rem'}}>
        <CustomWidget title="Top Donors" value={topDonors.length} icon={<FaUserFriends />} color="#2563eb" />
        <CustomWidget title="At-Risk Pledges" value={atRisk.length} icon={<FaBell />} color="#ef4444" />
        <CustomWidget title="Active Campaigns" value={campaigns.length} icon={<FaChartPie />} color="#fbbf24" />
        <CustomWidget title="Recent Payments" value={payments.length} icon={<FaMoneyBillWave />} color="#10b981" />
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <section>
          <h3>AI Insights</h3>
          <ul style={{margin:'0.5rem 0 0 1rem',color:'#0f172a'}}>
            {aiInsights.map((ins,i)=>(<li key={i}>{ins}</li>))}
          </ul>
        </section>
      )}
      {/* Pledge Status Breakdown + More Chart Types */}
      {pledgeStatus.length > 0 && (
        <section>
          <h3>Pledge Status Breakdown</h3>
          <div style={{display:'flex',alignItems:'center',gap:'2rem',flexWrap:'wrap'}}>
            <div style={{flex:'1 1 320px',minWidth:280,maxWidth:400}}>
              <PledgeStatusPie data={pledgeStatus.map(s=>({status:s.status,count:Number(s.count)}))} />
              <CustomRadarChart data={pledgeStatus.map(s=>({status:s.status,value:Number(s.count)}))} categories="status" valueKey="value" color="#6366f1" />
            </div>
            <div style={{flex:'2 1 320px',minWidth:220}}>
              {statusBar()}
              <CustomLineChart data={pledgeStatus.map((s,i)=>({x:s.status,y:Number(s.count)}))} xKey="x" yKey="y" color="#2563eb" />
            </div>
          </div>
        </section>
      )}
      {/* Top Donors Table */}
      <section>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
          <h3>Top Donors</h3>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <ExportTableCSV data={filterRows(topDonors,["donor_name","pledge_count","total_amount"])} filename="top-donors.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(topDonors,["donor_name","pledge_count","total_amount"])} columns={["donor_name","pledge_count","total_amount"]} fileName="top-donors.pdf" title="Top Donors" />
          </div>
        </div>
        {/* Bulk action bar */}
        {selectedRows.filter(k=>k.startsWith('donors:')).length > 0 && (
          <div className="bulk-action-bar" style={{background:'#fbbf24',color:'#0f172a',padding:'0.5rem 1rem',borderRadius:8,marginBottom:8,display:'flex',alignItems:'center',gap:16}} role="region" aria-label="Bulk actions for donors">
            <span aria-live="polite">{selectedRows.filter(k=>k.startsWith('donors:')).length} selected</span>
            <button onClick={()=>setNotif({message:'Bulk export coming soon',type:'info'})} aria-label="Bulk export selected donors">Bulk Export</button>
            <button onClick={clearSelection} aria-label="Clear selection">Clear</button>
          </div>
        )}
        <table className="explore-table" aria-label="Top Donors" tabIndex={0}>
          <caption className="visually-hidden">Top Donors Table</caption>
          <thead>
            <tr>
              <th scope="col"><input type="checkbox" aria-label="Select all donors" checked={filterRows(topDonors,["donor_name","pledge_count","total_amount"]).every(d=>isSelected('donors',d.donor_name))} onChange={e=>filterRows(topDonors,["donor_name","pledge_count","total_amount"]).forEach(d=>toggleRow('donors',d.donor_name))} tabIndex={0} /></th>
              <th scope="col">Name</th><th scope="col">Pledges</th><th scope="col">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <List
              height={320}
              itemCount={filterRows(topDonors,["donor_name","pledge_count","total_amount"]).length}
              itemSize={48}
              width={"100%"}
            >
              {({ index, style }) => {
                const d = filterRows(topDonors,["donor_name","pledge_count","total_amount"])[index];
                return (
                  <tr key={index} style={{...style,cursor:'pointer'}} tabIndex={0} aria-label={`View details for donor ${d.donor_name || 'Anonymous'}`} onClick={()=>handleDrilldown('Donor Details', [d])} onKeyDown={e=>{if(e.key==='Enter'){handleDrilldown('Donor Details', [d]);}}}>
                    <td><input type="checkbox" checked={isSelected('donors',d.donor_name)} onChange={()=>toggleRow('donors',d.donor_name)} aria-label={`Select donor ${d.donor_name||'Anonymous'}`} tabIndex={0} /></td>
                    <td>{d.donor_name || 'Anonymous'}</td>
                    <td>{d.pledge_count}</td>
                    <td>UGX {Number(d.total_amount).toLocaleString()}</td>
                  </tr>
                );
              }}
            </List>
          </tbody>
        </table>
      </section>
      {/* At-Risk Pledges Table */}
      <section>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
          <h3>At-Risk Pledges</h3>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <ExportTableCSV data={filterRows(atRisk,["donor_name","amount","collection_date","days_overdue"])} filename="at-risk-pledges.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(atRisk,["donor_name","amount","collection_date","days_overdue"])} columns={["donor_name","amount","collection_date","days_overdue"]} fileName="at-risk-pledges.pdf" title="At-Risk Pledges" />
          </div>
        </div>
        {/* Bulk action bar */}
        {selectedRows.filter(k=>k.startsWith('atRisk:')).length > 0 && (
          <div className="bulk-action-bar" style={{background:'#fbbf24',color:'#0f172a',padding:'0.5rem 1rem',borderRadius:8,marginBottom:8,display:'flex',alignItems:'center',gap:16}} role="region" aria-label="Bulk actions for at-risk pledges">
            <span aria-live="polite">{selectedRows.filter(k=>k.startsWith('atRisk:')).length} selected</span>
            <button onClick={()=>setNotif({message:'Bulk reminder coming soon',type:'info'})} aria-label="Bulk reminder selected pledges">Bulk Reminder</button>
            <button onClick={clearSelection} aria-label="Clear selection">Clear</button>
          </div>
        )}
        <table className="explore-table" aria-label="At-Risk Pledges" tabIndex={0}>
          <caption className="visually-hidden">At-Risk Pledges Table</caption>
          <thead>
            <tr>
              <th scope="col"><input type="checkbox" aria-label="Select all at-risk pledges" checked={filterRows(atRisk,["donor_name","amount","collection_date","days_overdue"]).every(p=>isSelected('atRisk',p.collection_date))} onChange={e=>filterRows(atRisk,["donor_name","amount","collection_date","days_overdue"]).forEach(p=>toggleRow('atRisk',p.collection_date))} tabIndex={0} /></th>
              <th scope="col">Donor</th><th scope="col">Amount</th><th scope="col">Due Date</th><th scope="col">Days Overdue</th>
            </tr>
          </thead>
          <tbody>
            {filterRows(atRisk,["donor_name","amount","collection_date","days_overdue"]).map((p,i) => (
              <tr key={i} style={{cursor:'pointer'}} tabIndex={0} aria-label={`View details for at-risk pledge by ${p.donor_name || 'Anonymous'}`} onClick={()=>handleDrilldown('Pledge Details', [p])} onKeyDown={e=>{if(e.key==='Enter'){handleDrilldown('Pledge Details', [p]);}}}>
                <td><input type="checkbox" checked={isSelected('atRisk',p.collection_date)} onChange={()=>toggleRow('atRisk',p.collection_date)} aria-label={`Select pledge due ${p.collection_date}`} tabIndex={0} /></td>
                <td>{p.donor_name || 'Anonymous'}</td>
                <td>UGX {Number(p.amount).toLocaleString()}</td>
                <td>{new Date(p.collection_date).toLocaleDateString()}</td>
                <td>{p.days_overdue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Active Campaigns Table */}
      <section>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
          <h3>Active Campaigns</h3>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <ExportTableCSV data={filterRows(campaigns,["title","goalAmount","raisedAmount"])} filename="active-campaigns.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(campaigns,["title","goalAmount","raisedAmount"])} columns={["title","goalAmount","raisedAmount"]} fileName="active-campaigns.pdf" title="Active Campaigns" />
          </div>
        </div>
        <table className="explore-table" aria-label="Active Campaigns" tabIndex={0}>
          <caption className="visually-hidden">Active Campaigns Table</caption>
          <thead>
            <tr><th scope="col">Title</th><th scope="col">Goal</th><th scope="col">Raised</th><th scope="col">Progress</th><th scope="col">Link</th></tr>
          </thead>
          <tbody>
            {filterRows(campaigns,["title","goalAmount","raisedAmount"]).map((c,i) => (
              <tr key={i} style={{cursor:'pointer'}} tabIndex={0} aria-label={`View details for campaign ${c.title}`} onClick={()=>handleDrilldown('Campaign Details', [c])} onKeyDown={e=>{if(e.key==='Enter'){handleDrilldown('Campaign Details', [c]);}}}>
                <td>{c.title}</td>
                <td>UGX {Number(c.goalAmount).toLocaleString()}</td>
                <td>UGX {Number(c.raisedAmount || 0).toLocaleString()}</td>
                <td>{campaignProgress(c)}</td>
                <td><Link to={`/campaigns/${c.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Recent Payments Table */}
      <section>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
          <h3>Recent Payments</h3>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <ExportTableCSV data={filterRows(payments,["donor_name","amount","method","date"])} filename="recent-payments.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(payments,["donor_name","amount","method","date"])} columns={["donor_name","amount","method","date"]} fileName="recent-payments.pdf" title="Recent Payments" />
          </div>
        </div>
        <table className="explore-table" aria-label="Recent Payments" tabIndex={0}>
          <caption className="visually-hidden">Recent Payments Table</caption>
          <thead>
            <tr><th scope="col">Donor</th><th scope="col">Amount</th><th scope="col">Method</th><th scope="col">Date</th></tr>
          </thead>
          <tbody>
            {filterRows(payments,["donor_name","amount","method","date"]).map((p,i) => (
              <tr key={i} style={{cursor:'pointer'}} tabIndex={0} aria-label={`View details for payment by ${p.donor_name || 'Anonymous'}`} onClick={()=>handleDrilldown('Payment Details', [p])} onKeyDown={e=>{if(e.key==='Enter'){handleDrilldown('Payment Details', [p]);}}}>
                <td>{p.donor_name || 'Anonymous'}</td>
                <td>UGX {Number(p.amount).toLocaleString()}</td>
                <td>{p.method}</td>
                <td>{new Date(p.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Upcoming Reminders Table */}
      <section>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>
          <h3>Upcoming Reminders</h3>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <ExportTableCSV data={filterRows(reminders,["donor_name","amount","due_date","status"])} filename="upcoming-reminders.csv" label="Export CSV" />
            <ExportTablePDF data={filterRows(reminders,["donor_name","amount","due_date","status"])} columns={["donor_name","amount","due_date","status"]} fileName="upcoming-reminders.pdf" title="Upcoming Reminders" />
          </div>
        </div>
        <table className="explore-table" aria-label="Upcoming Reminders" tabIndex={0}>
          <caption className="visually-hidden">Upcoming Reminders Table</caption>
          <thead>
            <tr><th scope="col">Donor</th><th scope="col">Amount</th><th scope="col">Due Date</th><th scope="col">Status</th></tr>
          </thead>
          <tbody>
            {filterRows(reminders,["donor_name","amount","due_date","status"]).map((r,i) => (
              <tr key={i} style={{cursor:'pointer'}} tabIndex={0} aria-label={`View details for reminder for ${r.donor_name || 'Anonymous'}`} onClick={()=>handleDrilldown('Reminder Details', [r])} onKeyDown={e=>{if(e.key==='Enter'){handleDrilldown('Reminder Details', [r]);}}}>
                <td>{r.donor_name || 'Anonymous'}</td>
                <td>UGX {Number(r.amount).toLocaleString()}</td>
                <td>{new Date(r.due_date).toLocaleDateString()}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
          {/* Example Area Chart Widget (custom data) */}
          <div style={{margin:'2rem 0'}}>
            <h3>30-Day Collection Area Chart</h3>
            <CustomAreaChart data={trends.map(t=>(
              { date: t.date, collected: Number(t.collected) }
            ))} xKey="date" yKey="collected" color="#10b981" />
          </div>

          {/* Drilldown Modal */}
          <DrilldownModal open={drilldown.open} onClose={()=>setDrilldown(d=>({...d,open:false}))} title={drilldown.title} rows={drilldown.rows} columns={drilldown.columns} />

          {/* Notification Toast */}
          <NotificationToast message={notif.message} type={notif.type} onClose={()=>setNotif({message:'',type:'info'})} />
    </div>
  );
}

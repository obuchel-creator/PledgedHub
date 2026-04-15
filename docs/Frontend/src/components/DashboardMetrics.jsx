import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../utils/formatters';

/**
 * DashboardMetrics Component
 * Displays key performance indicators at a glance
 */
function DashboardMetrics({ pledges, payments }) {
  // Calculate metrics
  const totalPledges = pledges.length;
  const totalAmount = pledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const paidAmount = payments.reduce((sum, p) => p.status === 'completed' ? sum + (parseFloat(p.amount) || 0) : sum, 0);
  const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  const overduePledges = pledges.filter(p => p.status === 'overdue').length;
  const pendingPledges = pledges.filter(p => p.status === 'pending' || p.status === 'active').length;

  return (
    <div className="dashboard-metrics">
      <div className="metric-card">
        <div className="metric-card__header">
          <h3 className="metric-card__label">Total Pledges</h3>
          <span className="metric-card__icon">📊</span>
        </div>
        <p className="metric-card__value">{totalPledges}</p>
        <p className="metric-card__description">{pendingPledges} pending collection</p>
      </div>

      <div className="metric-card">
        <div className="metric-card__header">
          <h3 className="metric-card__label">Total Amount</h3>
          <span className="metric-card__icon">💰</span>
        </div>
        <p className="metric-card__value">{formatCurrency(totalAmount)}</p>
        <p className="metric-card__description">
          {formatCurrency(paidAmount)} collected
        </p>
      </div>

      <div className="metric-card">
        <div className="metric-card__header">
          <h3 className="metric-card__label">Collection Rate</h3>
          <span className="metric-card__icon">✅</span>
        </div>
        <p className="metric-card__value">{collectionRate}%</p>
        <p className="metric-card__description">
          <span className={`badge badge--${collectionRate >= 75 ? 'success' : collectionRate >= 50 ? 'warning' : 'danger'}`}>
            {collectionRate >= 75 ? 'Excellent' : collectionRate >= 50 ? 'Good' : 'Needs attention'}
          </span>
        </p>
      </div>

      <div className="metric-card">
        <div className="metric-card__header">
          <h3 className="metric-card__label">Overdue Pledges</h3>
          <span className="metric-card__icon">⚠️</span>
        </div>
        <p className={`metric-card__value ${overduePledges > 0 ? 'metric-card__value--warning' : ''}`}>
          {overduePledges}
        </p>
        <p className="metric-card__description">
          {overduePledges > 0 ? 'Requires attention' : 'All caught up'}
        </p>
      </div>
    </div>
  );
}

DashboardMetrics.propTypes = {
  pledges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      status: PropTypes.string,
    })
  ).isRequired,
  payments: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      status: PropTypes.string,
    })
  ).isRequired,
};

export default DashboardMetrics;

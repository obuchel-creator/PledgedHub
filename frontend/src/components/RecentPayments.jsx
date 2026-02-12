import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

/**
 * RecentPayments Component
 * Displays a list of recent payment transactions with status
 */
function RecentPayments({ payments = [], error = '' }) {
  const formatPaymentMethod = (method) => {
    if (!method) return 'Unknown';
    return method
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (error) {
    return (
      <section className="card" aria-labelledby="payments-title">
        <h2 id="payments-title" className="card__title">Recent Payments</h2>
        <p className="card__subtitle">
          Latest donations logged across campaigns.
        </p>
        <div className="alert alert--error" role="alert">
          <p className="alert__message">{error}</p>
          <p className="alert__helper">You might need staff access or a fresh login to view recent payments.</p>
        </div>
      </section>
    );
  }

  if (payments.length === 0) {
    return (
      <section className="card" aria-labelledby="payments-title">
        <h2 id="payments-title" className="card__title">Recent Payments</h2>
        <p className="card__subtitle">
          Latest donations logged across campaigns.
        </p>
        <div className="empty-state" role="status">
          <p className="empty-state__message">
            No payments recorded yet. Start collecting pledges to see them here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="payments-title">
      <div className="card__header">
        <div>
          <h2 id="payments-title" className="card__title">Recent Payments</h2>
          <p className="card__subtitle">
            Latest donations logged.{' '}
            {payments.length > 0 &&
              `Showing ${payments.length} payment${payments.length > 1 ? 's' : ''}.`}
          </p>
        </div>
      </div>

      <div className="payments-list">
        <ul className="list list--divided" role="list">
          {payments.map((payment, index) => {
            const id =
              payment?.id ||
              payment?._id ||
              `${payment?.pledge_id || 'payment'}-${index}`;

            const amount = formatCurrency(payment?.amount);
            const pledgeLabel =
              payment?.pledgeTitle ||
              payment?.pledgeName ||
              (payment?.pledgeDonor && `Pledge from ${payment.pledgeDonor}`) ||
              `Pledge #${payment?.pledge_id || 'N/A'}`;
            const paymentMethod = formatPaymentMethod(payment?.payment_method);
            const date = formatDateTime(
              payment?.payment_date || payment?.created_at || payment?.createdAt || payment?.date
            );

            return (
              <li key={id} className="payment-item" role="listitem">
                <div className="payment-item__icon">
                  {payment?.status === 'completed' || payment?.status === 'success' ? (
                    <span className="payment-item__badge payment-item__badge--success">✓</span>
                  ) : payment?.status === 'pending' ? (
                    <span className="payment-item__badge payment-item__badge--pending">⏳</span>
                  ) : (
                    <span className="payment-item__badge payment-item__badge--error">✕</span>
                  )}
                </div>
                <div className="payment-item__content">
                  <div className="payment-item__header">
                    <span className="payment-item__amount">{amount}</span>
                    <span className="payment-item__method">{paymentMethod}</span>
                  </div>
                  <p className="payment-item__label">{pledgeLabel}</p>
                  <p className="payment-item__date">{date}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

RecentPayments.propTypes = {
  payments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      pledge_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      payment_method: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'completed', 'success', 'failed', 'rejected']),
      pledgeTitle: PropTypes.string,
      pledgeName: PropTypes.string,
      pledgeDonor: PropTypes.string,
      created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  error: PropTypes.string,
};

export default RecentPayments;

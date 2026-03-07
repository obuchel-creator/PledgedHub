import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import { parsePledgeMessage } from '../utils/pledgeHelpers';

/**
 * PledgeListItem Component
 * Individual pledge row with status, amount, and quick actions
 */
function PledgeListItem({ pledge }) {
  // More robust ID extraction - check all possible ID fields
  const id = pledge?.id || pledge?._id || pledge?.pledgeId || pledge?.pledge_id;

  const details = parsePledgeMessage(pledge?.message);
  const purposeDisplay = details.purpose || pledge?.title || pledge?.name || pledge?.purpose || 'Pledge';
  const donorName = pledge?.donor_name || pledge?.fullName || 'Anonymous';
  const donorContact = pledge?.phone || pledge?.phone_number || pledge?.email || 'No contact provided';
  const pledgeDateDisplay = formatDateShort(details.pledgeDate || pledge?.date || pledge?.created_at);
  const collectionDateDisplay = formatDateShort(details.collectionDate || pledge?.collection_date);
  const amountDisplay = formatCurrency(pledge?.amount ?? pledge?.goal) || 'Amount unavailable';

  // Determine status badge
  const statusClass = `pledge-status pledge-status--${pledge?.status || 'pending'}`;

  return (
    <div className="pledge-list-item">
      <div className="pledge-list-item__main">
        <div className="pledge-list-item__header">
          <span className="pledge-list-item__amount">{amountDisplay}</span>
          <span className={statusClass}>
            {pledge?.status || 'pending'}
          </span>
        </div>
        <div className="pledge-list-item__details">
          <p className="pledge-list-item__purpose">{purposeDisplay}</p>
          <p className="pledge-list-item__donor">From: {donorName}</p>
          <p className="pledge-list-item__contact">Contact: {donorContact}</p>
        </div>
        <div className="pledge-list-item__dates">
          <span className="pledge-list-item__date">
            Pledged: {pledgeDateDisplay}
          </span>
          {collectionDateDisplay && (
            <span className="pledge-list-item__date">
              Due: {collectionDateDisplay}
            </span>
          )}
          {id && (
            <span className="pledge-list-item__date pledge-list-item__date--muted">
              Ref: #{id}
            </span>
          )}
        </div>
      </div>
      <div className="pledge-list-item__actions">
        {id ? (
          <>
            <Link
              to={`/pledges/${id}?action=pay`}
              className="btn btn-primary btn--small"
            >
              Pay Now
            </Link>
            <Link
              to={`/pledges/${id}`}
              className="btn btn--secondary btn--small"
            >
              View Details
            </Link>
          </>
        ) : (
          <button
            disabled
            className="btn btn--secondary btn--small"
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            title="Pledge ID not available"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}

PledgeListItem.propTypes = {
  pledge: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pledgeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pledge_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    name: PropTypes.string,
    purpose: PropTypes.string,
    donorName: PropTypes.string,
    donor_name: PropTypes.string,
    fullName: PropTypes.string,
    phone: PropTypes.string,
    phone_number: PropTypes.string,
    email: PropTypes.string,
    amount: PropTypes.number,
    goal: PropTypes.number,
    status: PropTypes.string,
    message: PropTypes.string,
    date: PropTypes.string,
    created_at: PropTypes.string,
    collection_date: PropTypes.string,
  }).isRequired,
};

export default PledgeListItem;

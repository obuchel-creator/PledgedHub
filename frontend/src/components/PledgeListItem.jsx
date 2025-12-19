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
  const id = pledge?.id || pledge?._id || pledge?.pledgeId;
  const details = parsePledgeMessage(pledge?.message);
  const purposeDisplay = details.purpose || pledge?.title || pledge?.name || 'Pledge';
  const donorName = pledge?.donorName || pledge?.fullName || 'Anonymous';
  const pledgeDateDisplay = formatDateShort(details.pledgeDate || pledge?.date);
  const collectionDateDisplay = formatDateShort(details.collectionDate);
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
        </div>
      </div>
      <div className="pledge-list-item__actions">
        <Link
          to={`/pledges/${id}`}
          className="btn btn--secondary btn--small"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

PledgeListItem.propTypes = {
  pledge: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pledgeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    name: PropTypes.string,
    donorName: PropTypes.string,
    fullName: PropTypes.string,
    amount: PropTypes.number,
    goal: PropTypes.number,
    status: PropTypes.string,
    message: PropTypes.string,
    date: PropTypes.string,
  }).isRequired,
};

export default PledgeListItem;

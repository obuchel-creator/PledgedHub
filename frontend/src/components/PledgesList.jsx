import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import PledgeListItem from './PledgeListItem';

/**
 * PledgesList Component
 * Displays list of pledges with optional pagination
 */
function PledgesList({ pledges, isLoading = false }) {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(pledges.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const displayedPledges = pledges.slice(startIdx, endIdx);

  return (
    <section className="pledges-section card card--glass">
      <div className="pledges-section__header">
        <div>
          <h2 className="pledges-section__title">Pledges</h2>
          <p className="pledges-section__subtitle">
            Active pledges from supporters.{' '}
            {pledges.length > 0 &&
              `Showing ${pledges.length} pledge${pledges.length > 1 ? 's' : ''}.`}
          </p>
        </div>
        <Link to="/pledges" className="btn btn--primary btn--small">
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="pledges-list__loading" aria-busy="true" aria-live="polite">
          <div className="skeleton-loader">Loading pledges...</div>
        </div>
      ) : pledges.length === 0 ? (
        <div className="pledges-list__empty">
          <div className="empty-state">
            <p className="empty-state__message">
              No pledges found. Start one to rally your supporters.
            </p>
            <Link to="/create" className="btn btn--primary">
              Create a Pledge
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="pledges-list">
            {displayedPledges.map((pledge) => (
              <PledgeListItem
                key={pledge?.id || pledge?._id || pledge?.pledgeId}
                pledge={pledge}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pledges-list__pagination">
              <button
                className="pagination__btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <span className="pagination__info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination__btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

PledgesList.propTypes = {
  pledges: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool,
};

export default PledgesList;

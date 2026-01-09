import { useEffect, useState } from 'react';

/**
 * useOnboardingModal
 * Shows onboarding modal after first login/registration (per user, per device)
 * Persists dismissal in localStorage by user id
 */
export default function useOnboardingModal(user) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user || !user.id) return;
    const key = `onboarding_shown_${user.id}`;
    const shown = localStorage.getItem(key);
    if (!shown) setShowOnboarding(true);
  }, [user]);

  function handleClose() {
    if (user && user.id) {
      localStorage.setItem(`onboarding_shown_${user.id}`, '1');
    }
    setShowOnboarding(false);
  }

  return [showOnboarding, handleClose];
}

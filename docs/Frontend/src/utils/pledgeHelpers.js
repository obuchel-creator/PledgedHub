// Utility to parse pledge message strings into structured data
export function parsePledgeMessage(message) {
  if (!message || typeof message !== 'string') return {};
  // Example: "Pledge: Choir, Amount: 50000, Date: 2023-11-01, Purpose: Sound"
  const result = {};
  message.split(',').forEach((part) => {
    const [key, ...rest] = part.split(':');
    if (key && rest.length) {
      result[key.trim().toLowerCase()] = rest.join(':').trim();
    }
  });
  // Normalize known fields
  if (result.amount) result.amount = Number(result.amount.replace(/[^\d.]/g, ''));
  if (result.date) result.pledgeDate = result.date;
  if (result.purpose) result.purpose = result.purpose;
  return result;
}

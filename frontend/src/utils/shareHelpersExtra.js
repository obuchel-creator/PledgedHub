// Additional share helpers for Telegram and Reddit
export const shareViaTelegram = (message, url = null) => {
  let text = message;
  if (url) {
    text += `\n${url}`;
  }
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
  window.open(telegramUrl, '_blank', 'width=600,height=700');
};

export const shareViaReddit = (title, url) => {
  const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  window.open(redditUrl, '_blank', 'width=600,height=700');
};

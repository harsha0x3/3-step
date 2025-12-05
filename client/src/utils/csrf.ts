export function getCSRFToken() {
  const match = document.cookie.match(/(^| )csrf_token=([^;]+)/);
  console.log(document.cookie);
  return match ? match[2] : null;
}

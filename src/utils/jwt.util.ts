// Fetch token from Chrome storage
export const getJWT = async () => {
  return new Promise<{ authToken?: string }>((resolve) => {
    chrome.storage.local.get(["authToken"], (result) => resolve(result));
  });
};

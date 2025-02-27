export const checkJWT = () => {
  console.log(chrome);
  chrome.cookies?.get(
    { url: "https://keenethics.itfin.io/", name: "itfin-jwt" },
    function (cookie) {
      console.log(cookie);
      if (cookie) {
        console.log("ITFin Token:", cookie.value);
        chrome.storage.local.set({ authToken: cookie.value });
      } else {
        console.log("No ITFin token found!");
        chrome.storage.local.remove("authToken");
      }
    }
  );
};

export const getJWT = (): string | void => {
  chrome.storage.local.get(["authToken"], function (result) {
    if (result.authToken) {
      return result.authToken;
    }
  });
};

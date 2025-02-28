import { useState, useEffect } from "react";
import { getJWT } from "../utils/jwt.utils";

const useJWT = () => {
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getJWT();
      setJwt(token?.authToken || null);
    };
    fetchToken();
  }, []);

  return jwt;
};

export default useJWT;

import React from "react";

type Props = {
  jwt: string;
};

const Header = ({ jwt }: Props) => {
  return (
    <>
      <h3>ITFin Helper</h3>
      <p>{jwt ? "Authenticated" : "Please log in via ITFin first"}</p>
    </>
  );
};

export default Header;

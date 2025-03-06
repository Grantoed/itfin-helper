import React from "react";
import * as styles from "./header.module.scss";

type Props = {
  jwt: string;
};

const Header = ({ jwt }: Props) => {
  return (
    <header className={styles.header}>
      <h3 className={styles.heading}>ITFin Helper</h3>
      <p className={styles.authStatus}>
        {jwt ? "Authenticated" : "Please log in via ITFin first"}
      </p>
    </header>
  );
};

export default Header;

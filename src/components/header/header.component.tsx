import React from "react";
import * as styles from "./header.module.scss";

type Props = {
  jwt: string;
};

const Header = ({ jwt }: Props) => {
  const isAuthed = Boolean(jwt);

  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h3 className={styles.heading}>ITFin Helper</h3>
        <span
          className={`${styles.statusChip} ${
            isAuthed ? styles.statusChipSuccess : styles.statusChipWarning
          }`}
        >
          {isAuthed ? "Signed in" : "Not signed in"}
        </span>
      </div>
      <p className={styles.subheading}>
        {isAuthed
          ? "You’re connected. Fetch data or adjust filters below."
          : "Log in on ITFin in another tab, then return to fetch data."}
      </p>
    </header>
  );
};

export default Header;

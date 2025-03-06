import React from "react";
import classNames from "classnames";
import styles from "./loader.module.scss";

type Props = {
  wrapperClass?: string;
};

const Loader: React.FC<Props> = ({ wrapperClass }) => {
  console.log(styles);
  return (
    <div
      className={classNames(styles.ldsEllipsis, {
        [wrapperClass ?? ""]: Boolean(wrapperClass),
      })}
    ></div>
  );
};

export default Loader;

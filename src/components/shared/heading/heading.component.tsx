import React from 'react';
import * as styles from './heading.module.scss';

type Props = {
	children: React.ReactNode;
};

const Heading = ({ children }: Props) => {
	return <h2 className={styles.heading}>{children}</h2>;
};

export default Heading;

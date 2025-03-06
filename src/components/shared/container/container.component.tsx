import React from 'react';
import * as styles from './container.module.scss';

type Props = {
	children: React.ReactNode;
};

const Container = ({ children }: Props) => {
	return <section className={styles.container}>{children}</section>;
};

export default Container;

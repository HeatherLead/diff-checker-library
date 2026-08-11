import React from 'react';
import DiffChecker from '../../DiffChecker';

const SiteConfig = () => {
  return (
    <DiffChecker
      initialOption="site_config"
      initialOptionLabel="Site Config"
    />
  );
};

export default SiteConfig;

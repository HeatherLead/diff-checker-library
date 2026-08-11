import React from 'react';
import DiffChecker from '../../DiffChecker';

const MasterConfig = () => {
  return (
    <DiffChecker
      initialOption="master_config"
      initialOptionLabel="Master Config"
    />
  );
};

export default MasterConfig;

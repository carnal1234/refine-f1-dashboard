import React from 'react';
import { Spin } from 'antd';
import { useLoading } from '@/context/LoadingContext';

const GlobalSpinner: React.FC = () => {
  const { isLoading } = useLoading();

  return (
    <Spin
      spinning={isLoading}
      tip="Loading..."
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: isLoading ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999, // Ensure it's on top of other content, but less than fullscreen
        backgroundColor: 'rgba(255, 255, 255, 0)', // Semi-transparent background
      }}
    />
  );
};

export default GlobalSpinner;

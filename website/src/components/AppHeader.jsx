import React from 'react';
import { Layout, Typography } from 'antd';

const { Title } = Typography;
const { Header } = Layout;

const AppHeader = () => {
  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Title level={4} style={{ margin: 0, lineHeight: '64px', fontWeight: 600, letterSpacing: '1px' }}>
        洛克王国PVP对局录入工具
      </Title>
    </Header>
  );
};

export default AppHeader;
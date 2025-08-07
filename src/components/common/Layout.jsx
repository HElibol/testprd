import React, { useState, useEffect } from 'react';
import { Layout as AntLayout } from 'antd';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedWorkcenter, setSelectedWorkcenter] = useState('');
  const [refreshOperationsFunction, setRefreshOperationsFunction] = useState(null); 

  const toggleSidebar = () => {
    // Menüyü kesinlikle kapat/aç - daha agresif yaklaşım
    setCollapsed(prev => {
      const newState = !prev;
      
      // Hemen state değişikliğini force et
      if (newState) {
        // Menü kapanıyor - tüm cleanup işlemleri
        document.body.style.overflow = 'auto';
        document.body.classList.remove('sidebar-open');
        document.body.classList.add('sidebar-closed');
      } else {
        // Menü açılıyor
        document.body.classList.remove('sidebar-closed');
        document.body.classList.add('sidebar-open');
        if (window.innerWidth <= 768) {
          document.body.style.overflow = 'hidden';
        }
      }
      
      // Gecikmeli cleanup - state'in tam olarak uygulanması için
      setTimeout(() => {
        // Force re-render
        if (newState) {
          // Kapatma işlemini garanti et
          const sidebar = document.querySelector('.ant-layout-sider');
          if (sidebar) {
            sidebar.style.width = '0px';
            sidebar.style.minWidth = '0px';
            sidebar.style.maxWidth = '0px';
            sidebar.style.transform = 'translateX(-100%)';
            sidebar.style.visibility = 'hidden';
            sidebar.style.opacity = '0';
          }
        }
      }, 10);
      
      return newState;
    });
  };

  // Ekran boyutu değişince mobile scroll cleanup
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        document.body.style.overflow = 'auto';
      } else if (!collapsed) {
        document.body.style.overflow = 'hidden';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'auto'; // Cleanup
    };
  }, [collapsed]);

  // Component unmount olurken cleanup
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const selectedRow = selectedRecords.find(record => 
    selectedRowKeys.includes(record.key)
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sidebar 
        collapsed={collapsed} 
        onToggle={toggleSidebar}
        selectedRecords={selectedRecords}
        setSelectedRecords={setSelectedRecords}
        selectedRowKeys={selectedRowKeys}
        setSelectedRowKeys={setSelectedRowKeys}
        selectedWorkcenter={selectedWorkcenter}
        setSelectedWorkcenter={setSelectedWorkcenter}
        onRefreshOperations={setRefreshOperationsFunction}
      />
      <AntLayout>
        <Header 
          collapsed={collapsed} 
          onToggle={toggleSidebar}
          selectedRecords={selectedRecords}
          selectedRowKeys={selectedRowKeys}
          selectedRow={selectedRow}
          selectedWorkcenter={selectedWorkcenter}
          refreshOperations={refreshOperationsFunction}
        />
        <Content
          style={{
            margin: '24px',
            padding: '0',
            minHeight: 'calc(100vh - 112px)',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;

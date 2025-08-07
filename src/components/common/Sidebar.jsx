import React, { useState, useEffect } from 'react';
import { Layout, Input, Table, Typography, Card, Button, Space, message, TreeSelect } from 'antd';
import {
  SearchOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { authAxios, caniasAPI } from '../../services/api';

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({
  collapsed,
  onToggle,
  selectedRecords,
  setSelectedRecords,
  selectedRowKeys,
  setSelectedRowKeys,
  selectedWorkcenter,
  setSelectedWorkcenter,
  onRefreshOperations
}) => {
  const [selectedValue, setSelectedValue] = useState(() => {
    // localStorage'dan seçili iş merkezini yükle
    try {
      return localStorage.getItem('selectedWorkcenter') || undefined;
    } catch {
      return undefined;
    }
  });
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [workcentersData, setWorkcentersData] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [operationsData, setOperationsData] = useState([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsFetched, setOperationsFetched] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      // Masaüstü için daha büyük genişlik (yüzde 60), mobil için yüzde 100
      const width = screenWidth > 768 ? Math.floor(screenWidth * 0.6) : screenWidth;
      const minWidth = 280;
      const maxWidth = screenWidth > 768 ? 1200 : screenWidth; // Masaüstü için daha yüksek max
      return Math.max(minWidth, Math.min(maxWidth, width));
    }
    return 600;
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // localStorage'dan verileri yükle
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedWorkcenter = localStorage.getItem('selectedWorkcenter');
        const savedWorkcenterId = localStorage.getItem('selectedWorkcenterId');
        const savedOperationsData = localStorage.getItem('operationsData');
        const savedSelectedRecords = localStorage.getItem('selectedRecords');
        const savedSelectedRowKeys = localStorage.getItem('selectedRowKeys');

        if (savedWorkcenter && savedWorkcenterId) {
          setSelectedWorkcenter(savedWorkcenterId);
          setSelectedValue(savedWorkcenter); // TreeSelect için değer set et

          // İş merkezi için selectedRecords'ı yeniden oluştur
          if (workcentersData.length > 0) {
            let foundItem = null;
            for (const stand of workcentersData) {
              for (const workcenter of stand.children || []) {
                if (workcenter.value === savedWorkcenter) {
                  foundItem = workcenter;
                  break;
                }
              }
              if (foundItem) break;
            }

            if (foundItem) {
              setSelectedRecords([foundItem]);
              console.log('✅ localStorage\'dan iş merkezi yüklendi:', foundItem.name);
              // Operasyonları yeniden fetch et
              await fetchOperations(savedWorkcenterId);
            }
          }
        }

        if (savedOperationsData) {
          const operations = JSON.parse(savedOperationsData);
          setOperationsData(operations);
          setOperationsFetched(true);
        }

        if (savedSelectedRecords) {
          const records = JSON.parse(savedSelectedRecords);
          setSelectedRecords(records);
        }

        if (savedSelectedRowKeys) {
          const keys = JSON.parse(savedSelectedRowKeys);
          setSelectedRowKeys(keys);
        }
      } catch (error) {
        console.log('localStorage yükleme hatası:', error);
      }
    };

    if (workcentersData.length > 0) {
      loadSavedData();
    }
  }, [workcentersData, setSelectedRecords, setSelectedRowKeys, setSelectedWorkcenter]);

  useEffect(() => {
    if (collapsed) {
      // Collapsed durumda hiçbir şeyi temizleme
      // Kullanıcı sidebar'ı kapattığında seçimler kalacak
    }
  }, [collapsed]);

  useEffect(() => {
    const fetchWorkcenters = async () => {
      setApiLoading(true);
      try {
        const response = await authAxios.get('/canias/list-workcenters');

        console.log('Workcenters API Response:', response.data);
        const result = response.data;

        if (result.success === "true" && result.data) {
          const transformedData = transformApiDataToTree(result.data);
          setWorkcentersData(transformedData);
          message.success('İş merkezi verileri başarıyla yüklendi');
        } else {
          message.error('İş merkezi verileri yüklenemedi');
          setWorkcentersData([]);
        }
      } catch (error) {
        console.error('İş merkezi verileri yüklenirken hata:', error);
        message.error('İş merkezi verileri yüklenirken bir hata oluştu');
        setWorkcentersData([]);
      } finally {
        setApiLoading(false);
      }
    };

    fetchWorkcenters();
  }, []);

  const transformApiDataToTree = (apiData) => {
    if (!Array.isArray(apiData)) {
      console.warn('API verisi array formatında değil:', apiData);
      return [];
    }

    return apiData.map((stand, index) => ({
      title: stand.standName || `Stand ${index + 1}`,
      value: `stand-${index}`,
      key: `stand-${index}`,
      selectable: false,
      children: (stand.workcenters || []).map((workcenter, wcIndex) => ({
        title: `${workcenter.WORKCENTER} - ${workcenter.STEXT}`,
        value: `${workcenter.WORKCENTER}-${workcenter.COMPANY}-${workcenter.PLANT}`,
        key: `${workcenter.WORKCENTER}-${workcenter.COMPANY}-${workcenter.PLANT}`,

        name: workcenter.WORKCENTER,
        description: workcenter.STEXT,
        type: 'İş Merkezi',
        location: `${workcenter.STAND_NAME}`,
        workOrderId: workcenter.WORKCENTER,
        operator: workcenter.RESPONSIBLE || '-',
        priority: 'Normal',
        estimatedTime: '-',
        productCode: '-',
        quantity: 0,
        machineType: workcenter.STEXT,
        company: workcenter.COMPANY,
        plant: workcenter.PLANT,
        workcenter: workcenter.WORKCENTER,
        standName: workcenter.STAND_NAME,
        stext: workcenter.STEXT,
        predecessor: workcenter.PREDECESSOR,
        costcenter: workcenter.COSTCENTER,
        responsible: workcenter.RESPONSIBLE,
        stand: workcenter.STAND,
        wcusage: workcenter.WCUSAGE,
        validFrom: workcenter.VALIDFROM,
        validUntil: workcenter.VALIDUNTIL
      }))
    }));
  };

  const getColumns = () => {
    const isOperationData = operationsData.length > 0;

    if (isOperationData) {
      const baseColumns = [
        {
          title: isMobile ? 'Üretim' : 'Üretim Emri',
          dataIndex: 'prdOrder',
          key: 'prdOrder',
          fixed: isMobile ? false : 'left',
          width: isMobile ? 80 : 110,
          ellipsis: isMobile,
        },
        {
          title: isMobile ? 'Onay' : 'Onay No',
          dataIndex: 'confirmation',
          key: 'confirmation',
          width: isMobile ? 80 : 110,
          ellipsis: isMobile,
        },
      ];

      if (!isMobile) {
        baseColumns.push(
          {
            title: 'Malzeme',
            dataIndex: 'material',
            key: 'material',
            width: 120,
          },
          {
            title: 'Açıklama',
            dataIndex: 'stext',
            key: 'stext',
            width: 150,
            ellipsis: true,
          },
          {
            title: 'Başlangıç',
            dataIndex: 'targetStart',
            key: 'targetStart',
            width: 120,
            render: (text) => formatDateTime(text)
          },
          {
            title: 'Bitiş',
            dataIndex: 'targetEnd',
            key: 'targetEnd',
            width: 120,
            render: (text) => formatDateTime(text)
          },
          {
            title: 'Hedef Miktar',
            dataIndex: 'targetOut',
            key: 'targetOut',
            width: 100,
          }
        );
      } else {
        baseColumns.push({
          title: 'Malzeme',
          dataIndex: 'material',
          key: 'material',
          width: 90,
          ellipsis: true,
        });
      }

      baseColumns.push({
        title: 'Durum',
        dataIndex: 'status',
        key: 'status',
        width: isMobile ? 70 : 90,
        render: (text) => {
          let color = '#666';
          if (text === 'Başladı') color = '#1890ff';
          else if (text === 'Beklemede') color = '#faad14';
          else if (text === 'Tamamlandı') color = '#52c41a';
          else if (text === 'Yeni') color = '#722ed1';

          return (
            <span style={{
              color: color,
              fontWeight: 'bold'
            }}>
              {text}
            </span>
          );
        },
      });

      return baseColumns;
    } else {
      const baseColumns = [
        {
          title: isMobile ? 'İş Merk.' : 'İş Merkezi',
          dataIndex: 'name',
          key: 'name',
          fixed: isMobile ? false : 'left',
          width: isMobile ? 80 : 100,
          ellipsis: isMobile,
        },
        {
          title: 'Açıklama',
          dataIndex: 'description',
          key: 'description',
          width: isMobile ? 100 : 150,
          ellipsis: isMobile,
        },
      ];

      if (!isMobile) {
        baseColumns.push(
          {
            title: 'Sorumlu',
            dataIndex: 'operator',
            key: 'operator',
            width: 80,
          },
          {
            title: 'Şirket/Tesis',
            dataIndex: 'company',
            key: 'company',
            width: 100,
            render: (text, record) => `${record.company}/${record.plant}`,
          },
          {
            title: 'Maliyet Merkezi',
            dataIndex: 'costcenter',
            key: 'costcenter',
            width: 100,
          },
          {
            title: 'Lokasyon',
            dataIndex: 'location',
            key: 'location',
            width: 130,
          },
          {
            title: 'Geçerlilik',
            dataIndex: 'validFrom',
            key: 'validFrom',
            width: 100,
            render: (text, record) => `${record.validFrom} - ${record.validUntil}`,
          }
        );
      } else {
        baseColumns.push({
          title: 'Sorumlu',
          dataIndex: 'operator',
          key: 'operator',
          width: 80,
        });
      }

      baseColumns.push({
        title: 'Durum',
        dataIndex: 'status',
        key: 'status',
        width: 80,
        render: (text) => (
          <span style={{
            color: text === 'Aktif' ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold'
          }}>
            {text}
          </span>
        ),
      });

      return baseColumns;
    }
  };

  const handleSelectChange = async (value) => {
    setSelectedValue(value);

    if (value) {
      let selectedItem = null;
      for (const stand of workcentersData) {
        for (const workcenter of stand.children || []) {
          if (workcenter.value === value) {
            selectedItem = workcenter;
            break;
          }
        }
        if (selectedItem) break;
      }

      if (selectedItem) {
        const newWorkcenter = selectedItem.workcenter;

        // Eğer farklı bir iş merkezi seçildiyse, operasyon seçimlerini temizle
        if (selectedWorkcenter !== newWorkcenter) {
          setSelectedRowKeys([]);
          localStorage.removeItem('selectedRecords');
          localStorage.removeItem('selectedRowKeys');
          localStorage.removeItem('operationsData');
        }

        // İş merkezi bilgisini selectedRecords'a ekle (tablo için gerekli)
        setSelectedRecords([selectedItem]);
        setSelectedWorkcenter(newWorkcenter);
        localStorage.setItem('selectedWorkcenter', value);
        localStorage.setItem('selectedWorkcenterId', newWorkcenter);

        message.info(`${selectedItem.name} iş merkezi seçildi`);

        await fetchOperations(newWorkcenter);
      }
    } else {
      // TreeSelect temizlenirse her şeyi temizle
      setSelectedRecords([]);
      setSelectedRowKeys([]);
      setOperationsData([]);
      setOperationsFetched(false);
      setSelectedWorkcenter('');
      localStorage.removeItem('selectedWorkcenter');
      localStorage.removeItem('selectedWorkcenterId');
      localStorage.removeItem('selectedRecords');
      localStorage.removeItem('selectedRowKeys');
      localStorage.removeItem('operationsData');
      message.info('Seçim temizlendi');
    }
  };

  const fetchOperations = async (workcenterId) => {
    console.log('🔄 fetchOperations çağrıldı:', workcenterId);
    setOperationsLoading(true);
    setOperationsData([]);
    setOperationsFetched(true);
    try {
      console.log('📡 API isteği gönderiliyor:', { workcenterId });
      const response = await authAxios.post('/canias/list-operations', {
        workcenterId: workcenterId,
      });

      console.log('📥 Operations API Response:', response.data);
      const result = response.data;

      if (result.success && result.data.TBLRETURN && result.data.TBLRETURN !== "" && result.data.TBLRETURN.ROW) {
        const operations = Array.isArray(result.data.TBLRETURN.ROW)
          ? result.data.TBLRETURN.ROW
          : [result.data.TBLRETURN.ROW];

        const transformedOperations = transformOperationsData(operations);
        setOperationsData(transformedOperations);
        localStorage.setItem('operationsData', JSON.stringify(transformedOperations));
        message.success(`${workcenterId} için ${operations.length} iş emri yüklendi`);
      } else {
        message.info(`${workcenterId} için operasyon bulunamadı`);
        setOperationsData([]);
        localStorage.setItem('operationsData', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Operasyonlar yüklenirken hata:', error);
      message.error('Operasyonlar yüklenirken bir hata oluştu');
      setOperationsData([]);
      localStorage.setItem('operationsData', JSON.stringify([]));
    } finally {
      setOperationsLoading(false);
    }
  };

  // fetchOperations fonksiyonunu dışarıya expose et
  useEffect(() => {
    if (onRefreshOperations) {
      onRefreshOperations(fetchOperations);
    }
  }, [onRefreshOperations]);

  const transformOperationsData = (apiData) => {
    if (!Array.isArray(apiData)) {
      console.warn('Operasyon verisi array formatında değil:', apiData);
      return [];
    }

    return apiData.map((operation, index) => ({
      key: operation.CONFIRMATION || operation.PRDORDER || `op-${index}`,

      name: operation.PRDORDER,
      description: operation.MATERIAL,
      type: 'İş Emri',
      status: getOperationStatus(operation.STATUS3, operation.STATUS4),
      location: operation.WORKCENTER,
      workOrderId: operation.PRDORDER,
      operator: operation.CONFIRMPOS || '-',
      priority: 'Normal',
      estimatedTime: formatDateTime(operation.TARGETEND),
      productCode: operation.MATERIAL,
      quantity: '-',
      machineType: operation.WORKCENTER,

      // Yeni alanlar
      prdOrder: operation.PRDORDER,
      confirmation: operation.CONFIRMATION,
      material: operation.MATERIAL,
      targetOut: operation.TARGETOUT,
      targetStart: operation.TARGETSTART,
      targetEnd: operation.TARGETEND,
      stext: operation.STEXT,
      retValue: operation.RETVALUE,

      // Eski alanlar (geriye uyumluluk için)
      operation: operation.OPERATION,
      bomLevel: operation.BOMLEVEL,
      company: operation.COMPANY,
      plant: operation.PLANT,
      poType: operation.POTYPE,
      workcenter: operation.WORKCENTER,
      capGrp: operation.CAPGRP,
      status2: operation.STATUS2,
      status3: operation.STATUS3,
      status4: operation.STATUS4,
      confirmPos: operation.CONFIRMPOS,
      openDate: operation.OPENDATE,
      isCombined: operation.ISCOMBINED,
      isExtern: operation.ISEXTERN
    }));
  };

  const getOperationStatus = (status3, status4) => {
    if (status3 === '1' && status4 === '0') {
      return 'Başladı';
    } else if (status3 === '0' && status4 === '1') {
      return 'Beklemede';
    } else if (status3 === '1' && status4 === '1') {
      return 'Tamamlandı';
    } else {
      return 'Yeni';
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr || dateTimeStr === '01.01.1975 00:00:00') {
      return '-';
    }
    return dateTimeStr;
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      message.warning('Lütfen resim numarası girin!');
      return;
    }

    setSearchLoading(true);
    try {
      
      const result = await caniasAPI.getImage(searchText.trim());
      
      console.log('🖼️ Image API Response:', result);
      
      if (result.success && result.data) {
        console.log('🖼️ Image URL oluşturuldu:', result.data);
        
        if (window.setImageData) {
          window.setImageData(result.data, searchText.trim());
        }
        
        message.success(`Resim ${searchText} başarıyla yüklendi!`);
        setSearchText('');
      } else {
        const errorMsg = result.message || 'Resim yükleme başarısız';
        message.error(errorMsg);
      }
      
    } catch (error) {
      console.error('Resim getirme hatası:', error);
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Resim getirilemedi';
      message.error(`Resim getirme başarısız: ${errorMsg}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRowSelectionChange = async (selectedKeys, selectedRows) => {
    console.log('Selection changed:', { selectedKeys, selectedRows });
    
    setSelectedRowKeys(selectedKeys);
    setSelectedRecords(selectedRows);

    localStorage.setItem('selectedRowKeys', JSON.stringify(selectedKeys));
    localStorage.setItem('selectedRecords', JSON.stringify(selectedRows));

    const itemType = operationsFetched ? 'iş emri' : 'iş merkezi';
    
    if (selectedRows.length > 0) {
      message.info(`${selectedRows.length} ${itemType} seçildi`);
      // --- Resim otomatik gösterme mantığı ---
      // Sadece iş emri tablosu için uygula
      if (operationsFetched) {
        const lastSelected = selectedRows[selectedRows.length - 1];
        const materialNo = lastSelected.material || lastSelected.MATERIAL;
        if (materialNo) {
          try {
            // Resim API isteği
            const result = await caniasAPI.getImage(materialNo);
            if (result.success && result.data) {
              if (window.setImageData) {
                window.setImageData(result.data, materialNo);
              }
              message.success(`Resim ${materialNo} başarıyla yüklendi!`);
            } else {
              const errorMsg = result.message || 'Resim yükleme başarısız';
              message.error(errorMsg);
            }
          } catch (error) {
            console.error('Resim getirme hatası:', error);
            const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Resim getirilemedi';
            message.error(`Resim getirme başarısız: ${errorMsg}`);
          }
        }
      }
    } else {
      message.info(`${itemType} seçimi kaldırıldı`);
    }
  };

  const getTreeSelectData = () => {
    return workcentersData;
  };

  // Ekran boyutu değişikliklerini dinle
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      // Masaüstü için daha büyük genişlik (yüzde 60), mobil için yüzde 100
      const width = screenWidth > 768 ? Math.floor(screenWidth * 0.6) : screenWidth;
      const minWidth = 280;
      const maxWidth = screenWidth > 768 ? 1200 : screenWidth; // Masaüstü için daha yüksek max
      setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, width)));
      
      // Mobil genişlikten çıkılırsa menüyü kapat
      if (screenWidth > 768 && !collapsed) {
        // Desktop'a geçerken menüyü açık bırak, sadece mobile cleanup yap
        document.body.style.overflow = 'auto';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  const getSidebarWidth = () => {
    if (collapsed) {
      return isMobile ? 0 : 80;
    }
    
    if (isMobile) {
      // Mobil için tam ekran genişliği
      return window.innerWidth;
    }
    
    // Masaüstü için daha büyük genişlik
    return sidebarWidth;
  };

  // Overlay tıklama handler'ını güçlendir
  const handleOverlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(); // Kesinlikle menüyü kapat
  };

  return (
    <>
      {isMobile && !collapsed && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            cursor: 'pointer',
          }}
          onClick={handleOverlayClick}
          onTouchEnd={handleOverlayClick} // Touch cihazlar için ekstra
        />
      )}

      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={getSidebarWidth()}
        collapsedWidth={0} // Her durumda 0 yap
        breakpoint="lg"
        zeroWidthTriggerStyle={{
          display: 'none', // Trigger'ı tamamen gizle
        }}
        style={{
          overflow: collapsed ? 'hidden' : 'auto',
          height: '100vh',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: collapsed ? (isMobile ? '-100%' : '-80px') : '0', // Collapsed'da tamamen dışarı çıkar
          background: '#001529',
          zIndex: isMobile ? 1000 : 'auto',
          boxShadow: isMobile && !collapsed ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Daha uzun transition
          transform: collapsed ? 'translateX(-100%)' : 'translateX(0)', // Transform ile de gizle
          visibility: collapsed ? 'hidden' : 'visible', // Visibility de ekle
          opacity: collapsed ? 0 : 1, // Opacity ile de gizle
          width: collapsed ? '0px !important' : undefined, // Force width 0
          minWidth: collapsed ? '0px !important' : undefined, // Min width da 0
          maxWidth: collapsed ? '0px !important' : undefined, // Max width da 0
        }}
      >
        {!collapsed && (
          <>
            {isMobile && (
              <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
                  İş Merkezi
                </Text>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={onToggle}
                  style={{
                    color: 'white',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                  }}
                  size="small"
                />
              </div>
            )}
            <div style={{ 
              padding: '12px', 
              paddingTop: '12px',
              display: 'flex',
              gap: '8px',
              alignItems: 'stretch',
              width: '100%'
            }}>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Resim No Giriniz"
                style={{ 
                  flex: 1,
                  padding: '8px 12px', 
                  borderRadius: '6px', 
                  border: '1px solid #d9d9d9',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#1890ff'}
                onBlur={(e) => e.target.style.borderColor = '#d9d9d9'}
              />
              <Button
                type="primary"
                onClick={handleSearch}
                loading={searchLoading}
                style={{ 
                  minWidth: '90px',
                  height: '36px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                size="middle"
              >
                Resim Göster
              </Button>
            </div>
            <div style={{ padding: isMobile ? '0 8px 8px 8px' : '0 12px 12px 12px', paddingTop: '12px' }}>
              <TreeSelect
                placeholder="Stand ve iş merkezi seç..."
                allowClear
                showSearch
                size="middle"
                value={selectedValue}
                onChange={handleSelectChange}
                treeData={getTreeSelectData()}
                style={{ 
                  width: '100%',
                  fontSize: '14px'
                }}
                dropdownStyle={{
                  fontSize: '14px'
                }}
                treeDefaultExpandAll
                treeNodeFilterProp="title"
                loading={apiLoading}
                disabled={apiLoading}
                notFoundContent={apiLoading ? 'Yükleniyor...' : 'Veri bulunamadı'}
              />
            </div>
            {selectedWorkcenter && (operationsData.length > 0 || selectedRecords.length > 0) && (
              <div style={{ padding: '0 12px 12px 12px' }}>
                <Card
                  size="small"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    maxHeight: isMobile ? 'calc(100vh - 250px)' : 'calc(100vh - 200px)',
                    overflow: 'auto',
                  }}
                >
                  <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                    {operationsFetched ? 'İş Merkezi Operasyonları' : 'Seçili İş Merkezi'}
                  </Text>
                  {operationsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Text>Operasyonlar yükleniyor...</Text>
                    </div>
                  ) : (
                    <Table
                      columns={getColumns()}
                      dataSource={operationsFetched ? operationsData : (operationsData.length > 0 ? operationsData : selectedRecords)}
                      pagination={false}
                      size="small"
                      scroll={{
                        x: isMobile ? 280 : 1000,
                        y: isMobile ? 200 : 250
                      }}
                      showHeader={true}
                      tableLayout={isMobile ? 'fixed' : 'auto'}
                      style={{
                        fontSize: isMobile ? '11px' : '12px'
                      }}
                      rowSelection={{
                        type: 'checkbox',
                        selectedRowKeys,
                        onChange: handleRowSelectionChange,
                        getCheckboxProps: (record) => ({
                          name: record.name,
                        }),
                        columnWidth: isMobile ? 30 : 40,
                        preserveSelectedRowKeys: false,
                      }}
                      rowKey="key"
                      locale={{
                        emptyText: operationsFetched && operationsData.length === 0
                          ? 'Bu iş merkezi için operasyon bulunamadı'
                          : 'Veri yok'
                      }}
                    />
                  )}
                </Card>
              </div>
            )}
          </>
        )}
      </Sider>
    </>
  );
};

export default Sidebar;

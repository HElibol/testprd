import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Space, Typography, Button, message, Modal, Form, Input, Card, Tag } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ToolOutlined,
  BuildOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { authAxios } from '../../services/api';

const { Header: AntHeader } = Layout;
const { Text, Title } = Typography;

const Header = ({ collapsed, onToggle, selectedRecords, selectedRowKeys, selectedRow, selectedWorkcenter, refreshOperations }) => {
  const { user, logout } = useAuth();
  const [buttonLoading, setButtonLoading] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [workOrderStatuses, setWorkOrderStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('workOrderStatuses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isEndProductionOpen, setIsEndProductionOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedWorkcenterInfo, setSelectedWorkcenterInfo] = useState(null);

  useEffect(() => {
    const checkScreenSize = () => {
      // Masaüstü için daha yüksek eşik değeri
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Seçili iş merkezi bilgilerini al
  useEffect(() => {
    if (selectedWorkcenter && selectedRecords && selectedRecords.length > 0) {
      const workcenterInfo = selectedRecords[0];
      setSelectedWorkcenterInfo(workcenterInfo);
    } else {
      setSelectedWorkcenterInfo(null);
    }
  }, [selectedWorkcenter, selectedRecords]);

  const updateWorkOrderStatus = (confirmation, status) => {
    const newStatuses = {
      ...workOrderStatuses,
      [confirmation]: status
    };
    setWorkOrderStatuses(newStatuses);
    localStorage.setItem('workOrderStatuses', JSON.stringify(newStatuses));
  };

  const handleLogout = () => {
    logout();
  };

  const getCurrentStatus = () => {
    if (!selectedRow || !selectedRow.confirmation) return 1;
    return workOrderStatuses[selectedRow.confirmation] || 1;
  };

  const buttonControl = getCurrentStatus();

  const getActiveButtons = () => {
    const activeButtons = {
      startProduction: false,     // Üretim Başlat
      finishProduction: false,    // Üretim Bitir
      startIdle: false,           // Duruş Başlat
      finishFailure: false,       // Duruş Bitir
      quickTransaction: false     // Başlat Bitir (Özel)
    };

    switch (buttonControl) {
      case 1:
        activeButtons.startProduction = true;   // Üretim Başlat
        activeButtons.quickTransaction = true;  // Başlat Bitir
        break;
      case 2:
        activeButtons.startIdle = true;         // Duruş Başlat
        break;
      case 3:
        activeButtons.finishFailure = true;     // Duruş Bitir
        break;
      case 4:
        activeButtons.finishProduction = true;  // Üretim Bitir
        activeButtons.startIdle = true;         // Duruş Başlat
        break;
      case 5:
        activeButtons.finishFailure = true;     // Duruş Bitir
        break;
      case 9:
      case 10:
        activeButtons.startProduction = true;   // Üretim Başlat
        activeButtons.quickTransaction = true;  // Başlat Bitir
        break;
      default:
        break;
    }

    return activeButtons;
  };

  const activeButtons = getActiveButtons();


  const handleStartProduction = async () => {
    console.log("handleStartProduction");

    if (!selectedWorkcenter) {
      message.warning('Lütfen önce bir iş merkezi seçin!');
      return;
    }

    if (!selectedRow || !selectedRow.confirmation) {
      message.warning('Lütfen önce İş Emirleri tablosundan bir satır seçin!');
      return;
    }

    setButtonLoading('startProduction');
    try {
      const params = {
        workcenterId: selectedWorkcenter,
        PSCONFIRMATION: selectedRow.confirmation,
      };

      console.log("Üretim başlatılıyor:", params);

      const response = await authAxios.post('/canias/start-production', params);
      const result = response.data;

      if (result.success === "true") {
        console.log('🟢 Üretim Başlat API SUCCESS - Dönen status:', result.data);
        updateWorkOrderStatus(selectedRow.confirmation, result.data);
        console.log('🟢 Status güncellendi:', selectedRow.confirmation, '=', result.data);
        message.success(`Üretim başarıyla başlatıldı!\nİş Merkezi: ${selectedWorkcenter}\nOnay No: ${selectedRow.confirmation}\nYeni Status: ${result.data}`);
        
        // İş emri listesini yenile
        if (refreshOperations && selectedWorkcenter) {
          console.log('🔄 İş emri listesi yenileniyor...');
          console.log('📞 refreshOperations fonksiyonu çağrılıyor:', typeof refreshOperations);
          setTimeout(() => {
            console.log('⏰ 1 saniye sonra yenileme başlıyor...');
            refreshOperations(selectedWorkcenter);
            console.log('✅ refreshOperations çağrısı tamamlandı');
          }, 1000); // 1 saniye bekle
        } else {
          console.log('❌ refreshOperations fonksiyonu bulunamadı veya selectedWorkcenter yok');
          console.log('refreshOperations:', typeof refreshOperations);
          console.log('selectedWorkcenter:', selectedWorkcenter);
        }
      } else if (result.success === false) {
        const errorMsg = result.error?.message || result.error?.description || result.message || 'Bilinmeyen hata';
        console.log('🔴 Üretim Başlat API FAILED:', result);
        alert(`HATA: ${errorMsg}`);
        message.error(`Üretim başlatılamadı: ${errorMsg}`);
      } else {
        console.log('🔴 Üretim Başlat API - Beklenmeyen yanıt:', result);
        message.error('Üretim başlatılamadı - Beklenmeyen yanıt!');
      }
    } catch (error) {
      console.log("🔴 Üretim Başlatma Network/JS Hatası:", error);
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Network hatası';
      alert(`NETWORK HATASI: ${errorMsg}`);
      message.error(`Üretim başlatılamadı (Network): ${errorMsg}`);
    } finally {
      setButtonLoading(null);
    }
  };

  const handleStopProduction = () => {
    console.log("handleStopProduction");

    if (!selectedRow || !selectedRow.confirmation) {
      message.warning('Lütfen önce İş Emirleri tablosundan bir satır seçin!');
      return;
    }

    if (!selectedWorkcenter) {
      message.warning('Lütfen önce bir iş merkezi seçin!');
      return;
    }

    form.resetFields();
    setIsEndProductionOpen(true);
  };

  const handleEndProductionSubmit = async (values) => {
    setButtonLoading('finishProduction');

    try {
      const params = {
        workcenterId: selectedWorkcenter,
        PSCONFIRMATION: selectedRow.confirmation,
        POTYPE: selectedRow.poType,
        PRDORDER: selectedRow.prdOrder,
        OPERATION: parseInt(selectedRow.operation),
        BOMLEVEL: parseInt(selectedRow.bomLevel),
        PDCOUTPUT: parseInt(values.pdcOutput),
        PDCSCRAP: parseInt(values.pdcScrap)
      };

      console.log("Üretim bitiriliyor:", params);

      const response = await authAxios.post('/canias/end-production', params);
      const result = response.data;

      console.log("Üretim bitirme sonucu:", result);

      if (result.success === "true") {
        // Status'u güncelle ve localStorage'a kaydet
        updateWorkOrderStatus(selectedRow.confirmation, result.data);
        message.success(`Üretim başarıyla bitirildi!\nİş Merkezi: ${selectedWorkcenter}\nConfirmation: ${selectedRow.confirmation}\nÜretilen: ${values.pdcOutput}\nFire: ${values.pdcScrap}\nYeni Status: ${result.data}`);
        setIsEndProductionOpen(false);
        form.resetFields();
        
        // İş emri listesini yenile
        if (refreshOperations && selectedWorkcenter) {
          console.log('🔄 İş emri listesi yenileniyor...');
          console.log('📞 refreshOperations fonksiyonu çağrılıyor:', typeof refreshOperations);
          setTimeout(() => {
            console.log('⏰ 1 saniye sonra yenileme başlıyor...');
            refreshOperations(selectedWorkcenter);
            console.log('✅ refreshOperations çağrısı tamamlandı');
          }, 1000); // 1 saniye bekle
        } else {
          console.log('❌ refreshOperations fonksiyonu bulunamadı veya selectedWorkcenter yok');
          console.log('refreshOperations:', typeof refreshOperations);
          console.log('selectedWorkcenter:', selectedWorkcenter);
        }
      } else if (result.success === false) {
        const errorMsg = result.error?.message || result.error?.description || result.message || 'Bilinmeyen hata';
        console.log('🔴 Üretim Bitir API FAILED:', result);
        alert(`HATA: ${errorMsg}`);
        message.error(`Üretim bitirilemedi: ${errorMsg}`);
      } else {
        console.log('🔴 Üretim Bitir API - Beklenmeyen yanıt:', result);
        message.error('Üretim bitirilemedi - Beklenmeyen yanıt!');
      }
    } catch (error) {
      console.log("🔴 Üretim Bitirme Network/JS Hatası:", error);
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Network hatası';
      alert(`NETWORK HATASI: ${errorMsg}`);
      message.error(`Üretim bitirilemedi (Network): ${errorMsg}`);
    } finally {
      setButtonLoading(null);
    }
  };

  const handleStartBreak = async () => {
    console.log("handleStartBreak");

    if (!selectedRow || !selectedRow.confirmation) {
      message.warning('Lütfen önce İş Emirleri tablosundan bir satır seçin!');
      return;
    }

    if (!selectedWorkcenter) {
      message.warning('Lütfen önce bir iş merkezi seçin!');
      return;
    }

    setButtonLoading('startIdle');
    try {
      const params = {
        workcenterId: selectedWorkcenter,
        PSCONFIRMATION: selectedRow.confirmation,
        POTYPE: selectedRow.poType,
        PRDORDER: selectedRow.prdOrder,
        OPERATION: parseInt(selectedRow.operation),
        BOMLEVEL: parseInt(selectedRow.bomLevel)
      };

      console.log("Duruş başlatılıyor:", params);
      const response = await authAxios.post('/canias/start-failure', params);
      const result = response.data;
      console.log("Duruş başlatma sonucu:", result);

      if (result.success === "true") {
        updateWorkOrderStatus(selectedRow.confirmation, result.data);
        message.success(`Duruş başarıyla başlatıldı!\nİş Merkezi: ${selectedWorkcenter}\nConfirmation: ${selectedRow.confirmation}\nYeni Status: ${result.data}`);
        
        // İş emri listesini yenile
        if (refreshOperations && selectedWorkcenter) {
          console.log('🔄 İş emri listesi yenileniyor...');
          console.log('📞 refreshOperations fonksiyonu çağrılıyor:', typeof refreshOperations);
          setTimeout(() => {
            console.log('⏰ 1 saniye sonra yenileme başlıyor...');
            refreshOperations(selectedWorkcenter);
            console.log('✅ refreshOperations çağrısı tamamlandı');
          }, 1000); // 1 saniye bekle
        } else {
          console.log('❌ refreshOperations fonksiyonu bulunamadı veya selectedWorkcenter yok');
          console.log('refreshOperations:', typeof refreshOperations);
          console.log('selectedWorkcenter:', selectedWorkcenter);
        }
      } else if (result.success === false) {
        const errorMsg = result.error?.message || result.error?.description || result.message || 'Bilinmeyen hata';
        alert(`HATA: ${errorMsg}`);
        message.error(`Duruş başlatılamadı: ${errorMsg}`);
      } else {
        message.error('Duruş başlatılamadı - Beklenmeyen yanıt!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Network hatası';
      alert(`NETWORK HATASI: ${errorMsg}`);
      message.error(`Duruş başlatılamadı (Network): ${errorMsg}`);
    } finally {
      setButtonLoading(null);
    }
  };

  const handleFinishBreak = async () => {
    console.log("handleFinishBreak");

    if (!selectedRow || !selectedRow.confirmation) {
      message.warning('Lütfen önce İş Emirleri tablosundan bir satır seçin!');
      return;
    }

    if (!selectedWorkcenter) {
      message.warning('Lütfen önce bir iş merkezi seçin!');
      return;
    }

    setButtonLoading('finishFailure');
    try {
      const params = {
        workcenterId: selectedWorkcenter,
        PSCONFIRMATION: selectedRow.confirmation,
        POTYPE: selectedRow.poType,
        PRDORDER: selectedRow.prdOrder,
        OPERATION: parseInt(selectedRow.operation),
        BOMLEVEL: parseInt(selectedRow.bomLevel)
      };

      console.log("Duruş bitiriliyor:", params);
      const response = await authAxios.post('/canias/finish-failure', params);
      const result = response.data;
      console.log("Duruş bitirme sonucu:", result);

      if (result.success === "true") {
        updateWorkOrderStatus(selectedRow.confirmation, result.data);
        message.success(`Duruş başarıyla bitirildi!\nİş Merkezi: ${selectedWorkcenter}\nConfirmation: ${selectedRow.confirmation}\nYeni Status: ${result.data}`);
        
        // İş emri listesini yenile
        if (refreshOperations && selectedWorkcenter) {
          console.log('🔄 İş emri listesi yenileniyor...');
          console.log('📞 refreshOperations fonksiyonu çağrılıyor:', typeof refreshOperations);
          setTimeout(() => {
            console.log('⏰ 1 saniye sonra yenileme başlıyor...');
            refreshOperations(selectedWorkcenter);
            console.log('✅ refreshOperations çağrısı tamamlandı');
          }, 1000); // 1 saniye bekle
        } else {
          console.log('❌ refreshOperations fonksiyonu bulunamadı veya selectedWorkcenter yok');
          console.log('refreshOperations:', typeof refreshOperations);
          console.log('selectedWorkcenter:', selectedWorkcenter);
        }
      } else if (result.success === false) {
        const errorMsg = result.error?.message || result.error?.description || result.message || 'Bilinmeyen hata';
        alert(`HATA: ${errorMsg}`);
        message.error(`Duruş bitirilemedi: ${errorMsg}`);
      } else {
        message.error('Duruş bitirilemedi - Beklenmeyen yanıt!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Network hatası';
      alert(`NETWORK HATASI: ${errorMsg}`);
      message.error(`Duruş bitirilemedi (Network): ${errorMsg}`);
    } finally {
      setButtonLoading(null);
    }
  };

  const handleQuickTransaction = async () => {
    console.log("handleQuickTransaction - Başlat Bitir");

    if (!selectedWorkcenter) {
      message.warning('Lütfen önce bir iş merkezi seçin!');
      return;
    }

    if (!selectedRow || !selectedRow.confirmation) {
      message.warning('Lütfen önce İş Emirleri tablosundan bir satır seçin!');
      return;
    }

    setButtonLoading('quickTransaction');
    try {
      const params = {
        workcenterId: selectedWorkcenter,
        PSCONFIRMATION: selectedRow.confirmation,
        POTYPE: selectedRow.poType,
        PRDORDER: selectedRow.prdOrder,
        OPERATION: parseInt(selectedRow.operation),
        BOMLEVEL: parseInt(selectedRow.bomLevel),
        PDCOUTPUT: 1,
        PDCSCRAP: 0
      };

      console.log("Başlat Bitir işlemi yapılıyor:", params);

      const response = await authAxios.post('/canias/quick-transactions', params);
      const result = response.data;
      console.log("Başlat Bitir sonucu:", result);

      if (result.success === "true" || result.success === true) {
        // Başlat Bitir API'si farklı format döndürüyor
        if (result.data && typeof result.data === 'object' && result.data.message) {
          // Success response with message object
          alert(`BAŞARILI: ${result.data.message}`);
          message.success(`Başlat Bitir işlemi başarıyla tamamlandı!\nİş Merkezi: ${selectedWorkcenter}\nConfirmation: ${selectedRow.confirmation}\nMesaj: ${result.data.message}`);

          // Başlat Bitir işlemi sonrası status 1'e dönebilir (varsayılan)
          updateWorkOrderStatus(selectedRow.confirmation, 1);
          
          // İş emri listesini yenile
          if (refreshOperations && selectedWorkcenter) {
            console.log('🔄 İş emri listesi yenileniyor...');
            console.log('📞 refreshOperations fonksiyonu çağrılıyor:', typeof refreshOperations);
            setTimeout(() => {
              console.log('⏰ 1 saniye sonra yenileme başlıyor...');
              refreshOperations(selectedWorkcenter);
              console.log('✅ refreshOperations çağrısı tamamlandı');
            }, 1000); // 1 saniye bekle
          } else {
            console.log('❌ refreshOperations fonksiyonu bulunamadı veya selectedWorkcenter yok');
            console.log('refreshOperations:', typeof refreshOperations);
            console.log('selectedWorkcenter:', selectedWorkcenter);
          }
        } else if (typeof result.data === 'number') {
          // Normal status response (sayı)
          updateWorkOrderStatus(selectedRow.confirmation, result.data);
          alert(`BAŞARILI: İşlem tamamlandı. Yeni Status: ${result.data}`);
          message.success(`Başlat Bitir işlemi başarıyla tamamlandı!\nİş Merkezi: ${selectedWorkcenter}\nConfirmation: ${selectedRow.confirmation}\nYeni Status: ${result.data}`);
          
          // İş emri listesini yenile
          if (refreshOperations && selectedWorkcenter) {
            console.log('🔄 İş emri listesi yenileniyor...');
            console.log('📞 refreshOperations fonksiyonu çağrılıyor:', typeof refreshOperations);
            setTimeout(() => {
              console.log('⏰ 1 saniye sonra yenileme başlıyor...');
              refreshOperations(selectedWorkcenter);
              console.log('✅ refreshOperations çağrısı tamamlandı');
            }, 1000); // 1 saniye bekle
          } else {
            console.log('❌ refreshOperations fonksiyonu bulunamadı veya selectedWorkcenter yok');
            console.log('refreshOperations:', typeof refreshOperations);
            console.log('selectedWorkcenter:', selectedWorkcenter);
          }
        } else {
          // Diğer success durumları
          alert(`BAŞARILI: İşlem tamamlandı.`);
          message.success(`Başlat Bitir işlemi başarıyla tamamlandı!\nİş Merkezi: ${selectedWorkcenter}\nConfirmation: ${selectedRow.confirmation}`);
          // Default status 1
          updateWorkOrderStatus(selectedRow.confirmation, 1);
          
          // İş emri listesini yenile
          if (refreshOperations && selectedWorkcenter) {
            console.log('🔄 İş emri listesi yenileniyor...');
            console.log('📞 refreshOperations fonksiyonu çağrılıyor:', typeof refreshOperations);
            setTimeout(() => {
              console.log('⏰ 1 saniye sonra yenileme başlıyor...');
              refreshOperations(selectedWorkcenter);
              console.log('✅ refreshOperations çağrısı tamamlandı');
            }, 1000); // 1 saniye bekle
          } else {
            console.log('❌ refreshOperations fonksiyonu bulunamadı veya selectedWorkcenter yok');
            console.log('refreshOperations:', typeof refreshOperations);
            console.log('selectedWorkcenter:', selectedWorkcenter);
          }
        }
      } else if (result.success === false) {
        const errorMsg = result.error?.message || result.error?.description || result.message || 'Bilinmeyen hata';
        alert(`HATA: ${errorMsg}`);
        message.error(`Başlat Bitir işlemi başarısız: ${errorMsg}`);
      } else {
        alert(`HATA: Beklenmeyen yanıt formatı!`);
        message.error('Başlat Bitir işlemi başarısız - Beklenmeyen yanıt!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Network hatası';
      alert(`NETWORK HATASI: ${errorMsg}`);
      message.error(`Başlat Bitir işlemi başarısız (Network): ${errorMsg}`);
    } finally {
      setButtonLoading(null);
    }
  };



  const userMenuItems = [
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      onClick: handleLogout,
    },
  ];

  return (
    <>
      {/* İş Merkezi Bilgi Kartı */}
      {selectedWorkcenterInfo && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: isMobile ? '8px 12px' : '12px 24px',
          color: 'white',
          borderBottom: '1px solid #e8e8e8',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <BuildOutlined style={{ fontSize: '20px' }} />
              <div>
                <Title level={5} style={{ 
                  color: 'white', 
                  margin: 0, 
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 'bold'
                }}>
                  {selectedWorkcenterInfo.name} - {selectedWorkcenterInfo.description}
                </Title>
                <Text style={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: isMobile ? '11px' : '12px',
                  display: 'block',
                  marginTop: '2px'
                }}>
                  {selectedWorkcenterInfo.location} • {selectedWorkcenterInfo.responsible || 'Sorumlu: Belirtilmemiş'}
                </Text>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Tag 
                color={selectedWorkcenterInfo.status === 'Aktif' ? 'green' : 'red'}
                style={{ 
                  margin: 0,
                  fontSize: isMobile ? '10px' : '11px',
                  fontWeight: 'bold'
                }}
              >
                {selectedWorkcenterInfo.status}
              </Tag>
              {selectedRow && (
                <Tag 
                  color="blue"
                  style={{ 
                    margin: 0,
                    fontSize: isMobile ? '10px' : '11px',
                    fontWeight: 'bold'
                  }}
                >
                  İş Emri: {selectedRow.confirmation}
                </Tag>
              )}
            </div>
          </div>
        </div>
      )}

      <AntHeader
        style={{
          padding: isMobile ? '0 12px' : '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          minHeight: isMobile ? '56px' : '64px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '16px',
          flexWrap: 'wrap',
          flex: 1,
          minWidth: 0
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggle}
            style={{
              fontSize: '16px',
              width: isMobile ? 48 : 64,
              height: isMobile ? 48 : 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              background: '#fff',
              color: '#666',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f5f5f5';
              e.target.style.borderColor = '#1890ff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#fff';
              e.target.style.borderColor = '#d9d9d9';
            }}
          />
          {isMobile || !collapsed ? (
            // Mobil veya sidebar açıkken: Dropdown menü
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'startProduction',
                    icon: <PlayCircleOutlined style={{
                      color: (selectedRow && selectedWorkcenter && activeButtons.startProduction) ? '#52c41a' : '#bfbfbf'
                    }} />,
                    label: (
                      <span style={{
                        color: (selectedRow && selectedWorkcenter && activeButtons.startProduction) ? '#52c41a' : '#666',
                        fontWeight: (selectedRow && selectedWorkcenter && activeButtons.startProduction) ? '500' : 'normal'
                      }}>
                        Üretim Başlat
                      </span>
                    ),
                    disabled: !selectedRow || !selectedWorkcenter || !activeButtons.startProduction || buttonLoading !== null,
                    onClick: handleStartProduction,
                  },
                  {
                    key: 'finishProduction',
                    icon: <StopOutlined style={{
                      color: (selectedRow && selectedWorkcenter && activeButtons.finishProduction) ? '#ff4d4f' : '#bfbfbf'
                    }} />,
                    label: (
                      <span style={{
                        color: (selectedRow && selectedWorkcenter && activeButtons.finishProduction) ? '#ff4d4f' : '#666',
                        fontWeight: (selectedRow && selectedWorkcenter && activeButtons.finishProduction) ? '500' : 'normal'
                      }}>
                        Üretim Bitir
                      </span>
                    ),
                    disabled: !selectedRow || !selectedWorkcenter || !activeButtons.finishProduction || buttonLoading !== null,
                    onClick: () => setIsEndProductionOpen(true),
                  },
                  {
                    key: 'startIdle',
                    icon: <ClockCircleOutlined style={{
                      color: (selectedRow && selectedWorkcenter && activeButtons.startIdle) ? '#faad14' : '#bfbfbf'
                    }} />,
                    label: (
                      <span style={{
                        color: (selectedRow && selectedWorkcenter && activeButtons.startIdle) ? '#faad14' : '#666',
                        fontWeight: (selectedRow && selectedWorkcenter && activeButtons.startIdle) ? '500' : 'normal'
                      }}>
                        Duruş Başlat
                      </span>
                    ),
                    disabled: !selectedRow || !selectedWorkcenter || !activeButtons.startIdle || buttonLoading !== null,
                    onClick: handleStartBreak,
                  },
                  {
                    key: 'finishFailure',
                    icon: <CheckCircleOutlined style={{
                      color: (selectedRow && selectedWorkcenter && activeButtons.finishFailure) ? '#1890ff' : '#bfbfbf'
                    }} />,
                    label: (
                      <span style={{
                        color: (selectedRow && selectedWorkcenter && activeButtons.finishFailure) ? '#1890ff' : '#666',
                        fontWeight: (selectedRow && selectedWorkcenter && activeButtons.finishFailure) ? '500' : 'normal'
                      }}>
                        Duruş Bitir
                      </span>
                    ),
                    disabled: !selectedRow || !selectedWorkcenter || !activeButtons.finishFailure || buttonLoading !== null,
                    onClick: handleFinishBreak,
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'quickTransaction',
                    icon: <ToolOutlined style={{
                      color: (selectedRow && selectedWorkcenter && activeButtons.quickTransaction) ? '#722ed1' : '#bfbfbf'
                    }} />,
                    label: (
                      <span style={{
                        color: (selectedRow && selectedWorkcenter && activeButtons.quickTransaction) ? '#722ed1' : '#666',
                        fontWeight: (selectedRow && selectedWorkcenter && activeButtons.quickTransaction) ? 'bold' : 'normal'
                      }}>
                        Başlat / Bitir
                      </span>
                    ),
                    disabled: !selectedRow || !selectedWorkcenter || !activeButtons.quickTransaction || buttonLoading !== null,
                    onClick: handleQuickTransaction,
                  },
                ]
              }}
              placement="bottomLeft"
              trigger={['click']}
              overlayStyle={{
                minWidth: '200px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '8px',
              }}
            >
              <Button
                type="primary"
                icon={<SettingOutlined />}
                loading={buttonLoading !== null}
                disabled={!selectedRow || !selectedWorkcenter}
                style={{
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: (selectedRow && selectedWorkcenter) ? '#1890ff' : '#d9d9d9',
                  borderColor: (selectedRow && selectedWorkcenter) ? '#1890ff' : '#d9d9d9',
                }}
              >
                İşlemler {buttonLoading !== null && '...'}
                {selectedRow && selectedWorkcenter && (
                  <span style={{
                    marginLeft: '4px',
                    fontSize: '11px',
                    opacity: 0.8
                  }}>
                    (S:{buttonControl})
                  </span>
                )}
              </Button>
            </Dropdown>
          ) : (
            // Masaüstü ve sidebar kapalıyken: Normal butonlar
            <Space size="small" wrap>
              {/* Üretim Başlat */}
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartProduction}
                loading={buttonLoading === 'startProduction'}
                disabled={!selectedRow || !selectedWorkcenter || !activeButtons.startProduction || buttonLoading !== null}
                size="middle"
                style={{
                  background: (selectedRow && selectedWorkcenter && activeButtons.startProduction) ? '#52c41a' : '#d9d9d9',
                  borderColor: (selectedRow && selectedWorkcenter && activeButtons.startProduction) ? '#52c41a' : '#d9d9d9',
                  height: '36px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '110px',
                }}
              >
                Üretim Başlat
              </Button>

              {/* Üretim Bitir */}
              <Button
                type="primary"
                icon={<StopOutlined />}
                onClick={handleStopProduction}
                loading={buttonLoading === 'finishProduction'}
                disabled={!selectedRow || !selectedWorkcenter || !activeButtons.finishProduction || buttonLoading !== null}
                size="middle"
                style={{
                  background: (selectedRow && selectedWorkcenter && activeButtons.finishProduction) ? '#ff4d4f' : '#d9d9d9',
                  borderColor: (selectedRow && selectedWorkcenter && activeButtons.finishProduction) ? '#ff4d4f' : '#d9d9d9',
                  height: '36px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '110px',
                }}
              >
                Üretim Bitir
              </Button>

              {/* Duruş Başlat */}
              <Button
                type="primary"
                icon={<ClockCircleOutlined />}
                onClick={handleStartBreak}
                loading={buttonLoading === 'startIdle'}
                disabled={!selectedRow || !selectedWorkcenter || !activeButtons.startIdle || buttonLoading !== null}
                size="middle"
                style={{
                  background: (selectedRow && selectedWorkcenter && activeButtons.startIdle) ? '#faad14' : '#d9d9d9',
                  borderColor: (selectedRow && selectedWorkcenter && activeButtons.startIdle) ? '#faad14' : '#d9d9d9',
                  height: '36px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '110px',
                }}
              >
                Duruş Başlat
              </Button>

              {/* Duruş Bitir */}
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleFinishBreak}
                loading={buttonLoading === 'finishFailure'}
                disabled={!selectedRow || !selectedWorkcenter || !activeButtons.finishFailure || buttonLoading !== null}
                size="middle"
                style={{
                  background: (selectedRow && selectedWorkcenter && activeButtons.finishFailure) ? '#1890ff' : '#d9d9d9',
                  borderColor: (selectedRow && selectedWorkcenter && activeButtons.finishFailure) ? '#1890ff' : '#d9d9d9',
                  height: '36px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '110px',
                }}
              >
                Duruş Bitir
              </Button>

              {/* Başlat Bitir (Özel Button) */}
              <Button
                type="primary"
                icon={<ToolOutlined />}
                onClick={handleQuickTransaction}
                loading={buttonLoading === 'quickTransaction'}
                disabled={!selectedRow || !selectedWorkcenter || !activeButtons.quickTransaction || buttonLoading !== null}
                size="middle"
                style={{
                  background: (selectedRow && selectedWorkcenter && activeButtons.quickTransaction) ? '#722ed1' : '#d9d9d9',
                  borderColor: (selectedRow && selectedWorkcenter && activeButtons.quickTransaction) ? '#722ed1' : '#d9d9d9',
                  height: '36px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '110px',
                }}
              >
                Başlat Bitir
              </Button>
            </Space>
          )}
        </div>

        {/* Kullanıcı Menüsü */}
        <Space size={isMobile ? "small" : "middle"}>
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                icon={<UserOutlined />}
                size={isMobile ? "small" : "default"}
              />
            </Space>
          </Dropdown>
        </Space>
      </AntHeader>

      {/* Üretim Bitir Modal */}
      <Modal
        title="Üretim Bitir"
        open={isEndProductionOpen}
        onCancel={() => {
          setIsEndProductionOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Text type="secondary" style={{ fontSize: '14px', marginBottom: '16px', display: 'block' }}>
          İş Emri: {selectedRow?.confirmation} - {selectedRow?.material}
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleEndProductionSubmit}
        >
          <Form.Item
            label="Üretilen Miktar (PDCOUTPUT)"
            name="pdcOutput"
            rules={[
              { required: true, message: 'Lütfen üretilen miktarı girin!' },
              { pattern: /^\d+$/, message: 'Sadece sayı girebilirsiniz!' }
            ]}
          >
            <Input placeholder="Üretilen miktarı girin" type="number" min="0" />
          </Form.Item>

          <Form.Item
            label="Fire Miktarı (PDCSCRAP)"
            name="pdcScrap"
            rules={[
              { required: true, message: 'Lütfen fire miktarını girin!' },
              { pattern: /^\d+$/, message: 'Sadece sayı girebilirsiniz!' }
            ]}
          >
            <Input placeholder="Fire miktarını girin" type="number" min="0" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsEndProductionOpen(false);
                form.resetFields();
              }}>
                İptal
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={buttonLoading === 'finishProduction'}
              >
                Üretimi Bitir
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Header;

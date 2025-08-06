import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const { login, loading, isAuthenticated } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}
      >
        <div>Yükleniyor...</div>
      </div>
    );
  }

  if (isAuthenticated()) {
    console.log('Kullanıcı zaten giriş yapmış, ana sayfaya yönlendiriliyor');
    return <Navigate to={from} replace />;
  }

  const onFinish = async (values) => {
    console.log('Form değerleri:', values.username, values.password);
    setLoginLoading(true);
    
    try {
      const result = await login(values.username, values.password);
      console.log('Login sonucu:', result);
      
      if (result && result.success && result.data) {
        message.success(result.data.message || 'Giriş başarılı!');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
      } else {
        message.error('Giriş yapılamadı!');
      }
    } catch (error) {
      console.error('Login hatası:', error);
      
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || 'Bir hata oluştu';
        
        if (statusCode === 401) {
          message.error('Kullanıcı adı veya şifre hatalı!');
        } else if (statusCode === 500) {
          message.error('Sunucu hatası! Lütfen daha sonra tekrar deneyin.');
        } else {
          message.error(errorMessage);
        }
      } else if (error.request) {
        message.error('Sunucuya ulaşılamıyor! İnternet bağlantınızı kontrol edin.');
      } else {
        message.error('Beklenmeyen bir hata oluştu!');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: 'none',
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <LoginOutlined style={{ fontSize: '32px', color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
            Hoş Geldiniz
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Hesabınıza giriş yapın
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Username gerekli!' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Username"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Şifre gerekli!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Şifreniz"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loginLoading}
              block
              style={{
                height: '48px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
import React, { useState, useEffect } from 'react'
import { Card, Typography, Button, Space } from 'antd'
import { PictureOutlined, CloseOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const Dashboard = ({ imageData, imageNumber, onCloseImage }) => {
  const [imageUrl, setImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)

  useEffect(() => {
    // Global function for receiving image data from Sidebar
    window.setImageData = (imageUrl, number) => {
      console.log('🖼️ Dashboard Image URL alındı:', imageUrl, number)
      
      // Sidebar'dan hazır URL geliyor
      if (imageUrl && typeof imageUrl === 'string') {
        setImageUrl(imageUrl)
        console.log('🖼️ Image URL Dashboard\'a set edildi')
      }
    }

    return () => {
      // Cleanup - blob URL'leri temizle
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl)
        console.log('🖼️ Image URL temizlendi:', imageUrl)
      }
    }
  }, [imageUrl])

  const handleCloseImage = () => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl)
    }
    setImageUrl(null)
  }

  return (
    <div style={{ padding: '16px', height: 'calc(100vh - 112px)' }}>
      {imageUrl ? (
        <>
          <div style={{ marginBottom: '12px' }}>
            <Title level={3} style={{ margin: 0, color: '#666' }}>Resim Görüntüleyici</Title>
          </div>
          <div 
            style={{ 
              height: 'calc(100vh - 160px)',
              width: '100%',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5'
            }}
          >
            <img
              src={imageUrl}
              alt="Görüntülenen Resim"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
              onLoad={() => {
                console.log('🖼️ Image yüklendi')
                setImageLoading(false)
              }}
              onError={(e) => {
                console.error('🖼️ Image yükleme hatası:', e)
                setImageLoading(false)
              }}
            />
            {imageLoading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#666'
              }}>
                Resim yükleniyor...
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <PictureOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
              <Title level={4} type="secondary">Resim Görüntüleyici</Title>
              <Text type="secondary">
                Sidebar'daki resim arama kutusunu kullanarak resim görüntüleyebilirsiniz.
              </Text>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export default Dashboard
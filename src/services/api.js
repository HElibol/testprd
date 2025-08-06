import axios from 'axios';
import { getCookie } from 'cookies-next';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.202:5000/api';

export const authAxios = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor - her istekte session-id header'ını ekle
authAxios.interceptors.request.use(
  (config) => {
    const sessionId = getCookie('sessionId');
    if (sessionId) {
      config.headers['session-id'] = sessionId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hata yönetimi
authAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      import('cookies-next').then(({ deleteCookie }) => {
        deleteCookie('sessionId');
        window.location.href = '/login';
      });
    }
    return Promise.reject(error);
  }
);

export const apiClient = authAxios;

export const caniasAPI = {
  // İş merkezlerini listele
  listWorkcenters: async () => {
    try {
      const response = await authAxios.get('/canias/list-workcenters');
      
      if (response.data && response.data.success === "true" && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          code: response.data.code
        };
      }
      
      return {
        success: false,
        message: 'Veri yapısı hatalı',
        data: []
      };
    } catch (error) {
      console.error('İş merkezi listesi alınırken hata:', error);
      
      let errorMessage = 'İş merkezi verileri alınırken bir hata oluştu';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server hatası: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.';
      }
      
      return {
        success: false,
        message: errorMessage,
        data: []
      };
    }
  },

  // İş merkezi operasyonlarını listele
  listOperations: async (workcenterId) => {
    try {
      if (!workcenterId) {
        return {
          success: false,
          message: 'İş merkezi ID gerekli',
          data: []
        };
      }

      const response = await authAxios.post('/canias/list-operations', {
        workcenterId: workcenterId
      });
      
      console.log('List-operations API Yanıtı:', response.data);
      
      if (response.data && response.data.success === "true" && response.data.data) {
        const operations = response.data.data.TBLRETURN?.ROW || [];
        
        return {
          success: true,
          data: operations,
          code: response.data.code
        };
      }
      
      return {
        success: false,
        message: 'Operasyon verisi bulunamadı',
        data: []
      };
    } catch (error) {
      console.error('Operasyon listesi alınırken hata:', error);
      
      let errorMessage = 'Operasyon verileri alınırken bir hata oluştu';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server hatası: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.';
      }
      
      return {
        success: false,
        message: errorMessage,
        data: []
      };
    }
  },

  // Resim getirme fonksiyonu
  getImage: async (imageName) => {
    try {
      const response = await authAxios.post('/canias/send-pdf-file2', {
        imageName: imageName
      }, {
        responseType: 'blob' // Resim dosyası için blob response
      });
      
      if (response.status === 200) {
        const imageUrl = URL.createObjectURL(response.data);
        return {
          success: true,
          data: imageUrl,
          imageName: imageName
        };
      } else {
        return {
          success: false,
          message: 'Resim yüklenemedi',
          data: null
        };
      }
    } catch (error) {
      console.error('Resim getirme hatası:', error);
      
      let errorMessage = 'Resim getirilemedi';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Resim bulunamadı';
        } else {
          errorMessage = error.response.data?.message || `Server hatası: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.';
      }
      
      return {
        success: false,
        message: errorMessage,
        data: null
      };
    }
  }
};

export default authAxios; 
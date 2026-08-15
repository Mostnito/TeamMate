import { useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

export default function AvatarSlot({ size = 72, userId, imageUrl, onUploaded }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('ไฟล์ต้องมีขนาดไม่เกิน 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    const token = localStorage.getItem('token');

    setIsUploading(true);
    try {
      const res = await axios.post('/api/user/' + userId + '/avatar', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUploaded(res.data.avatarUrl);
      toast.success(res.data.message || 'อัปโหลดรูปโปรไฟล์สำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e) => {
    upload(e.target.files[0]);
    e.target.value = '';
  };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    upload(e.dataTransfer.files[0]);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: imageUrl ? `#F3F4F6 url(${imageUrl}) center/cover no-repeat` : '#F3F4F6',
        border: isDragOver ? '1.5px dashed #2563EB' : '1.5px dashed #D1D5DB',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: size * 0.16,
        textAlign: 'center', cursor: 'pointer', flexShrink: 0, position: 'relative', overflow: 'hidden'
      }}
      title="รูปโปรไฟล์"
    >
      {!imageUrl && !isUploading && 'รูปโปรไฟล์'}
      {isUploading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, color: '#374151' }}>
          กำลังอัปโหลด...
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} style={{ display: 'none' }} />
    </div>
  );
}

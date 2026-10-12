import { useState } from 'react';

export default function MemberAvatar({ member, size = 36 }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
  const initials = ((member.firstName || '').charAt(0) + (member.lastName || '').charAt(0)).toUpperCase() || '?';
  const showImage = member.avatarUrl && member.avatarUrl !== failedUrl;

  return (
    <div title={name} style={{ width: size, height: size, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36, flexShrink: 0, overflow: 'hidden' }}>
      {showImage ? (
        <img src={member.avatarUrl} alt={`รูปโปรไฟล์ของ ${name}`} loading="lazy" onError={() => setFailedUrl(member.avatarUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : <span role="img" aria-label={`รูปโปรไฟล์ของ ${name}`}>{initials}</span>}
    </div>
  );
}

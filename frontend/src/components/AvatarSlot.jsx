export default function AvatarSlot({ size = 72 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', background: '#F3F4F6', border: '1.5px dashed #D1D5DB',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: size * 0.16,
        textAlign: 'center', cursor: 'pointer', flexShrink: 0
      }}
      title="รูปโปรไฟล์"
    >
      รูปโปรไฟล์
    </div>
  );
}

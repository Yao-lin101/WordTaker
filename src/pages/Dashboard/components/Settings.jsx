import { useState, useRef } from 'react'
import ReactCrop from 'react-image-crop'

export default function Settings({ repository, onUpdate }) {
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImage, setCropImage] = useState(null)
  const [crop, setCrop] = useState({
    unit: 'px',
    width: 200,
    height: 200,
    x: 0,
    y: 0
  })
  const [completedCrop, setCompletedCrop] = useState(null)
  const imgRef = useRef(null)

  // 处理图片上传
  const handleImageUpload = (e) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader()
      reader.onload = () => {
        setCropImage(reader.result)
        setShowCropModal(true)
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  // 保存裁剪后的图片
  const handleSaveCover = () => {
    if (!completedCrop || !imgRef.current) return

    const canvas = document.createElement('canvas')
    const image = imgRef.current
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = 500
    canvas.height = 500

    const ctx = canvas.getContext('2d')

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      500,
      500
    )

    const dataUrl = canvas.toDataURL()
    if (window.services.repository.updateRepository(repository.id, {
      cover: dataUrl
    })) {
      onUpdate({
        ...repository,
        cover: dataUrl
      })
    }
    setShowCropModal(false)
    setCropImage(null)
  }

  // 更新仓库设置
  const handleUpdateSettings = (settings) => {
    if (window.services.repository.updateRepository(repository.id, { settings })) {
      onUpdate({
        ...repository,
        settings
      })
    }
  }

  return (
    <div className="settings-section">
      
      <div className="repo-settings">
        <div className="setting-item">
          <label>仓库封面：</label>
          <div className="cover-setting">
            <div className="cover-preview">
              {repository.cover ? (
                <img src={repository.cover} alt="仓库封面" />
              ) : (
                <div className="cover-placeholder">
                  暂无封面
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="cover-upload"
            />
            <label htmlFor="cover-upload" className="upload-btn">
              更换封面
            </label>
          </div>
        </div>

        <div className="setting-item">
          <label>取词模式：</label>
          <select 
            value={repository.settings.pickMode}
            onChange={e => handleUpdateSettings({
              ...repository.settings,
              pickMode: e.target.value
            })}
          >
            <option value="return">取出后放回</option>
            <option value="recycle">取出后移到回收站</option>
          </select>
        </div>

        <div className="setting-item">
          <label>取词顺序：</label>
          <select
            value={repository.settings.pickOrder}
            onChange={e => handleUpdateSettings({
              ...repository.settings,
              pickOrder: e.target.value
            })}
          >
            <option value="random">随机取词</option>
            <option value="sequence">顺序取词</option>
          </select>
        </div>

        <div className="setting-item">
          <label>回收站过期天数：</label>
          <input
            type="number"
            value={repository.settings.recycleExpireDays}
            onChange={e => handleUpdateSettings({
              ...repository.settings,
              recycleExpireDays: parseInt(e.target.value) || 7
            })}
          />
        </div>
      </div>

      {showCropModal && (
        <div className="modal-overlay">
          <div className="crop-modal">
            <div className="modal-header">
              <h3>裁剪封面</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCropModal(false)
                  setCropImage(null)
                }}
              >
                ✕
              </button>
            </div>
            <div className="crop-container">
              <ReactCrop
                crop={crop}
                aspect={1}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={cropImage}
                  style={{ maxHeight: '70vh' }}
                  onLoad={(e) => {
                    const { width, height } = e.currentTarget
                    const size = Math.min(width, height, 400)
                    const x = (width - size) / 2
                    const y = (height - size) / 2
                    setCrop({
                      unit: 'px',
                      width: size,
                      height: size,
                      x,
                      y
                    })
                  }}
                />
              </ReactCrop>
            </div>
            <div className="modal-footer">
              <button onClick={handleSaveCover}>确定</button>
              <button onClick={() => {
                setShowCropModal(false)
                setCropImage(null)
              }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
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

  // 在图片加载时同时设置 crop 和 completedCrop
  const handleImageLoad = (e) => {
    const { width, height } = e.currentTarget
    const size = Math.min(width, height, 400)
    const x = (width - size) / 2
    const y = (height - size) / 2
    const newCrop = {
      unit: 'px',
      width: size,
      height: size,
      x,
      y
    }
    setCrop(newCrop)
    setCompletedCrop(newCrop)  // 同时设置 completedCrop
  }

  // 保存裁剪后的图片
  const handleSaveCover = () => {
    if (!completedCrop || !imgRef.current) {
      console.log('No crop or image ref:', { completedCrop, imgRef: imgRef.current })
      return
    }

    const canvas = document.createElement('canvas')
    const image = imgRef.current
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    console.log('Image dimensions:', {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: image.width,
      height: image.height,
      scaleX,
      scaleY
    })

    // 固定输出尺寸为 500x500
    canvas.width = 500
    canvas.height = 500

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('Failed to get canvas context')
      return
    }

    // 确保画布背景为白色
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 计算实际裁剪区域的尺寸
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY
    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY

    console.log('Crop dimensions:', {
      original: completedCrop,
      scaled: {
        width: cropWidth,
        height: cropHeight,
        x: cropX,
        y: cropY
      }
    })

    try {
      // 使用 drawImage 将裁剪区域缩放到 500x500
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        500,
        500
      )

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      console.log('Generated data URL length:', dataUrl.length)
      
      // 更新仓库封面
      const updateResult = window.services.repository.updateRepository(repository.id, {
        cover: dataUrl
      })
      console.log('Update result:', updateResult)

      if (updateResult) {
        onUpdate({
          ...repository,
          cover: dataUrl
        })
        
        // 关闭裁剪弹窗并清理状态
        setShowCropModal(false)
        setCropImage(null)
        setCompletedCrop(null)
      } else {
        console.log('Failed to update repository')
      }
    } catch (error) {
      console.error('Failed to save cover:', error)
      // 可以在这里添加错误提示
    }
  }

  // 更新仓库设置
  const handleUpdateSettings = (newSettings) => {
    // 如果切换到"取出后放回"模式，强制设置为随机取词
    if (newSettings.pickMode === 'return' && repository.settings.pickMode !== 'return') {
      newSettings = {
        ...newSettings,
        pickOrder: 'random'
      }
    }

    if (window.services.repository.updateRepository(repository.id, { settings: newSettings })) {
      onUpdate({
        ...repository,
        settings: newSettings
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
                <img src={repository.cover} alt={repository.name} />
              ) : (
                <div className="cover-placeholder">
                  {repository.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <label className="upload-btn">
              更换封面
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-item">
            <label>取词模式：</label>
            <select
              value={repository.settings.pickMode}
              onChange={e => handleUpdateSettings({
                ...repository.settings,
                pickMode: e.target.value
              })}
            >
              <option value="recycle">取出后移到回收站</option>
              <option value="return">取出后放回</option>
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
              disabled={repository.settings.pickMode === 'return'}
            >
              <option value="random">随机取词</option>
              <option value="sequence">顺序取词</option>
            </select>
          </div>
        </div>

        <div className="setting-item">
          <label>回收站过期设置：</label>
          <div className="expire-settings">
            <div className="expire-days">
              <input
                type="number"
                value={repository.settings.recycleExpireDays}
                onChange={e => handleUpdateSettings({
                  ...repository.settings,
                  recycleExpireDays: parseInt(e.target.value) || 7,
                  neverExpire: false
                })}
                disabled={repository.settings.neverExpire}
                min="1"
              />
              <span>天</span>
            </div>
            <label className="never-expire">
              <input
                type="checkbox"
                checked={repository.settings.neverExpire}
                onChange={e => handleUpdateSettings({
                  ...repository.settings,
                  neverExpire: e.target.checked
                })}
              />
              永不过期
            </label>
          </div>
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
                  setCompletedCrop(null)
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
                  onLoad={handleImageLoad}
                />
              </ReactCrop>
            </div>
            <div className="modal-footer">
              <button onClick={handleSaveCover}>确定</button>
              <button onClick={() => {
                setShowCropModal(false)
                setCropImage(null)
                setCompletedCrop(null)
              }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
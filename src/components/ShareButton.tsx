'use client'

import { useState } from 'react'
import { trackGrowthEvent } from '@/lib/growth'

interface ShareButtonProps {
  /** 要截图的元素的 ref */
  targetRef?: React.RefObject<HTMLElement | null>
  /** 分享标题 */
  title: string
  /** 产品名称(显示在分享图上) */
  productName: string
  /** 引导文案 */
  cta?: string
  /** 二维码/链接地址(显示在分享图上) */
  link?: string
  className?: string
}

export default function ShareButton({
  targetRef,
  title,
  productName,
  cta = '长按识别二维码，测测你的',
  link,
  className = '',
}: ShareButtonProps) {
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  const handleShare = async () => {
    trackGrowthEvent({
      name: 'share_click',
      page: typeof window !== 'undefined' ? window.location.pathname : '/',
      detail: productName,
    })
    setSharing(true)

    try {
      // 动态导入 html2canvas (已在 package.json 中)
      const html2canvas = (await import('html2canvas')).default

      // 找到目标元素
      const target = targetRef?.current || document.querySelector('.share-target') as HTMLElement
      if (!target) {
        // 回退: 分享文字
        await shareText()
        return
      }

      // 生成截图
      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      // 在底部添加引流水印
      const watermarkCanvas = document.createElement('canvas')
      const padding = 80
      watermarkCanvas.width = canvas.width
      watermarkCanvas.height = canvas.height + padding * 2
      const ctx = watermarkCanvas.getContext('2d')!

      // 背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, watermarkCanvas.width, watermarkCanvas.height)

      // 原图
      ctx.drawImage(canvas, 0, padding / 2)

      // 底部水印
      ctx.fillStyle = 'rgba(15,23,42,0.7)'
      ctx.font = `${Math.max(16, canvas.width / 30)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(
        `🔮 ${productName} | ${cta}`,
        watermarkCanvas.width / 2,
        watermarkCanvas.height - padding / 2 + 10
      )

      // 转为 blob 下载
      watermarkCanvas.toBlob(async (blob) => {
        if (!blob) return

        // 尝试用 Web Share API
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `${productName}-result.png`, { type: 'image/png' })
          const shareData = { title, files: [file] }

          if (navigator.canShare(shareData)) {
            try {
              await navigator.share(shareData)
              setShared(true)
              return
            } catch {
              // 用户取消或不支持，回退到下载
            }
          }
        }

        // 回退: 下载图片
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${productName}-result.png`
        a.click()
        URL.revokeObjectURL(url)
        setShared(true)
      }, 'image/png')
    } catch (err) {
      console.error('Share failed:', err)
      await shareText()
    } finally {
      setSharing(false)
      if (shared) setTimeout(() => setShared(false), 3000)
    }
  }

  const shareText = async () => {
    const text = `${title}\n${cta}\n${link || window.location.href}`
    try {
      await navigator.clipboard.writeText(text)
      setShared(true)
      setTimeout(() => setShared(false), 3000)
    } catch {
      // 回退
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setShared(true)
      setTimeout(() => setShared(false), 3000)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
        shared
          ? 'bg-green-500/20 border border-green-500/30 text-green-400'
          : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50'
      } ${sharing ? 'opacity-50 cursor-wait' : ''} ${className}`}
    >
      {sharing ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          生成中...
        </>
      ) : shared ? (
        <>✅ 已保存到相册</>
      ) : (
        <>📸 生成分享图</>
      )}
    </button>
  )
}

import React, { FC, useRef, useState, useEffect } from 'react'
import { useRetoolState, useRetoolEventCallback } from '@tryretool/custom-component-support'
import { QRCodeCanvas } from 'qrcode.react'
import styles from './QRCodeGenerator.module.css'

type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

/* ── Icons ── */

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 4V2.5A1.5 1.5 0 0 1 5.5 1h6A1.5 1.5 0 0 1 13 2.5v6A1.5 1.5 0 0 1 11.5 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* ── Component ── */

export const QRCodeGenerator: FC = () => {
  const [value] = useRetoolState<string>('value', 'https://retool.com')
  const [size] = useRetoolState<number>('size', 200)
  const [fgColor] = useRetoolState<string>('fgColor', '#000000')
  const [bgColor] = useRetoolState<string>('bgColor', '#FFFFFF')
  const [errorLevel] = useRetoolState<string>('errorLevel', 'M')
  const [logoUrl] = useRetoolState<string>('logoUrl', '')
  const [logoSize] = useRetoolState<number>('logoSize', 20)
  const [title] = useRetoolState<string>('title', '')
  const [, setDataUrl] = useRetoolState<string>('dataUrl', '')
  const _onDownload = useRetoolEventCallback('download')
  const _onCopy = useRetoolEventCallback('copy')

  /* ── Derived values ── */

  const safeValue = value?.trim() || 'https://retool.com'
  const safeSize = Math.max(64, Math.min(512, size || 200))
  const safeErrorLevel = (['L', 'M', 'Q', 'H'].includes((errorLevel || '').toUpperCase())
    ? errorLevel.toUpperCase()
    : 'M') as ErrorLevel
  const safeLogoSize = Math.max(5, Math.min(30, logoSize || 20))
  const logoPixels = Math.round(safeSize * (safeLogoSize / 100))

  /* ── Local state ── */

  const canvasRef = useRef<HTMLDivElement>(null)
  const [localDataUrl, setLocalDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const downloadFilename = `qr-${safeValue.slice(0, 40).replace(/[^a-z0-9]/gi, '-')}.png`

  /* ── Sync data URL whenever QR changes ── */

  useEffect(() => {
    const timeout = setTimeout(() => {
      const canvas = canvasRef.current?.querySelector('canvas')
      if (!canvas) return
      try {
        const url = canvas.toDataURL('image/png')
        setLocalDataUrl(url)
        setDataUrl(url)
      } catch {
        // Cross-origin logo blocks toDataURL — leave previous value
      }
    }, 120)
    return () => clearTimeout(timeout)
  }, [safeValue, safeSize, fgColor, bgColor, safeErrorLevel, logoUrl, safeLogoSize, setDataUrl])

  /* ── Copy value text to clipboard ── */

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(safeValue)
      setCopied(true)
      setCopyError(false)
      _onCopy()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 2000)
    }
  }

  /* ── Logo image settings ── */

  const imageSettings = logoUrl?.trim()
    ? { src: logoUrl.trim(), height: logoPixels, width: logoPixels, excavate: true }
    : undefined

  /* ── Render ── */

  return (
    <div className={styles.root}>
      <div className={styles.card}>

        <div className={styles.qrWrap} ref={canvasRef}>
          <QRCodeCanvas
            value={safeValue}
            size={safeSize}
            fgColor={fgColor || '#000000'}
            bgColor={bgColor || '#FFFFFF'}
            level={safeErrorLevel}
            imageSettings={imageSettings}
            style={{ display: 'block' }}
          />
        </div>

        {title?.trim() && (
          <div className={styles.title}>{title.trim()}</div>
        )}

        <div className={styles.valuePreview} title={safeValue}>
          {safeValue}
        </div>

        <div className={styles.actions}>
          <a
            className={styles.btn}
            href={localDataUrl || undefined}
            download={downloadFilename}
            onClick={() => { if (localDataUrl) _onDownload() }}
            aria-disabled={!localDataUrl}
          >
            <DownloadIcon />
            Download PNG
          </a>

          <button
            className={`${styles.btn} ${copied ? styles.btnSuccess : ''} ${copyError ? styles.btnError : ''}`}
            onClick={handleCopy}
            title="Copy encoded value to clipboard"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied!' : copyError ? 'Failed' : 'Copy value'}
          </button>
        </div>

      </div>
    </div >
  )
}
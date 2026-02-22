'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Clock, CheckCircle, Maximize2, Minimize2, Volume2, VolumeX, ChevronDown } from 'lucide-react'
import { WaiterRecord, Settings } from '@/lib/types'
import { maskName } from '@/lib/utils'
import { toast } from 'sonner'

export function PatientBoard() {
  const [records, setRecords] = useState<WaiterRecord[]>([])
  const [prevRecordIds, setPrevRecordIds] = useState<Set<number>>(new Set())
  const [settings, setSettings] = useState<Settings | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const newRecordIdsRef = useRef<Set<number>>(new Set())

  const playDingSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }, [soundEnabled])

  const fetchRecords = useCallback(async () => {
    try {
      const [recordsRes, settingsRes] = await Promise.all([
        fetch('/api/board/patient'),
        fetch('/api/settings'),
      ])
      const recordsData = await recordsRes.json()
      const settingsData = await settingsRes.json()
      
      const newRecordIds = new Set(recordsData.map((r: WaiterRecord) => r.id))
      const trulyNewRecords = recordsData.filter(
        (r: WaiterRecord) => !prevRecordIds.has(r.id) && !newRecordIdsRef.current.has(r.id)
      )
      
      if (trulyNewRecords.length > 0 && prevRecordIds.size > 0) {
        trulyNewRecords.forEach((r: WaiterRecord) => {
          newRecordIdsRef.current.add(r.id)
        })
        playDingSound()
        toast.success(`${trulyNewRecords.length} new order${trulyNewRecords.length > 1 ? 's' : ''} ready!`, {
          icon: <CheckCircle className="h-4 w-4" />,
        })
      }
      
      setPrevRecordIds(newRecordIds)
      setRecords(recordsData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }, [prevRecordIds, playDingSound])

  useEffect(() => {
    fetchRecords()
    const refreshRate = settings?.patient_board_refresh_rate || 10
    const interval = setInterval(fetchRecords, refreshRate * 1000)
    return () => clearInterval(interval)
  }, [fetchRecords, settings?.patient_board_refresh_rate])

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current) {
        const { scrollHeight, clientHeight } = containerRef.current
        setShowScrollHint(scrollHeight > clientHeight + 100)
      }
    }
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [records])

  useEffect(() => {
    setSoundEnabled(settings?.sound_notifications ?? false)
  }, [settings?.sound_notifications])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(() => {})
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleComplete = async (id: number) => {
    try {
      await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      fetchRecords()
      toast.success('Order marked as picked up')
    } catch (error) {
      console.error('Failed to mark complete:', error)
      toast.error('Failed to mark as picked up')
    }
  }

  const pharmacyName = settings?.pharmacy_name || 'Community Pharmacy'
  const message = settings?.patient_board_message || 'Your order is ready - Please see the pharmacist'
  const fontSize = settings?.display_font_size || 'large'

  const fontSizeClasses = useMemo(() => ({
    small: { title: 'text-4xl', name: 'text-3xl', message: 'text-base' },
    medium: { title: 'text-5xl', name: 'text-4xl', message: 'text-lg' },
    large: { title: 'text-6xl', name: 'text-5xl', message: 'text-xl' },
    'extra-large': { title: 'text-7xl', name: 'text-6xl', message: 'text-2xl' },
  }), [])

  const currentFontSize = fontSizeClasses[fontSize as keyof typeof fontSizeClasses] || fontSizeClasses.large

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-auto"
    >
      <audio 
        ref={audioRef} 
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleE4jCXvLt7eJYkw9MYa5wLfNYGdDOnLPu66ncmJKQn/cv7G0jHRUT1SPtK2qg2ZcX2aIs6mpeW1oZYazqamCa29ocYayqKmCbXJpdImzqKmCb3VzdYq0qamDcnd3d4q1qamDc3h4eIm2qamDdHl5eIm3qamDdXp6eIi4qamDdnt7eIi5qamDeHx8eIe6qamDeX19eIe7qamDen5+eIe8qamDfX9/eIi9qamDgIB/eYm+qamDgYCAeYnAqamDgoGAeIm/qamDg4KBeYq/qamEhIOBeou/qamEhYSBeoy/qamEhYWBeYzAqamEhoWBeI3AqamEh4aBeI3AqamEiIeBeI7AqamEiYiBeI7AqamEiomJeI/AqamEi4mJeI/AqamEjIqJeZDAqamEjYuJeZDAqamDjouJeZHAqamDj4yJeZHBAqamDkI2KeZHBAqamDkY6KeZHBAamnDko+LeZHBAamnDk5DLepHBAamnDk9ELepHBAGlnDlBFLupHBAGlnDlJGLupIBAGlnDlNHLupIBAGlnDlRILupIBAGlnDlVJLupIBAGlnDlZKLupIBAGlnDldLLupIBAGlnDlhMLupIBAGlnDllNLupIBAGlnDlpOLupIBAGlnDltPLupIBAGlnDlxQLupIBAGlnDl1RLupIBAGlnDl5SLupIBAGlnDl9TLupIBAGlnDmBULupIBAGlnDmFVLupIBAGlnDmJWLupIBAGlnDmNXLupIBAGlnDmRYLupIBAGlnDmVZLupIBAGlnDmZaLupIBAGlnDmdbLupIBAGlnDmhcLupIBAGlnDmldLupIBAGlnDmpdLulIBAGlnDmtcLulIBAGlnDmxcLulIBAGlnDm1cLulIBAGlnDm5bLulIBAGlnDm9bLulIBAGlnDnBbLulIBAGlnDnFbLelIBAGlnDnJbLelIBGGlnDnNbLelIBGGlnDnRbLelIBGGlnDnVbLelIBGGlnDnZbLelIBGGlnDndbLelIBGGlnDnhbLelIBGGlnDnlbLelIBGGlnDnpbLelIBGGlnDntbLelIBGGlnDnxbLelIBGGlnDn1bLelIBGGlnDn5bLelIBGGlnDn9bLelIBGGlmDn9bKqlIBGGlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn5bKqlIBGWlmDn1bKqlIBGWlmDnxbKqlIBGWlmDntbKqlIBGWlmDnpbKqlIBGWlmDnlbKqlIBGWlmDnhbKqlIBGWlmDndbKqlIBGWlmDnZbKqlIBGWlmDnVbKqlIBGWlmDnRbKqlIBGWlmDnNbKqlIBGWlmDnJbKqlIBGWlmDnFbKqlIBGWlmDnBbKqlIBGWlmDm9bKqlIBGWlmDm5bKqlIBGWlmDm1bKqlIBGWlmDmxbKqlIBGWlmDmtbKqlIBGWlmDmpbKqlIBGWlmDmdbKqlIBGWlmDmZbKqlIBGWlmDmVbKqlIBGWlmDmRbKqlIBGWlmDmNbKqlIBGWlmDmJbKqlIBGWlmDmFbKqlIBGWlmDmBbKqlIBGWlmDl9bKqlIBGWlmDl5bKqlIBGWlmDl1bKqlIBGWlmDlxbKqlIBGWlmDltbKqlIBGWlmDlpbKqlIBGWlmDllbKqlIBGWlmDlhbKqlIBGWlmDldbKqlIBGWlmDlZbKqlIBGWlmDlVbKqlIBGWlmDlRbKqlIBGWlmDlNbKqlIBGWlmDlJbKqlIBGWlmDlFbKqlIBGWlmDlBbKqlIBGWlmDk9bKqlIBGWlmDk5bKqlIBGWlmDk1bKqlIBGWlmDktbKqlIBGWlmDkpbKqlIBGWlmDklbKqlIBGWlmDkhbKqlIBGWlmDkdbKqlIBGWlmDkZbKqlIBGWlmDkVbKqlIBGWlmDkRbKqlIBGWlmDkNbKqlIBGWlmDkJbKqlIBGWlmDkFbKqlIBGWlmDkBbKqlIBGWlmDj9bKqlIBGWlmDj5bKqlIBGWlmDj1bKqlIBGWlmDjxbKqlIBGWlmDjtbKqlIBGWlmDjpbKqlIBGWlmDjlbKqlIBGWlmDjhbKqlIBGWlmDjdbKqlIBGWlmDjZbKqlIBGWlmDjVbKqlIBGWlmDjRbKqlIBGWlmDjNbKqlIBGWlmDjJbKqlIBGWlmDjFbKqlIBGWlmDjBbKqlIBGWlmDi9bKqlIBGWlmDi5bKqlIBGWlmDi1bKqlIBGWlmDixbKqlIBGWlmDitbKqlIBGWlmDipbKqlIBGWlmDilbKqlIBGWlmDihbKqlIBGWlmDidbKqlIBGWlmDiZbKqlIBGWlmDiVbKqlIBGWlmDiRbKqlIBGWlmDiNbKqlIBGWlmDiJbKqlIBGWlmDiFbKqlIBGWlmDiBbKqlIBGWlmDh9bKqlIBGWlmDh5bKqlIBGWlmDh1bKqlIBGWlmDhxbKqlIBGWlmDhtbKqlIBGWlmDhpbKqlIBGWlmDhlbKqlIBGWlmDhhbKqlIBGWlmDhdbKqlIBGWlmDhZbKqlIBGWlmDhVbKqlIBGWlmDhRbKqlIBGWlmDhNbKqlIBGWlmDhJbKqlIBGWlmDhFbKqlIBGWlmDhBbKqlIBGWlmDg9bKqlIBGWlmDg5bKqlIBGWlmDg1bKqlIBGWlmDgxbKqlIBGWlmDgtbKqlIBGWlmDgpbKqlIBGWlmDglbKqlIBGWlmDghbKqlIBGWlmDgdbKqlIBGWlmDgZbKqlIBGWlmDgVbKqlIBGWlmDgRbKqlIBGWlmDgNbKqlIBGWlmDgJbKqlIBGWlmDgFbKqlIBGWlmDgBbKqlIBGWlmDf9bKqlIBGWlmDf5bKqlIBGWlmDf1bKqlIBGWlmDfxbKqlIBGWlmDftbKqlIBGWlmDfpbKqlIBGWlmDflbKqlIBGWlmDfhbKqlIBGWlmDfdbKqlIBGWlmDfZbKqlIBGWlmDfVbKqlIBGWlmDfRbKqlIBGWlmDfNbKqlIBGWlmDfJbKqlIBGWlmDfFbKqlIBGWlmDfBbKqlIBGWlmDe9bKqlIBGWlmDe5bKqlIBGWlmDe1bKqlIBGWlmDexbKqlIBGWlmDetbKqlIBGWlmDepbKqlIBGWlmDelbKqlIBGWlmDehbKqlIBGWlmDedbKqlIBGWlmDeZbKqlIBGWlmDeVbKqlIBGWlmDeRbKqlIBGWlmDeNbKqlIBGWlmDeJbKqlIBGWlmDeFbKqlIBGWlmDeBbKqlIBGWlmDd9bKqlIBGWlmDd5bKqlIBGWlmDd1bKqlIBGWlmDdxbKqlIBGWlmDdtbKqlIBGWlmDdpbKqlIBGWlmDdlbKqlIBGWlmDdhbKqlIBGWlmDddbKqlIBGWlmDdZbKqlIBGWlmDdVbKqlIBGWlmDdRbKqlIBGWlmDdNbKqlIBGWlmDdJbKqlIBGWlmDdFbKqlIBGWlmDdBbKqlIBGWlmDc9bKqlIBGWlmDc5bKqlIBGWlmDc1bKqlIBGWlmDcxbKqlIBGWlmDctbKqlIBGWlmDcpbKqlIBGWlmDclbKqlIBGWlmDchbKqlIBGWlmDcdbKqlIBGWlmDcZbKqlIBGWlmDcVbKqlIBGWlmDcRbKqlIBGWlmDcNbKqlIBGWlmDcJbKqlIBGWlmDcFbKqlIBGWlmDcBbKqlIBGWlmDb9bKqlIBGWlmDb5bKqlIBGWlmDb1bKqlIBGWlmDbxbKqlIBGWlmDbtbKqlIBGWlmDbpbKqlIBGWlmDblbKqlIBGWlmDbhbKqlIBGWlmDbdbKqlIBGWlmDbZbKqlIBGWlmDbVbKqlIBGWlmDbRbKqlIBGWlmDbNbKqlIBGWlmDbJbKqlIBGWlmDbFbKqlIBGWlmDbBbKqlIBGWlmDa9bKqlIBGWlmDa5bKqlIBGWlmDa1bKqlIBGWlmDaxbKqlIBGWlmDatbKqlIBGWlmDapbKqlIBGWlmDalbKqlIBGWlmDahbKqlIBGWlmDadbKqlIBGWlmDaZbKqlIBGWlmDaVbKqlIBGWlmDaRbKqlIBGWlmDaNbKqlIBGWlmDaJbKqlIBGWlmDaFbKqlIBGWlmDaBbKqlIBGWlmDZ9bKqlIBGWlmDZ5bKqlIBGWlmDZ1bKqlIBGWlmDZxbKqlIBGWlmDZtbKqlIBGWlmDZpbKqlIBGWlmDZlbKqlIBGWlmDZhbKqlIBGWlmDZdbKqlIBGWlmDZZbKqlIBGWlmDZVbKqlIBGWlmDZRbKqlIBGWlmDZNbKqlIBGWlmDZJbKqlIBGWlmDZFbKqlIBGWlmDZBbKqlIBGWlmDY9bKqlIBGWlmDY5bKqlIBGWlmDY1bKqlIBGWlmDYxbKqlIBGWlmDYtbKqlIBGWlmDYpbKqlIBGWlmDYlbKqlIBGWlmDYhbKqlIBGWlmDYdbKqlIBGWlmDYZbKqlIBGWlmDYVbKqlIBGWlmDYRbKqlIBGWlmDYNbKqlIBGWlmDYJbKqlIBGWlmDYFbKqlIBGWlmDYBbKqlIBGWlmDX9bKqlIBGWlmDX5bKqlIBGWlmDX1bKqlIBGWlmDXxbKqlIBGWlmDXtbKqlIBGWlmDXpbKqlIBGWlmDXlbKqlIBGWlmDXhbKqlIBGWlmDXdbKqlIBGWlmDXZbKqlIBGWlmDXVbKqlIBGWlmDXRbKqlIBGWlmDXNbKqlIBGWlmDXJbKqlIBGWlmDXFbKqlIBGWlmDXBbKqlIBGWlmDW9bKqlIBGWlmDW5bKqlIBGWlmDW1bKqlIBGWlmDWxbKqlIBGWlmDWtbKqlIBGWlmDWpbKqlIBGWlmDWlbKqlIBGWlmDWhbKqlIBGWlmDWdbKqlIBGWlmDWZbKqlIBGWlmDWVbKqlIBGWlmDWRbKqlIBGWlmDWNbKqlIBGWlmDWJbKqlIBGWlmDWFbKqlIBGWlmDWBbKqlIBGWlmDV9bKqlIBGWlmDV5bKqlIBGWlmDV1bKqlIBGWlmDVxbKqlIBGWlmDVtbKqlIBGWlmDVpbKqlIBGWlmDVlbKqlIBGWlmDVhbKqlIBGWlmDVdbKqlIBGWlmDVZbKqlIBGWlmDVVbKqlIBGWlmDVRbKqlIBGWlmDVNbKqlIBGWlmDVJbKqlIBGWlmDVFbKqlIBGWlmDVBbKqlIBGWlmDU9bKqlIBGWlmDU5bKqlIBGWlmDU1bKqlIBGWlmDUxbKqlIBGWlmDUtbKqlIBGWlmDUpbKqlIBGWlmDUlbKqlIBGWlmDUhbKqlIBGWlmDUdbKqlIBGWlmDUZbKqlIBGWlmDUVbKqlIBGWlmDURbKqlIBGWlmDUNbKqlIBGWlmDUJbKqlIBGWlmDUFbKqlIBGWlmDUBbKqlIBGWlmDT9bKqlIBGWlmDT5bKqlIBGWlmDT1bKqlIBGWlmDTxbKqlIBGWlmDTtbKqlIBGWlmDTpbKqlIBGWlmDTlbKqlIBGWlmDThbKqlIBGWlmDTdbKqlIBGWlmDTZbKqlIBGWlmDTVbKqlIBGWlmDTRbKqlIBGWlmDTNbKqlIBGWlmDTJbKqlIBGWlmDTFbKqlIBGWlmDTBbKqlIBGWlmDS9bKqlIBGWlmDS5bKqlIBGWlmDS1bKqlIBGWlmDSxbKqlIBGWlmDStbKqlIBGWlmDSpbKqlIBGWlmDSlbKqlIBGWlmDShbKqlIBGWlmDSdbKqlIBGWlmDSZbKqlIBGWlmDSVbKqlIBGWlmDSRbKqlIBGWlmDSNbKqlIBGWlmDSJbKqlIBGWlmDSFbKqlIBGWlmDSBbKqlIBGWlmDR9bKqlIBGWlmDR5bKqlIBGWlmDR1bKqlIBGWlmDRxbKqlIBGWlmDRtbKqlIBGWlmDRpbKqlIBGWlmDRlbKqlIBGWlmDRhbKqlIBGWlmDRdbKqlIBGWlmDRZbKqlIBGWlmDRVbKqlIBGWlmDRRbKqlIBGWlmDRNbKqlIBGWlmDRJbKqlIBGWlmDRFbKqlIBGWlmDRBbKqlIBGWlmDQ9bKqlIBGWlmDQ5bKqlIBGWlmDQ1bKqlIBGWlmDQxbKqlIBGWlmDQtbKqlIBGWlmDQpbKqlIBGWlmDQlbKqlIBGWlmDQhbKqlIBGWlmDQdbKqlIBGWlmDQZbKqlIBGWlmDQVbKqlIBGWlmDQRbKqlIBGWlmDQNbKqlIBGWlmDQJbKqlIBGWlmDQFbKqlIBGWlmDQBbKqlIBGWlmDP9bKqlIBGWlmDP5bKqlIBGWlmDP1bKqlIBGWlmDPxbKqlIBGWlmDPtbKqlIBGWlmDPpbKqlIBGWlmDPlbKqlIBGWlmDPhbKqlIBGWlmDPdbKqlIBGWlmDPZbKqlIBGWlmDPVbKqlIBGWlmDPRbKqlIBGWlmDPNbKqlIBGWlmDPJbKqlIBGWlmDPFbKqlIBGWlmDPBbKqlIBGWlmDO9bKqlIBGWlmDO5bKqlIBGWlmDO1bKqlIBGWlmDOxbKqlIBGWlmDOtbKqlIBGWlmDOpbKqlIBGWlmDOlbKqlIBGWlmDPhbKqlIBGWlmDOhbKqlIBGWlmDOdbKqlIBGWlmDOZbKqlIBGWlmDOVbKqlIBGWlmDORbKqlIBGWlmDONbKqlIBGWlmDOJbKqlIBGWlmDOFbKqlIBGWlmDOBbKqlIBGWlmDN9bKqlIBGWlmDN5bKqlIBGWlmDN1bKqlIBGWlmDNxbKqlIBGWlmDNtbKqlIBGWlmDNpbKqlIBGWlmDNlbKqlIBGWlmDNhbKqlIBGWlmDNdbKqlIBGWlmDNZbKqlIBGWlmDNVbKqlIBGWlmDNRbKqlIBGWlmDNNbKqlIBGWlmDNJbKqlIBGWlmDNFbKqlIBGWlmDNBbKqlIBGWlmDM9bKqlIBGWlmDM5bKqlIBGWlmDM1bKqlIBGWlmDMxbKqlIBGWlmDMtbKqlIBGWlmDMpbKqlIBGWlmDMlbKqlIBGWlmDMhbKqlIBGWlmDMdbKqlIBGWlmDMZbKqlIBGWlmDMVbKqlIBGWlmDMRbKqlIBGWlmDMNbKqlIBGWlmDMJbKqlIBGWlmDMFbKqlIBGWlmDMBbKqlIBGWlmDL9bKqlIBGWlmDL5bKqlIBGWlmDL1bKqlIBGWlmDLxbKqlIBGWlmDLtbKqlIBGWlmDLpbKqlIBGWlmDLlbKqlIBGWlmDLhbKqlIBGWlmDLdbKqlIBGWlmDLZbKqlIBGWlmDLVbKqlIBGWlmDLRbKqlIBGWlmDLNbKqlIBGWlmDLJbKqlIBGWlmDLFbKqlIBGWlmDLBbKqlIBGWlmDK9bKqlIBGWlmDK5bKqlIBGWlmDK1bKqlIBGWlmDKxbKqlIBGWlmDKtbKqlIBGWlmDKpbKqlIBGWlmDKlbKqlIBGWlmDKhbKqlIBGWlmDKdbKqlIBGWlmDKZbKqlIBGWlmDKVbKqlIBGWlmDKRbKqlIBGWlmDKNbKqlIBGWlmDKJbKqlIBGWlmDKFbKqlIBGWlmDKBbKqlIBGWlmDJ9bKqlIBGWlmDJ5bKqlIBGWlmDJ1bKqlIBGWlmDJxbKqlIBGWlmDJtbKqlIBGWlmDJpbKqlIBGWlmDJlbKqlIBGWlmDJhbKqlIBGWlmDJdbKqlIBGWlmDJZbKqlIBGWlmDJVbKqlIBGWlmDJRbKqlIBGWlmDJNbKqlIBGWlmDJJbKqlIBGWlmDJFbKqlIBGWlmDJBbKqlIBGWlmDI9bKqlIBGWlmDI5bKqlIBGWlmDI1bKqlIBGWlmDIxbKqlIBGWlmDItbKqlIBGWlmDIpbKqlIBGWlmDIlbKqlIBGWlmDIhbKqlIBGWlmDIdbKqlIBGWlmDIZbKqlIBGWlmDIVbKqlIBGWlmDIRbKqlIBGWlmDINbKqlIBGWlmDIJbKqlIBGWlmDIFbKqlIBGWlmDIBbKqlIBGWlmDH9bKqlIBGWlmDH5bKqlIBGWlmDH1bKqlIBGWlmDHxbKqlIBGWlmDHtbKqlIBGWlmDHpbKqlIBGWlmDHlbKqlIBGWlmDHhbKqlIBGWlmDHdbKqlIBGWlmDHZbKqlIBGWlmDHVbKqlIBGWlmDHRbKqlIBGWlmDHNbKqlIBGWlmDHJbKqlIBGWlmDHFbKqlIBGWlmDHBbKqlIBGWlmDG9bKqlIBGWlmDG5bKqlIBGWlmDG1bKqlIBGWlmDGxbKqlIBGWlmDGtbKqlIBGWlmDGpbKqlIBGWlmDGlbKqlIBGWlmDGhbKqlIBGWlmDGdbKqlIBGWlmDGZbKqlIBGWlmDGVbKqlIBGWlmDGRbKqlIBGWlmDGNbKqlIBGWlmDGJbKqlIBGWlmDGFbKqlIBGWlmDGBbKqlIBGWlmDF9bKqlIBGWlmDF5bKqlIBGWlmDF1bKqlIBGWlmDFxbKqlIBGWlmDFtbKqlIBGWlmDFpbKqlIBGWlmDFlbKqlIBGWlmDFhbKqlIBGWlmDFdbKqlIBGWlmDFZbKqlIBGWlmDFVbKqlIBGWlmDFRbKqlIBGWlmDFNbKqlIBGWlmDFJbKqlIBGWlmDFFbKqlIBGWlmDFBbKqlIBGWlmDE9bKqlIBGWlmDE5bKqlIBGWlmDE1bKqlIBGWlmDExbKqlIBGWlmDEtbKqlIBGWlmDEpbKqlIBGWlmDElbKqlIBGWlmDEhbKqlIBGWlmDEdbKqlIBGWlmDEZbKqlIBGWlmDEVbKqlIBGWlmDERbKqlIBGWlmDENbKqlIBGWlmDEJbKqlIBGWlmDEFbKqlIBGWlmDEBbKqlIBGWlmDD9bKqlIBGWlmDD5bKqlIBGWlmDD1bKqlIBGWlmDDxbKqlIBGWlmDDtbKqlIBGWlmDDpbKqlIBGWlmDDlbKqlIBGWlmDDhbKqlIBGWlmDDdbKqlIBGWlmDDZbKqlIBGWlmDDVbKqlIBGWlmDDRbKqlIBGWlmDDNbKqlIBGWlmDDJbKqlIBGWlmDDFbKqlIBGWlmDDBbKqlIBGWlmDC9bKqlIBGWlmDC5bKqlIBGWlmDC1bKqlIBGWlmDCxbKqlIBGWlmDCtbKqlIBGWlmDCpbKqlIBGWlmDClbKqlIBGWlmDChbKqlIBGWlmDCdbKqlIBGWlmDCZbKqlIBGWlmDCVbKqlIBGWlmDCRbKqlIBGWlmDCNbKqlIBGWlmDCJbKqlIBGWlmDCFbKqlIBGWlmDCBbKqlIBGWlmDB9bKqlIBGWlmDB5bKqlIBGWlmDB1bKqlIBGWlmDBxbKqlIBGWlmDBtbKqlIBGWlmDBpbKqlIBGWlmDBlbKqlIBGWlmDBhbKqlIBGWlmDBdbKqlIBGWlmDBZbKqlIBGWlmDBVbKqlIBGWlmDBRbKqlIBGWlmDBNbKqlIBGWlmDBJbKqlIBGWlmDBFbKqlIBGWlmDBBbKqlIBGWlmDA9bKqlIBGWlmDA5bKqlIBGWlmDA1bKqlIBGWlmDAxbKqlIBGWlmDAtbKqlIBGWlmDApbKqlIBGWlmDAlbKqlIBGWlmDAhbKqlIBGWlmDAdbKqlIBGWlmDAZbKqlIBGWlmDAVbKqlIBGWlmDARbKqlIBGWlmDANbKqlIBGWlmDAJbKqlIBGWlmDAFbKqlIBGWlmDABbKqlIBGWlmC/9bKqlIBGWlmC/5bKqlIBGWlmC/1bKqlIBGWlmC/xbKqlIBGWlmC/tbKqlIBGWlmC/pbKqlIBGWlmC/lbKqlIBGWlmC/hbKqlIBGWlmC/dbKqlIBGWlmC/ZbKqlIBGWlmC/VbKqlIBGWlmC/RbKqlIBGWlmC/NbKqlIBGWlmC/JbKqlIBGWlmC/FbKqlIBGWlmC/BbKqlIBGWlmC+9bKqlIBGWlmC+5bKqlIBGWlmC+1bKqlIBGWlmC+xbKqlIBGWlmC+tbKqlIBGWlmC+pbKqlIBGWlmC+lbKqlIBGWlmC+hbKqlIBGWlmC+dbKqlIBGWlmC+ZbKqlIBGWlmC+VbKqlIBGWlmC+RbKqlIBGWlmC+NbKqlIBGWlmC+JbKqlIBGWlmC+FbKqlIBGWlmC+BbKqlIBGWlmC99bKqlIBGWlmC95bKqlIBGWlmC91bKqlIBGWlmC9xbKqlIBGWlmC9tbKqlIBGWlmC9pbKqlIBGWlmC9lbKqlIBGWlmC9hbKqlIBGWlmC9dbKqlIBGWlmC9ZbKqlIBGWlmC9VbKqlIBGWlmC9RbKqlIBGWlmC9NbKqlIBGWlmC9JbKqlIBGWlmC9FbKqlIBGWlmC9BbKqlIBGWlmC89bKqlIBGWlmC85bKqlIBGWlmC81bKqlIBGWlmC8xbKqlIBGWlmC8tbKqlIBGWlmC8pbKqlIBGWlmC8lbKqlIBGWlmC8hbKqlIBGWlmC8dbKqlIBGWlmC8ZbKqlIBGWlmC8VbKqlIBGWlmC8RbKqlIBGWlmC8NbKqlIBGWlmC8JbKqlIBGWlmC8FbKqlIBGWlmC8BbKqlIBA==" 
        preload="auto"
      />

      <div className="mx-auto max-w-7xl px-8 py-8">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center relative"
        >
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </motion.button>
          </div>

          <h1 className={`font-bold text-white ${currentFontSize.title}`}>
            {pharmacyName}
          </h1>
          
          <motion.div 
            className="mt-6 flex items-center justify-center gap-6 text-2xl text-slate-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-full px-6 py-3">
              <Clock className="h-7 w-7 text-accent-400" />
              <span className="font-mono tabular-nums">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <span className="text-slate-500">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </motion.div>
        </motion.header>

        {records.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-96 flex-col items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.7, 0.5]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: 'easeInOut'
              }}
            >
              <Bell className="h-32 w-32 text-slate-600" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-4xl font-light text-slate-400"
            >
              No orders ready for pickup
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-3 text-xl text-slate-500"
            >
              Please wait for your name to be called
            </motion.p>
          </motion.div>
        ) : (
          <>
            <motion.div 
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              <AnimatePresence mode="popLayout">
                {records.map((record, index) => (
                  <motion.div
                    key={record.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, scale: 0.8, y: 50 },
                      visible: { 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        transition: {
                          type: 'spring',
                          stiffness: 260,
                          damping: 20
                        }
                      }
                    }}
                    exit={{ opacity: 0, scale: 0.8, y: -50 }}
                    className="group relative"
                  >
                    <motion.div
                      className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-8 shadow-2xl relative"
                      animate={{ 
                        boxShadow: [
                          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                          '0 25px 50px -12px rgba(20, 184, 166, 0.3)',
                          '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        ]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 2,
                        ease: 'easeInOut'
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
                      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
                      <div className="absolute top-4 right-4 h-16 w-16 rounded-full bg-white/5" />
                      
                      <div className="relative">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 2.5,
                            ease: 'easeInOut'
                          }}
                          className="mb-4 inline-block"
                        >
                          <div className="relative">
                            <CheckCircle className="h-14 w-14 text-white/90" />
                            <motion.div
                              className="absolute inset-0 rounded-full bg-white/30"
                              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                          </div>
                        </motion.div>
                        
                        <h2 className={`font-bold text-white ${currentFontSize.name}`}>
                          {maskName(record.first_name, record.last_name)}
                        </h2>
                        
                        <p className="mt-4 text-xl text-white/80">
                          {record.num_prescriptions} {record.num_prescriptions === 1 ? 'Prescription' : 'Prescriptions'}
                        </p>
                        
                        <motion.div 
                          className="mt-6 rounded-xl bg-white/20 p-4 backdrop-blur-sm"
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                        >
                          <p className={`text-center font-medium text-white ${currentFontSize.message}`}>
                            {message}
                          </p>
                        </motion.div>
                        
                        <motion.button
                          onClick={() => handleComplete(record.id)}
                          className="mt-4 w-full rounded-xl bg-white/10 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/25 hover:text-white backdrop-blur-sm"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Mark as Picked Up
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {showScrollHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-8"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex flex-col items-center text-slate-500"
                >
                  <ChevronDown className="h-6 w-6" />
                  <span className="text-sm">Scroll for more</span>
                </motion.div>
              </motion.div>
            )}
          </>
        )}

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-800/50 px-6 py-3 text-slate-400 backdrop-blur-sm">
            <motion.span 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50" 
            />
            <span>Auto-refreshing every {settings?.patient_board_refresh_rate || 10} seconds</span>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}

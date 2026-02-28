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
      
      const newRecordIds = new Set<number>(recordsData.map((r: WaiterRecord) => r.id))
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
    let scrollInterval: NodeJS.Timeout
    let direction = 1
    
    const startAutoScroll = () => {
      if (!containerRef.current || !showScrollHint) return
      
      scrollInterval = setInterval(() => {
        if (!containerRef.current) return
        
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        
        if (direction === 1 && scrollTop + clientHeight >= scrollHeight - 10) {
          direction = -1
          setTimeout(() => {}, 2000) // Pause at bottom
        } else if (direction === -1 && scrollTop <= 0) {
          direction = 1
          setTimeout(() => {}, 2000) // Pause at top
        } else {
          containerRef.current.scrollBy({ top: direction * 1, behavior: 'smooth' })
        }
      }, 50)
    }

    if (showScrollHint) {
      // Start scrolling after a short delay
      const timeout = setTimeout(startAutoScroll, 3000)
      return () => {
        clearTimeout(timeout)
        clearInterval(scrollInterval)
      }
    }
  }, [showScrollHint])

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

  const pharmacyName = settings?.pharmacy_name || 'Community Pharmacy'
  const message = settings?.patient_board_message || 'Your order is ready - Please see the pharmacist'
  const fontSize = settings?.display_font_size || 'large'

  const fontSizeClasses = useMemo(() => ({
    small: { title: 'text-5xl', name: 'text-5xl', message: 'text-xl', clock: 'text-6xl', date: 'text-2xl' },
    medium: { title: 'text-6xl', name: 'text-6xl', message: 'text-2xl', clock: 'text-7xl', date: 'text-3xl' },
    large: { title: 'text-7xl', name: 'text-7xl', message: 'text-3xl', clock: 'text-8xl', date: 'text-4xl' },
    'extra-large': { title: 'text-8xl', name: 'text-8xl', message: 'text-4xl', clock: 'text-9xl', date: 'text-5xl' },
  }), [])

  const currentFontSize = fontSizeClasses[fontSize as keyof typeof fontSizeClasses] || fontSizeClasses.large

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1c] to-black overflow-auto"
    >
      <audio 
        ref={audioRef} 
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleE4jCXvLt7eJYkw9MYa5wLfNYGdDOnLPu66ncmJKQn/cv7G0jHRUT1SPtK2qg2ZcX2aIs6mpeW1oZYazqamCa29ocYayqKmCbXJpdImzqKmCb3VzdYq0qamDcnd3d4q1qamDc3h4eIm2qamDdHl5eIm3qamDdXp6eIi4qamDdnt7eIi5qamDeHx8eIe6qamDeX19eIe7qamDen5+eIe8qamDfX9/eIi9qamDgIB/eYm+qamDgYCAeYnAqamDgoGAeIm/qamDg4KBeYq/qamEhIOBeou/qamEhYSBeoy/qamEhYWBeYzAqamEhoWBeI3AqamEh4aBeI3AqamEiIeBeI7AqamEiYiBeI7AqamEiomJeI/AqamEi4mJeI/AqamEjIqJeZDAqamEjYuJeZDAqamDjouJeZHAqamDj4yJeZHBAqamDkI2KeZHBAqamDkY6KeZHBAamnDko+LeZHBAamnDk5DLepHBAamnDk9ELepHBAGlnDlBFLupHBAGlnDlJGLupIBAGlnDlNHLupIBAGlnDlRILupIBAGlnDlVJLupIBAGlnDlZKLupIBAGlnDldLLupIBAGlnDlhMLupIBAGlnDllNLupIBAGlnDlpOLupIBAGlnDltPLupIBAGlnDlxQLupIBAGlnDl1RLupIBAGlnDl5SLupIBAGlnDl9TLupIBAGlnDmBULupIBAGlnDmFVLupIBAGlnDmJWLupIBAGlnDmNXLupIBAGlnDmRYLupIBAGlnDmVZLupIBAGlnDmZaLupIBAGlnDmdbLupIBAGlnDmhcLupIBAGlnDmldLupIBAGlnDmpdLulIBAGlnDmtcLulIBAGlnDmxcLulIBAGlnDm1cLulIBAGlnDm5bLulIBAGlnDm9bLulIBAGlnDnBbLulIBAGlnDnFbLelIBAGlnDnJbLelIBGGlnDnNbLelIBGGlnDnRbLelIBGGlnDnVbLelIBGGlnDnZbLelIBGGlnDndbLelIBGGlnDnhbLelIBGGlnDnlbLelIBGGlnDnpbLelIBGGlnDntbLelIBGGlnDnxbLelIBGGlnDn1bLelIBGGlnDn5bLelIBGGlnDn9bLelIBGGlmDn9bKqlIBGGlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn9bKqlIBGWlmDn5bKqlIBGWlmDn1bKqlIBGWlmDnxbKqlIBGWlmDntbKqlIBGWlmDnpbKqlIBGWlmDnlbKqlIBGWlmDnhbKqlIBGWlmDndbKqlIBGWlmDnZbKqlIBGWlmDnVbKqlIBGWlmDnRbKqlIBGWlmDnNbKqlIBGWlmDnJbKqlIBGWlmDnFbKqlIBGWlmDnBbKqlIBGWlmDm9bKqlIBGWlmDm5bKqlIBGWlmDm1bKqlIBGWlmDmxbKqlIBGWlmDmtbKqlIBGWlmDmpbKqlIBGWlmDmdbKqlIBGWlmDmZbKqlIBGWlmDmVbKqlIBGWlmDmRbKqlIBGWlmDmNbKqlIBGWlmDmJbKqlIBGWlmDmFbKqlIBGWlmDmBbKqlIBGWlmDl9bKqlIBGWlmDl5bKqlIBGWlmDl1bKqlIBGWlmDlxbKqlIBGWlmDltbKqlIBGWlmDlpbKqlIBGWlmDllbKqlIBGWlmDlhbKqlIBGWlmDldbKqlIBGWlmDlZbKqlIBGWlmDlVbKqlIBGWlmDlRbKqlIBGWlmDlNbKqlIBGWlmDlJbKqlIBGWlmDlFbKqlIBGWlmDlBbKqlIBGWlmDk9bKqlIBGWlmDk5bKqlIBGWlmDk1bKqlIBGWlmDktbKqlIBGWlmDkpbKqlIBGWlmDklbKql"
        preload="auto"
      />

      <div className="mx-auto w-full max-w-[1400px] px-8 py-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 flex flex-col items-center relative"
        >
          <div className="absolute right-0 top-0 flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-xl p-3 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700 backdrop-blur-sm"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="rounded-xl p-3 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700 backdrop-blur-sm"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
            </motion.button>
          </div>

          <h1 className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300 ${currentFontSize.title}`}>
            {pharmacyName}
          </h1>
          
          <motion.div 
            className="mt-8 flex flex-col items-center justify-center gap-2 text-slate-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col items-center bg-slate-900/60 border border-slate-800/60 rounded-[3rem] px-12 py-6 backdrop-blur-xl shadow-2xl">
              <span className={`font-mono font-bold tracking-wider tabular-nums text-teal-300 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)] ${currentFontSize.clock}`}>
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`mt-2 font-medium text-slate-400 ${currentFontSize.date}`}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </motion.div>
        </motion.header>

        {records.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-[50vh] flex-col items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4,
                ease: 'easeInOut'
              }}
            >
              <Bell className="h-40 w-40 text-slate-700" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`mt-12 font-light text-slate-400 ${currentFontSize.name}`}
            >
              No orders ready for pickup
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`mt-4 text-slate-500 ${currentFontSize.message}`}
            >
              Please wait for your name to be called
            </motion.p>
          </motion.div>
        ) : (
          <>
            <motion.div 
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15 }
                }
              }}
            >
              <AnimatePresence mode="popLayout">
                {records.map((record) => (
                  <motion.div
                    key={record.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, scale: 0.8, y: 40 },
                      visible: { 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        transition: {
                          type: 'spring',
                          stiffness: 200,
                          damping: 20
                        }
                      }
                    }}
                    exit={{ opacity: 0, scale: 0.8, y: -40 }}
                  >
                    <motion.div
                      className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-700 p-10 shadow-2xl"
                      animate={{ 
                        boxShadow: [
                          '0 20px 40px -10px rgba(0, 0, 0, 0.4)',
                          '0 20px 40px -10px rgba(45, 212, 191, 0.4)',
                          '0 20px 40px -10px rgba(0, 0, 0, 0.4)'
                        ]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 3,
                        ease: 'easeInOut'
                      }}
                    >
                      {/* Pulsing ring background */}
                      <motion.div 
                        className="absolute inset-0 rounded-[2.5rem] border-[4px] border-white/20 pointer-events-none"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          ease: "easeInOut"
                        }}
                      />

                      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-black/10 blur-2xl" />
                      
                      <div className="relative text-center z-10">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 2,
                            ease: 'easeInOut'
                          }}
                          className="mb-6 inline-block"
                        >
                          <div className="relative">
                            <CheckCircle className="h-20 w-20 text-white drop-shadow-md" />
                            <motion.div
                              className="absolute inset-0 rounded-full bg-white/40"
                              animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            />
                          </div>
                        </motion.div>
                        
                        <h2 className={`font-black tracking-tight text-white drop-shadow-lg ${currentFontSize.name}`}>
                          {maskName(record.first_name, record.last_name)}
                        </h2>
                        
                        <p className={`mt-4 font-medium text-teal-100 ${currentFontSize.message}`}>
                          {record.num_prescriptions} {record.num_prescriptions === 1 ? 'Prescription' : 'Prescriptions'}
                        </p>
                        
                        <motion.div 
                          className="mt-8 rounded-2xl bg-black/20 p-5 backdrop-blur-md border border-white/10 shadow-inner"
                        >
                          <p className={`text-center font-semibold text-white/90 ${currentFontSize.message}`}>
                            {message}
                          </p>
                        </motion.div>
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
                className="flex justify-center mt-12"
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex flex-col items-center text-slate-500 bg-slate-900/50 px-6 py-3 rounded-full backdrop-blur-sm border border-slate-800"
                >
                  <ChevronDown className="h-8 w-8" />
                  <span className="text-base font-medium mt-1">Scroll for more</span>
                </motion.div>
              </motion.div>
            )}
          </>
        )}

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 pb-8 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-900/80 px-8 py-4 text-slate-400 backdrop-blur-md border border-slate-800/80">
            <motion.span 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" 
            />
            <span className="font-medium text-lg tracking-wide">Auto-refreshing every {settings?.patient_board_refresh_rate || 10} seconds</span>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}

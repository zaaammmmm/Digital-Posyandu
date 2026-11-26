import { createContext, useCallback, useContext, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'

const Ctx = createContext({ go: () => {} })
export const useNav = () => useContext(Ctx)

const ease = [0.76, 0, 0.24, 1]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Transisi halaman: dua lapis layar naik dari bawah (sisi lurus), menutup halaman penuh,
 * rute berganti, lalu layar terus naik ke atas dan membuka halaman baru.
 */
export function TransitionProvider({ children }) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const a = useAnimationControls() // lapis gelap
  const b = useAnimationControls() // lapis utama
  const t = useAnimationControls() // wordmark
  const busy = useRef(false)

  const go = useCallback(
    async (to, afterNav) => {
      if (busy.current || to === pathname + search) return
      busy.current = true
      try {
      await Promise.all([
        a.start({ y: '0%', transition: { duration: 0.6, ease } }),
        b.start({ y: '0%', transition: { duration: 0.6, ease, delay: 0.12 } }),
        t.start({ opacity: 1, y: 0, transition: { delay: 0.55, duration: 0.35 } }),
      ])
      navigate(to)
      afterNav?.()
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      await sleep(260)
      await Promise.all([
        t.start({ opacity: 0, transition: { duration: 0.2 } }),
        b.start({ y: '-100%', transition: { duration: 0.6, ease } }),
        a.start({ y: '-100%', transition: { duration: 0.6, ease, delay: 0.12 } }),
      ])
      a.set({ y: '100%' })
      b.set({ y: '100%' })
      t.set({ y: 14 })
      } finally {
        a.set({ y: '100%' })
        b.set({ y: '100%' })
        busy.current = false
      }
    },
    [pathname, search, navigate, a, b, t]
  )

  return (
    <Ctx.Provider value={{ go }}>
      {children}
      <div className="curtain" aria-hidden="true">
        <motion.div className="curtain-layer curtain-a" initial={{ y: '100%' }} animate={a} />
        <motion.div className="curtain-layer curtain-b" initial={{ y: '100%' }} animate={b}>
          <motion.div className="curtain-word" initial={{ opacity: 0, y: 14 }} animate={t}>
            <svg viewBox="0 0 64 64" width="44" height="44">
              <path d="M32 50S14 40 14 27a9.5 9.5 0 0 1 18-4.4A9.5 9.5 0 0 1 50 27c0 13-18 23-18 23z" fill="#fff" />
            </svg>
            <span>Posify</span>
          </motion.div>
        </motion.div>
      </div>
    </Ctx.Provider>
  )
}

/** Link dengan transisi tirai (default) atau transisi lembut (soft) */
export function TLink({ to, soft = false, onClick, onNavigate, children, ...rest }) {
  const { go } = useNav()
  const navigate = useNavigate()
  return (
    <a
      href={to}
      {...rest}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        onClick?.(e)
        if (soft) { navigate(to); onNavigate?.() } else go(to, onNavigate)
      }}
    >
      {children}
    </a>
  )
}

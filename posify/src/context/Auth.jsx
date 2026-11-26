import { createContext, useCallback, useContext, useState } from 'react'
import { Navigate } from 'react-router-dom'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export const ROLES = {
  parent: { label: 'Orang Tua', home: '/ortu', person: 'Bu Sari' },
  cadre: { label: 'Kader', home: '/kader', person: 'Kader Rina' },
  midwife: { label: 'Bidan', home: '/kader', person: 'Bidan Lestari' },
}

const read = () => {
  try { return sessionStorage.getItem('posify-role') } catch { return null }
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(read)
  const login = useCallback((r) => {
    setRole(r)
    try { sessionStorage.setItem('posify-role', r) } catch {}
  }, [])
  const logout = useCallback(() => {
    setRole(null)
    try { sessionStorage.removeItem('posify-role') } catch {}
  }, [])
  return <Ctx.Provider value={{ role, login, logout, user: role ? ROLES[role] : null }}>{children}</Ctx.Provider>
}

export function Guard({ allow, children }) {
  const { role } = useAuth()
  if (!role) return <Navigate to="/masuk" replace />
  if (!allow.includes(role)) return <Navigate to={ROLES[role].home} replace />
  return children
}

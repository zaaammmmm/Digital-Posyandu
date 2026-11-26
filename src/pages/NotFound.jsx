import { motion } from 'framer-motion'
import { TLink } from '../context/Transition.jsx'
import { Blobs, Icon, Logo } from '../components/ui.jsx'

export default function NotFound() {
  return (
    <div className="center-page">
      <Blobs />
      <motion.div className="nf" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
        <Logo />
        <h1>404</h1>
        <p>Halaman ini belum ada di buku kami.</p>
        <TLink to="/" className="btn btn-pri">Kembali ke beranda <Icon n="arrow" size={18} /></TLink>
      </motion.div>
    </div>
  )
}

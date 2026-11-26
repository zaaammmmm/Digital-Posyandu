import { Route, Routes } from 'react-router-dom'
import Shell from './components/Shell.jsx'
import { Guard } from './context/Auth.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import { ParentHome, ParentGrowth, ParentImmun, ParentSummary, ParentFix } from './pages/Parent.jsx'
import { CadreHome, CadreKids, CadreVisit, CadreVerify, CadreRecap, CadreBooks } from './pages/Cadre.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/masuk" element={<Login />} />
      <Route path="/ortu" element={<Guard allow={['parent']}><Shell kind="parent" /></Guard>}>
        <Route index element={<ParentHome />} />
        <Route path="pertumbuhan" element={<ParentGrowth />} />
        <Route path="imunisasi" element={<ParentImmun />} />
        <Route path="ringkasan" element={<ParentSummary />} />
        <Route path="koreksi" element={<ParentFix />} />
      </Route>
      <Route path="/kader" element={<Guard allow={['cadre', 'midwife']}><Shell kind="cadre" /></Guard>}>
        <Route index element={<CadreHome />} />
        <Route path="anak" element={<CadreKids />} />
        <Route path="kunjungan" element={<CadreVisit />} />
        <Route path="verifikasi" element={<CadreVerify />} />
        <Route path="rekap" element={<CadreRecap />} />
        <Route path="buku" element={<CadreBooks />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

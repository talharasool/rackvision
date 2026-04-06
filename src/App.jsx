import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NewInspection from './pages/NewInspection'
import WorkingAreas from './pages/WorkingAreas'
import RackList from './pages/RackList'
import LayoutEditor from './pages/LayoutEditor'
import BayEditorPage from './pages/BayEditorPage'
import FrameEditorPage from './pages/FrameEditorPage'
import RenewalsPage from './pages/RenewalsPage'
import BeamEditorPage from './pages/BeamEditorPage'
import FrameDatabaseEditorPage from './pages/FrameDatabaseEditorPage'
import SupplierEditorPage from './pages/SupplierEditorPage'
import Header from './components/Layout/Header'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/new-inspection" element={<NewInspection />} />
            <Route path="/renewals" element={<RenewalsPage />} />
            <Route path="/editors/beams" element={<BeamEditorPage />} />
            <Route path="/editors/frames" element={<FrameDatabaseEditorPage />} />
            <Route path="/editors/suppliers" element={<SupplierEditorPage />} />
            <Route path="/inspection/:inspectionId/areas" element={<WorkingAreas />} />
            <Route path="/inspection/:inspectionId/area/:areaId/racks" element={<RackList />} />
            <Route path="/inspection/:inspectionId/area/:areaId/layout" element={<LayoutEditor />} />
            <Route path="/inspection/:inspectionId/area/:areaId/rack/:rackId/bay/:bayId" element={<BayEditorPage />} />
            <Route path="/inspection/:inspectionId/area/:areaId/rack/:rackId/frame/:frameId" element={<FrameEditorPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

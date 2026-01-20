import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Secretaire from './pages/Secretaire';
import Etudiant from './pages/Etudiant';
import Entreprise from './pages/Entreprise';
import Enseignant from './pages/Enseignant';
import RegisterEntreprise from './pages/RegisterEntreprise';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Page de connexion */}
          <Route path="/login" element={<Login />} />
          <Route path="/register/entreprise" element={<RegisterEntreprise />} />

          {/* Routes protégées Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées Secrétaire */}
          <Route
            path="/secretaire"
            element={
              <ProtectedRoute allowedRoles={['SECRETAIRE']}>
                <Secretaire />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées Étudiant */}
          <Route
            path="/etudiant"
            element={
              <ProtectedRoute allowedRoles={['ETUDIANT']}>
                <Etudiant />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées Enseignant Responsable */}
          <Route
            path="/enseignant"
            element={
              <ProtectedRoute allowedRoles={['ENSEIGNANT RESPONSABLE']}>
                <Enseignant />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées Entreprise */}
          <Route
            path="/entreprise"
            element={
              <ProtectedRoute allowedRoles={['ENTREPRISE']}>
                <Entreprise />
              </ProtectedRoute>
            }
          />

          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Page 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

// Ficheiro: frontend-simec/src/components/AppLayout.jsx
// VERSÃO FINAL SÊNIOR - SEM O BOTÃO DE MENU DESNECESSÁRIO

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
// --- CORREÇÃO APLICADA AQUI: Usando o alias '@' ---
import { useAlertas } from '@/contexts/AlertasContext';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faBell, faExclamationCircle, faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';

function AppLayout() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // O estado para o menu móvel não é mais necessário
  // const [isSidebarMobileOpen, setSidebarMobileOpen] = useState(false); 

  const notificationRef = useRef(null);
  
  const { alertas = [], updateStatus } = useAlertas();
  const { user, logout } = useAuth();
  
  const location = useLocation();

  useEffect(() => {
    document.body.className = '';
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    // A lógica para fechar o menu móvel não é mais necessária
    // setSidebarMobileOpen(false);
  }, [location.pathname]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleMarcarTodasComoVistas = () => {
    const alertasNaoVistos = alertas.filter(a => a.status === 'NaoVisto');
    alertasNaoVistos.forEach(notif => updateStatus(notif.id, 'Visto'));
    setIsDropdownOpen(false);
  };

  const alertasNaoVistos = alertas.filter(a => a.status === 'NaoVisto');

  return (
    // A classe para o menu móvel foi removida do container principal
    <div className="app-container">
      <Sidebar notificacoesCount={alertasNaoVistos.length} />
      {/* O overlay do menu móvel não é mais necessário */}

      <div className="main-content-wrapper">
        <header className="header-actions">
          
          {/* ========================================================================== */}
          {/*  !!! O BOTÃO DE MENU E SEU WRAPPER FORAM REMOVIDOS DAQUI !!!
          /* ========================================================================== */}

          {/* Container para todos os itens que devem ficar à direita */}
          <div className="header-right-actions">
            <span className="user-greeting">Olá, {user?.nome}</span>
            <button onClick={logout} className="header-action-btn" title="Sair">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
            <div className="notification-bell" ref={notificationRef}>
              <button className="header-action-btn" onClick={() => setIsDropdownOpen(prev => !prev)}>
                <FontAwesomeIcon icon={faBell} />
                {alertasNaoVistos.length > 0 && <span className="notification-badge">{alertasNaoVistos.length > 9 ? '9+' : alertasNaoVistos.length}</span>}
              </button>
              {isDropdownOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                      <span>Notificações</span>
                      {alertasNaoVistos.length > 0 && <button className="limpar-btn" onClick={handleMarcarTodasComoVistas}>Marcar todas como vistas</button>}
                    </div>
                    <ul>
                      {alertasNaoVistos.length > 0 ? (
                        alertasNaoVistos.slice(0, 5).map(notif => (
                          <li key={notif.id}>
                            <Link to={notif.link || "/alertas"} onClick={() => setIsDropdownOpen(false)}>
                              <FontAwesomeIcon icon={faExclamationCircle} className={`icon-prioridade-${notif.prioridade?.toLowerCase()}`} />
                              <span>{notif.titulo}</span>
                            </Link>
                          </li>
                        ))
                      ) : <li className="no-notifications">Nenhuma nova notificação.</li>}
                    </ul>
                    <div className="dropdown-footer"><Link to="/alertas" onClick={() => setIsDropdownOpen(false)}>Ver todos os alertas</Link></div>
                </div>
              )}
            </div>
            <button onClick={toggleTheme} className="header-action-btn" title="Mudar Tema">
              <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
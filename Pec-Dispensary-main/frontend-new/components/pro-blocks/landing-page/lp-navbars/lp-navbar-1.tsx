"use client";

import { Logo } from "@/components/pro-blocks/logo";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { isAuthenticated, logout, getUser, isPatient, isDoctor } from "../../../../src/lib/auth";
import { useNavigate, useLocation } from "react-router-dom";

const MENU_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
] as const;

const PATIENT_MENU_ITEMS = [
  { label: "Book Appointment", href: "/appointments/book" },
  { label: "Feedback", href: "/feedback" },
  { label: "Health Alerts", href: "/alerts" },
  { label: "Doctors", href: "/doctors" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

const DOCTOR_MENU_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Feedback Analytics", href: "/doctor/feedback" },
  { label: "Health Alerts", href: "/alerts" },
] as const;

interface NavMenuItemsProps {
  className?: string;
  isPatient?: boolean;
  isDoctor?: boolean;
  currentPath?: string;
}

const NavMenuItems = ({ className, isPatient: showPatientItems, isDoctor: showDoctorItems, currentPath }: NavMenuItemsProps) => {
  const items = showDoctorItems ? DOCTOR_MENU_ITEMS : showPatientItems ? PATIENT_MENU_ITEMS : MENU_ITEMS;
  return (
    <div className={`flex flex-col gap-1 md:flex-row ${className ?? ""}`}>
      {items.map(({ label, href }) => {
        const isActive = currentPath === href || (href.startsWith('#') && currentPath === '/');
        return (
          <a key={label} href={href}>
            <Button 
              variant="ghost" 
              className={`w-full md:w-auto text-white hover:text-white hover:bg-gray-800 ${isActive ? 'bg-gray-800 text-white' : ''}`}
            >
              {label}
            </Button>
          </a>
        );
      })}
    </div>
  );
};

export function LpNavbar1() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userIsPatient, setUserIsPatient] = useState(false);
  const [userIsDoctor, setUserIsDoctor] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    if (authStatus) {
      setUserIsPatient(isPatient());
      setUserIsDoctor(isDoctor());
    }
  }, []);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUserIsPatient(false);
    setUserIsDoctor(false);
    navigate('/');
  };

  return (
    <nav className="bg-black sticky top-0 isolate z-50 border-b border-gray-800 py-3.5 md:py-4">
      <div className="relative container m-auto flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center justify-between">
          <a href="/">
            <Logo />
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden w-full flex-row justify-end gap-5 md:flex">
          <NavMenuItems isPatient={authenticated && userIsPatient} isDoctor={authenticated && userIsDoctor} currentPath={location.pathname} />
          {authenticated ? (
            <>
              <Button onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button onClick={() => navigate('/register/patient')}>Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="flex w-full flex-col justify-end gap-5 pb-2.5 md:hidden">
            <NavMenuItems isPatient={authenticated && userIsPatient} isDoctor={authenticated && userIsDoctor} currentPath={location.pathname} />
            {authenticated ? (
              <>
                <Button onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button className="w-full" onClick={() => navigate('/register/patient')}>Get Started</Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
